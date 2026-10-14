const rankValue = {
    "9": 1,
    K: 2,
    "10": 3,
    A: 4,
    U: 5,
    O: 6,
};

const validAceCalls = ["bell", "acorn", "leaf"];

// Colour order for shepherds and dogs: blue (acorn) > green > red > orange.
const suitStrength = { acorn: 4, leaf: 3, heart: 2, bell: 1 };
// Order of non-trump cards within a colour (a shepherd only appears here in the Dog Game).
const plainRank = { A: 6, "10": 5, K: 4, O: 3, U: 2, "9": 1 };

// A Solo carries its trump suit in the game value: "Solo:leaf".
export function parseGame(gameName = "Pass") {
    const [base, suit] = String(gameName).split(":");
    return { base, suit: suit ?? null };
}

// How strong a trump is in the given game (higher wins), or 0 if the card is
// not a trump. Dog Game: only the dogs. Solo: shepherds, dogs, then the chosen
// suit. Every other game: shepherds, dogs, then the red cards.
export function getTrumpStrength(card, gameName = "Pass") {
    if (!card) return 0;
    const { base, suit } = parseGame(gameName);
    if (base === "Wenz") {
        return card.rank === "U" ? 10 + suitStrength[card.suit] : 0;
    }
    const trumpSuit = base === "Solo" && suit ? suit : "heart";
    if (card.rank === "O") return 20 + suitStrength[card.suit];
    if (card.rank === "U") return 10 + suitStrength[card.suit];
    if (card.suit === trumpSuit) return rankValue[card.rank];
    return 0;
}

export function isTrumpForGame(card, gameName = "Pass") {
    return getTrumpStrength(card, gameName) > 0;
}

// Rank of a card within its colour when it is not a trump.
export function getPlainRank(card) {
    return plainRank[card.rank];
}

// Hand order for a game: trumps from strongest to weakest on the left, then
// the other cards by colour (blue, green, red, orange), highest first.
export function sortHandForGame(hand, gameName) {
    const colourOrder = ["acorn", "leaf", "heart", "bell"];
    return [...hand].sort((a, b) => {
        const trumpDiff = getTrumpStrength(b, gameName) - getTrumpStrength(a, gameName);
        if (trumpDiff !== 0) return trumpDiff;
        if (isTrumpForGame(a, gameName)) return 0;
        const colourDiff = colourOrder.indexOf(a.suit) - colourOrder.indexOf(b.suit);
        return colourDiff !== 0 ? colourDiff : getPlainRank(b) - getPlainRank(a);
    });
}

// A sheep (ace) can be called if it is a regular sheep (the red one is a
// trump), the caller doesn't hold it, and the caller holds a regular card of
// the same colour.
export function canCallAce(aceSuit, hand = []) {
    if (!aceSuit || !validAceCalls.includes(aceSuit)) {
        return false;
    }

    const holdsAce = hand.some((card) => card.suit === aceSuit && card.rank === "A");
    const holdsRegularOfSuit = hand.some(
        (card) => card.suit === aceSuit && !isTrumpForGame(card, "Sau Spiel")
    );

    return !holdsAce && holdsRegularOfSuit;
}

export function getPartnerForCalledAce(calledAceSuit, players, callerName) {
    if (!calledAceSuit || !players || !callerName) {
        return null;
    }

    const partner = Object.entries(players).find(
        ([playerName, hand]) =>
            playerName !== callerName &&
            hand.some((card) => card.suit === calledAceSuit && card.rank === "A")
    );

    return partner ? partner[0] : null;
}

export function getSauSpielTeams(players, callerName, calledAceSuit) {
    if (!players || !callerName) {
        return { callerTeam: [], opposingTeam: [] };
    }

    const partnerName = getPartnerForCalledAce(calledAceSuit, players, callerName);
    const callerTeam = partnerName ? [callerName, partnerName] : [callerName];
    const opposingTeam = Object.keys(players).filter(
        (playerName) => !callerTeam.includes(playerName)
    );

    return { callerTeam, opposingTeam };
}

export function getTeamForPlayer(playerName, players, callerName, calledAceSuit) {
    const { callerTeam, opposingTeam } = getSauSpielTeams(players, callerName, calledAceSuit);

    if (callerTeam.includes(playerName)) {
        return "callerTeam";
    }

    if (opposingTeam.includes(playerName)) {
        return "opposingTeam";
    }

    return null;
}

