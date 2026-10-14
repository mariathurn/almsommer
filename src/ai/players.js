// The computer players: whether to announce a game, and which card to play.
// Rule-based, the way a decent Schafkopf player thinks: count trumps before
// announcing; while playing, know your partner, smear points onto a trick
// your partner wins, take tricks worth having, search for the called sheep,
// and give opponents as few points as possible.

import { canCallAce, canPlayCard, getPlainRank, getTrumpStrength, isTrumpForGame, parseGame } from "./schafkopfAI.js";
import { getCardPoints } from "./scoring.js";

const suits = ["acorn", "leaf", "heart", "bell"];

// How games outrank each other when several players want to play.
export const GAME_RANK = { "Sau Spiel": 1, Marriage: 1, Wenz: 2, Solo: 3 };

export function getGameRank(gameName) {
    return GAME_RANK[parseGame(gameName).base] ?? 0;
}

const count = (cards, test) => cards.filter(test).length;
// A Solo with five trumps needs this many shepherds and dogs among them.
const SOLO_HIGH_TRUMPS = 3;

// --- Announcing -------------------------------------------------------------

// The game this hand wants to announce, if it beats `minRank` (the best game
// announced so far), or null to pass. Hands have six cards; 12 of the 24 cards
// are trumps in a Sheep Game or Solo, so three trumps is an average hand.
export function decideAnnouncement(hand, minRank = 0) {
    const options = [];

    // Solo: six trumps in one suit, or five high ones (at least three shepherds
    // or dogs) with a sheep as the sixth card.
    for (const suit of suits) {
        const game = `Solo:${suit}`;
        const trumps = hand.filter((card) => isTrumpForGame(card, game));
        const high = count(trumps, (card) => card.rank === "O" || card.rank === "U");
        const plainSheep = hand.some((card) => card.rank === "A" && !isTrumpForGame(card, game));
        if (trumps.length === 6 || (trumps.length === 5 && high >= SOLO_HIGH_TRUMPS && plainSheep)) {
            options.push({ game, rank: 3, strength: trumps.length * 10 + high });
        }
    }

    // Dog Game: three dogs, or two dogs including the blue one plus two sheep.
    const dogs = count(hand, (card) => card.rank === "U");
    const sheep = count(hand, (card) => card.rank === "A");
    const blueDog = hand.some((card) => card.rank === "U" && card.suit === "acorn");
    if (dogs >= 3 || (dogs >= 2 && blueDog && sheep >= 2)) {
        options.push({ game: "Wenz", rank: 2, strength: dogs });
    }

    // Sheep Game: four trumps, or three with two shepherds or dogs, and a sheep to call.
    const sheepTrumps = hand.filter((card) => isTrumpForGame(card, "Sau Spiel"));
    const sheepHigh = count(sheepTrumps, (card) => card.rank === "O" || card.rank === "U");
    const callable = ["bell", "acorn", "leaf"].filter((suit) => canCallAce(suit, hand));
    if (callable.length && (sheepTrumps.length >= 4 || (sheepTrumps.length >= 3 && sheepHigh >= 2))) {
        // Call the sheep of the colour we hold least of, so the partner can take it.
        const calledAce = callable.reduce((best, suit) =>
            count(hand, (c) => c.suit === suit && !isTrumpForGame(c, "Sau Spiel")) <
            count(hand, (c) => c.suit === best && !isTrumpForGame(c, "Sau Spiel"))
                ? suit
                : best
        );
        options.push({ game: "Sau Spiel", calledAce, rank: 1, strength: sheepTrumps.length });
    }

    const best = options
        .filter((option) => option.rank > minRank)
        .sort((a, b) => b.rank - a.rank || b.strength - a.strength)[0];
    return best ? { game: best.game, calledAce: best.calledAce ?? null } : null;
}

// --- Playing ----------------------------------------------------------------

// Which played card wins the trick so far (index into `trick`).
export function getWinningIndex(trick, gameName) {
    const ledSuit = trick[0].card.suit;
    let best = 0;
    trick.forEach(({ card }, index) => {
        const current = trick[best].card;
        const trumpNew = getTrumpStrength(card, gameName);
        const trumpBest = getTrumpStrength(current, gameName);
        if (trumpNew || trumpBest) {
            if (trumpNew > trumpBest) best = index;
        } else if (card.suit === ledSuit && (current.suit !== ledSuit || getPlainRank(card) > getPlainRank(current))) {
            best = index;
        }
    });
    return best;
}

// Who this player knows to be on their side: "partner", "opponent" or "unknown".
export function getRelation(me, other, { gameName, caller, teams, revealedAceOwner, calledAce, myHand }) {
    if (me === other) return "partner";
    const { base } = parseGame(gameName);
    if (base === "Ramsch") return "opponent";
    if (base === "Solo" || base === "Wenz" || base === "Marriage") {
        if (base === "Marriage") return teams.callerTeam.includes(me) === teams.callerTeam.includes(other) ? "partner" : "opponent";
        return (me === caller) === (other === caller) ? "partner" : "opponent";
    }
    // Sheep Game: the holder of the called sheep knows; everyone knows once it's played.
    const iHoldSheep = myHand?.some((c) => c.suit === calledAce && c.rank === "A") || revealedAceOwner === me;
    const sameSide = teams.callerTeam.includes(me) === teams.callerTeam.includes(other);
    if (revealedAceOwner || iHoldSheep) return sameSide ? "partner" : "opponent";
    if (me === caller || other === caller) return "opponent";
    return "unknown";
}

const points = (card) => getCardPoints(card);
const byPointsAsc = (a, b) => points(a) - points(b);

// The card a computer player plays: an index into `hand`.
export function chooseCard({ me, hand, playedCards, gameName, calledAce, caller, teams, revealedAceOwner }) {
    const legal = hand.filter((card) => canPlayCard(card, hand, playedCards, gameName, calledAce));
    const options = legal.length ? legal : hand;
    const trump = (card) => isTrumpForGame(card, gameName);
    const strength = (card) => getTrumpStrength(card, gameName) * 100 + getPlainRank(card);
    const weakest = (cards) => [...cards].sort((a, b) => points(a) - points(b) || strength(a) - strength(b))[0];
    const pick = (card) => hand.indexOf(card);
    const relation = (other) =>
        getRelation(me, other, { gameName, caller, teams, revealedAceOwner, calledAce, myHand: hand });
    const isRamsch = parseGame(gameName).base === "Ramsch";
    const onCallerSide = teams.callerTeam.includes(me) && (me === caller || relation(caller) === "partner");

    // Leading the trick.
    if (playedCards.length === 0) {
        if (isRamsch) return pick(weakest(options));
        const trumps = options.filter(trump);
        // The announcing side pulls trumps with its strongest ones.
        if (onCallerSide && trumps.length >= 2) {
            return pick([...trumps].sort((a, b) => strength(b) - strength(a))[0]);
        }
        // Opponents in a Sheep Game search for the called sheep.
        if (parseGame(gameName).base === "Sau Spiel" && calledAce && !onCallerSide) {
            const search = options.filter((c) => c.suit === calledAce && !trump(c));
            if (search.length) return pick(weakest(search));
        }
        // Cash a sheep in a colour, otherwise lead something cheap.
        const plainSheep = options.find((c) => c.rank === "A" && !trump(c));
        if (plainSheep) return pick(plainSheep);
        const plain = options.filter((c) => !trump(c));
        return pick(weakest(plain.length ? plain : options));
    }

    // Following.
    const winnerIndex = getWinningIndex(playedCards, gameName);
    const winner = playedCards[winnerIndex].player;
    const isLast = playedCards.length === 3;
    const trickValue = playedCards.reduce((sum, { card }) => sum + points(card), 0);
    const wouldWin = (card) => getWinningIndex([...playedCards, { player: me, card }], gameName) === playedCards.length;
    const winners = options.filter(wouldWin);
    const losers = options.filter((card) => !wouldWin(card));

    if (isRamsch) {
        // Don't take tricks: play the highest card that still loses, else dump the highest.
        if (losers.length) return pick([...losers].sort((a, b) => strength(b) - strength(a) || points(b) - points(a))[0]);
        return pick([...options].sort((a, b) => strength(b) - strength(a))[0]);
    }

    if (relation(winner) === "partner") {
        const partnerSafe = isLast || getTrumpStrength(playedCards[winnerIndex].card, gameName) >= 20;
        if (partnerSafe) {
            // Smear: give the partner as many points as possible, but keep strong trumps.
            const smear = [...options].sort((a, b) => points(b) - points(a) || strength(a) - strength(b))[0];
            if (!trump(smear) || getTrumpStrength(smear, gameName) < 20) return pick(smear);
        }
        return pick(weakest(losers.length ? losers : options));
    }

    // An opponent (or someone unknown) is winning.
    if (winners.length && (isLast || trickValue >= 4 || parseGame(gameName).base !== "Sau Spiel")) {
        if (isLast) {
            // Take it as cheaply as possible, with as many points as possible.
            return pick([...winners].sort((a, b) => strength(a) - strength(b) || points(b) - points(a))[0]);
        }
        // Others still play after us: for a rich trick win with something they
        // can't easily beat, otherwise with the cheapest winning card.
        const sorted = [...winners].sort((a, b) => strength(a) - strength(b));
        return pick(trickValue >= 10 ? sorted[sorted.length - 1] : sorted[0]);
    }
    return pick(weakest(losers.length ? losers : options));
}