// Seat label for a Sau Spiel. The partner stays hidden until the called ace
// is played, so before that every non-caller is "Unknown".
export function getSauSpielStatus(playerName, callerName, teams, revealedAceOwner) {
    if (playerName === callerName) return "Caller";
    if (!revealedAceOwner) return "Unknown";
    return teams.callerTeam.includes(playerName) ? "Partner" : "Opponent";
}

// Schafkopf rules for whoever holds the called sheep ("Rufsau") in a Sheep
// Game. Returns true/false when one of them decides, or null otherwise.
// - When the called colour is led ("gesucht"), the sheep must be played.
// - Leading: the called colour may only be led with the sheep itself, unless
//   the holder has four or more cards of that colour ("davonlaufen").
// - The sheep may not be thrown off on another colour or on trumps, except
//   in the last trick.
function checkCalledSheep(card, hand, playedCards, gameName, calledAce) {
    if (parseGame(gameName).base !== "Sau Spiel" || !calledAce) return null;
    const isSheep = (c) => c.suit === calledAce && c.rank === "A";
    if (!hand.some(isSheep)) return null;
    const plainOfColour = (c) => c.suit === calledAce && !isTrumpForGame(c, gameName);

    if (playedCards.length === 0) {
        if (plainOfColour(card) && !isSheep(card)) return hand.filter(plainOfColour).length >= 4;
        return null;
    }

    const led = playedCards[0].card;
    if (plainOfColour(led)) return isSheep(card);
    if (isSheep(card)) return hand.length === 1;
    return null;
}

export function canPlayCard(card, hand, playedCards, gameName = "Pass", calledAce = null) {
    // Sheep Game: the holder of the called sheep is bound by extra rules.
    const calledRule = checkCalledSheep(card, hand, playedCards, gameName, calledAce);
    if (calledRule !== null) return calledRule;

    // If this is the first card of the trick, any card is legal
    if (playedCards.length === 0) {
        return true;
    }

    const ledCard = playedCards[0].card;
    const ledIsTrump = isTrumpForGame(ledCard, gameName);

    // If trump was led, you must follow with trump if you have it
    if (ledIsTrump) {
        const hasTrump = hand.some((c) => isTrumpForGame(c, gameName));
        if (hasTrump) {
            return isTrumpForGame(card, gameName);
        }
        // No trump available, any card is legal
        return true;
    }

    // If a regular suit was led, you must play that suit if you have it.
    // Shepherds and dogs of that colour are trumps and don't count as it.
    const ledSuit = ledCard.suit;
    if (card.suit === ledSuit && !isTrumpForGame(card, gameName)) {
        return true;
    }

    // Check if player has cards of the led suit
    const hasLedSuit = hand.some((c) => c.suit === ledSuit && !isTrumpForGame(c, gameName));

    // Only allowed to play a different non-trump suit if you don't have the led suit
    if (!hasLedSuit) {
        return true;
    }

    return false;
}

export function getAIMove(hand, playedCards, gameName = "Pass") {
    if (!hand || hand.length === 0) return 0;

    // If this is the first card (leading), play lowest non-trump to preserve trump
    if (playedCards.length === 0) {
        const nonTrumpCards = hand.filter((c) => !isTrumpForGame(c, gameName));
        if (nonTrumpCards.length > 0) {
            const lowestRank = Math.min(...nonTrumpCards.map((c) => rankValue[c.rank]));
            return hand.findIndex(
                (c) => !isTrumpForGame(c, gameName) && rankValue[c.rank] === lowestRank
            );
        }
        // All cards are trump, play lowest trump
        const lowestRank = Math.min(...hand.map((c) => rankValue[c.rank]));
        return hand.findIndex((c) => rankValue[c.rank] === lowestRank);
    }

    const ledCard = playedCards[0].card;
    const ledIsTrump = isTrumpForGame(ledCard, gameName);

    // If trump was led, must follow with trump
    if (ledIsTrump) {
        const trumpCards = hand.filter((c) => isTrumpForGame(c, gameName));
        if (trumpCards.length > 0) {
            const lowestRank = Math.min(...trumpCards.map((c) => rankValue[c.rank]));
            return hand.findIndex((c) => isTrumpForGame(c, gameName) && rankValue[c.rank] === lowestRank);
        }
        // No trump, play lowest card
        const lowestRank = Math.min(...hand.map((c) => rankValue[c.rank]));
        return hand.findIndex((c) => rankValue[c.rank] === lowestRank);
    }

    // Regular suit was led
    const ledSuit = ledCard.suit;
    const sameSuitCards = hand.filter((c) => c.suit === ledSuit && !isTrumpForGame(c, gameName));

    // If we have cards of the led suit (non-trump), play lowest
    if (sameSuitCards.length > 0) {
        const lowestRank = Math.min(...sameSuitCards.map((c) => rankValue[c.rank]));
        return hand.findIndex(
            (c) => c.suit === ledSuit && !isTrumpForGame(c, gameName) && rankValue[c.rank] === lowestRank
        );
    }

    // Can't follow suit, play lowest non-trump card if possible
    const nonTrumpCards = hand.filter((c) => !isTrumpForGame(c, gameName));
    if (nonTrumpCards.length > 0) {
        const lowestRank = Math.min(...nonTrumpCards.map((c) => rankValue[c.rank]));
        return hand.findIndex(
            (c) => !isTrumpForGame(c, gameName) && rankValue[c.rank] === lowestRank
        );
    }

    // Must play trump, play lowest
    const lowestRank = Math.min(...hand.map((c) => rankValue[c.rank]));
    return hand.findIndex((c) => rankValue[c.rank] === lowestRank);
}
// Marriage ("Hochzeit"): a player holding exactly one trump may offer it face
// down, before anyone announces a game. Starting with the player to their
// left, each is asked in turn whether to accept. A computer player accepts
// with four good trumps (shepherds, dogs, the red sheep or red grain). The
// partner takes the trump and gives back a card (their weakest non-trump).
// This game has no forced marriage: if nobody accepts, announcing goes on.
const seatOrder = ["south", "west", "north", "east"];
export const MARRIAGE_GOOD_TRUMPS = 4;

const countTrumps = (hand, gameName = "Marriage") => hand.filter((card) => isTrumpForGame(card, gameName)).length;

export function canOfferMarriage(hand) {
    return countTrumps(hand) === 1;
}

export function isGoodTrump(card) {
    if (!isTrumpForGame(card, "Marriage")) return false;
    return card.rank === "O" || card.rank === "U" || (card.suit === "heart" && (card.rank === "A" || card.rank === "10"));
}

export function wantsToAcceptMarriage(hand) {
    return hand.filter(isGoodTrump).length >= MARRIAGE_GOOD_TRUMPS;
}

// The players asked, in order, when `offerer` offers a marriage.
export function marriageAskOrder(offerer) {
    const start = seatOrder.indexOf(offerer);
    return [1, 2, 3].map((step) => seatOrder[(start + step) % seatOrder.length]);
}

// The card swap once `partner` accepted. Returns { trump, given, players }.
export function swapMarriageCards(players, offerer, partner, gameName = "Marriage") {
    const hand = players[offerer];
    const trump = hand.find((card) => isTrumpForGame(card, gameName));
    const partnerHand = players[partner];
    const plain = partnerHand.filter((card) => !isTrumpForGame(card, gameName));
    const pool = plain.length ? plain : partnerHand;
    const given = pool.reduce((low, card) => ((plainRank[card.rank] ?? 0) < (plainRank[low.rank] ?? 0) ? card : low));
    return {
        trump,
        given,
        players: {
            ...players,
            [offerer]: [...hand.filter((card) => card !== trump), given],
            [partner]: [...partnerHand.filter((card) => card !== given), trump],
        },
    };
}

// Asks the computer players in turn (for tests and simple uses).
// Returns { partner, trump, given, players }; partner is null if nobody accepts.
export function resolveMarriage(players, offerer = "south") {
    const partner = marriageAskOrder(offerer).find((seat) => wantsToAcceptMarriage(players[seat]));
    if (!canOfferMarriage(players[offerer]) || !partner) return { partner: null, trump: null, given: null, players };
    return { partner, ...swapMarriageCards(players, offerer, partner) };
}
