import { useState, useEffect, useRef, useCallback } from "react";
import { combinations } from "../assets/CardDeck";
import { getTrickPoints, scoreRound } from "../ai/scoring";
import { chooseCard, decideAnnouncement, decideKontra, decideRetour, getGameRank } from "../ai/players";
import { getGameType } from "../data/gameTypes";
import {
    canPlayCard,
    getPlainRank,
    getSauSpielTeams,
    getTrumpStrength,
    isTrumpForGame,
    parseGame,
    canOfferMarriage,
    marriageCandidates,
    swapMarriageCards,
    wantsToAcceptMarriage,
} from "../ai/schafkopfAI";

// Timing constants - adjust these to change all delays at once
// Milliseconds an opponent "thinks" before playing. A finished trick stays on
// the table until the player collects it (collectTrick), so there is no timer.
const AI_PLAY_DELAY = 900;
// Milliseconds a computer player takes to decide whether to announce a game.
const AI_BID_DELAY = 1100;
// While Maria can answer a Kontra with Retour, the others play slower, so she
// has time to decide.
const AI_PLAY_DELAY_RETOUR = 2600;
// Milliseconds the computer caller takes to answer a Kontra.
const AI_RETOUR_DELAY = 600;

const initialPlayers = {
    south: [],
    west: [],
    north: [],
    east: [],
};

const playerOrder = ["south", "west", "north", "east"];
// The four seats in play order, starting with `seat`.
const rotateFrom = (seat) => {
    const start = playerOrder.indexOf(seat);
    return playerOrder.map((_, i) => playerOrder[(start + i) % playerOrder.length]);
};

function isTrump(card, gameName = "Pass") {
    return isTrumpForGame(card, gameName);
}

const shuffleDeck = (deck) => {
    const nextDeck = [...deck];

    for (let i = nextDeck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [nextDeck[i], nextDeck[j]] = [nextDeck[j], nextDeck[i]];
    }

    return nextDeck;
};

const getTrickWinner = (cards, gameName = "Pass") => {
    const ledCard = cards[0].card;
    const ledSuit = ledCard.suit;

    return cards.reduce((best, current) => {
        const bestCard = best.card;
        const currentCard = current.card;

        const bestIsTrump = isTrump(bestCard, gameName);
        const currentIsTrump = isTrump(currentCard, gameName);

        // Trump beats non-trump
        if (currentIsTrump && !bestIsTrump) {
            return current;
        }
        if (bestIsTrump && !currentIsTrump) {
            return best;
        }

        // Both trump: the stronger trump wins
        if (bestIsTrump && currentIsTrump) {
            return getTrumpStrength(currentCard, gameName) > getTrumpStrength(bestCard, gameName) ? current : best;
        }

        // Neither trump: only led suit can win
        if (bestCard.suit !== ledSuit && currentCard.suit === ledSuit) {
            return current;
        }
        if (bestCard.suit === ledSuit && currentCard.suit !== ledSuit) {
            return best;
        }

        // Both same suit: higher rank wins
        if (bestCard.suit === currentCard.suit) {
            return getPlainRank(currentCard) > getPlainRank(bestCard) ? current : best;
        }

        return best;
    }, cards[0]);
};

// paused: while true the computer players wait (the pause menu is open);
// a pending move is cancelled and scheduled again on resume.
// allowDoubling: whether Kontra and Retour can be said (not in lessons).
function useSchafkopfGame({ paused = false, allowDoubling = true } = {}) {
    const [players, setPlayers] = useState(initialPlayers);
    // Hands as dealt. Teams are derived from these, because the called ace
    // leaves its owner's hand once it is played.
    const [dealtHands, setDealtHands] = useState(initialPlayers);
    const [currentTurn, setCurrentTurn] = useState("south");
    const [playedCards, setPlayedCards] = useState([]);
    const [trickWinner, setTrickWinner] = useState(null);
    const [selectedGame, setSelectedGame] = useState("Pass");
    const [calledAce, setCalledAce] = useState(null);
    const [teams, setTeams] = useState({ callerTeam: [], opposingTeam: [] });
    const [revealedAceOwner, setRevealedAceOwner] = useState(null);
    // Card points each player has taken in tricks this round.
    const [trickPoints, setTrickPoints] = useState({ south: 0, west: 0, north: 0, east: 0 });
    // The last trick collected this round, to look at again: { cards, winner }.
    const [lastTrick, setLastTrick] = useState(null);
    // Tricks each player has taken this round.
    const [trickCounts, setTrickCounts] = useState({ south: 0, west: 0, north: 0, east: 0 });
    // Set when the last trick is collected: winners, losers and coin changes.
    const [roundResult, setRoundResult] = useState(null);
    // Marriage outcome: { partner, trump, given } (only set once someone accepted).
    const [marriage, setMarriage] = useState(null);
    const [humanPlayer] = useState("south");
    // Rounds dealt so far. The first round Maria leads; then the lead (and
    // the first say in announcing) moves on clockwise every round.
    const [roundNumber, setRoundNumber] = useState(0);
    const [forehand, setForehand] = useState("south");
    // Who announced the game being played (null for the Cowards Game).
    const [caller, setCaller] = useState(null);
    // Announcing, after the deal: each player in turn from the forehand
    // announces a game that beats the best so far, or passes.
    // { order, index, best: { seat, game, calledAce } | null }
    const [bidding, setBidding] = useState(null);
    // The latest decision while announcing, for the banner: { seat, game }.
    const [lastBid, setLastBid] = useState(null);
    // A marriage offer being answered, before announcing:
    // { offerer, stage: "offer" (Maria deciding to offer) | "ask", order, index, lead, declinedBy }
    const [marriageOffer, setMarriageOffer] = useState(null);
    // Kontra and Retour, each doubling the game: { kontra: seat | null, retour: bool }.
    const [doubling, setDoubling] = useState({ kontra: null, retour: false });
    const aiTimeoutRef = useRef(null);
    const isProcessingRef = useRef(false);  // Prevent concurrent plays
    const gameStateRef = useRef({ players: initialPlayers, currentTurn: "south", playedCards: [] });

    // Stop a pending AI move when the game screen is left.
    useEffect(() => () => clearTimeout(aiTimeoutRef.current), []);

    // Keep gameStateRef in sync with current state
    useEffect(() => {
        gameStateRef.current = { players, currentTurn, playedCards };
    }, [players, currentTurn, playedCards]);

    useEffect(() => {
        const base = parseGame(selectedGame).base;
        if (base !== "Sau Spiel") {
            setCalledAce(null);
            setRevealedAceOwner(null);
            // One against three in a Solo or Dog Game; a Marriage sets its
            // teams when it is agreed.
            if ((base === "Solo" || base === "Wenz") && caller) {
                setTeams({ callerTeam: [caller], opposingTeam: playerOrder.filter((p) => p !== caller) });
            } else if (base !== "Marriage") {
                setTeams({ callerTeam: [], opposingTeam: [] });
            }
            return;
        }

        if (calledAce && caller) {
            setTeams(getSauSpielTeams(dealtHands, caller, calledAce));
        }
    }, [selectedGame, calledAce, dealtHands, caller]);

    // preset (developer menu): fixed hands { south: [cards], ... } and lead.
    const dealHands = (preset = null) => {
        // Clean up a pending AI move
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
        isProcessingRef.current = false;

        const nextPlayers = {
            south: [],
            west: [],
            north: [],
            east: [],
        };
        if (preset) {
            for (const seat of playerOrder) nextPlayers[seat] = [...preset.hands[seat]];
        } else {
            shuffleDeck(combinations).forEach((card, index) => {
                const player = playerOrder[index % playerOrder.length];
                nextPlayers[player].push(card);
            });
        }

        // The forehand leads the first trick and has the first say.
        const lead = preset?.lead ?? playerOrder[roundNumber % playerOrder.length];
        setRoundNumber(roundNumber + 1);
        setForehand(lead);
        setCaller(null);
        setLastBid(null);
        setBidding(null);
        setMarriageOffer(null);
        // Before anyone announces, a player with exactly one trump may offer a
        // marriage (the first such player from the forehand). A computer player
        // always offers; Maria is asked.
        // Only players who can give back a card that is no trump are asked;
        // if nobody can, there is no marriage to offer.
        const offerer = rotateFrom(lead).find((seat) => canOfferMarriage(nextPlayers[seat]));
        const candidates = offerer ? marriageCandidates(nextPlayers, offerer) : [];
        if (offerer && candidates.length) {
            setMarriageOffer({
                offerer,
                stage: offerer === humanPlayer ? "offer" : "ask",
                order: candidates,
                index: 0,
                lead,
                declinedBy: [],
            });
        } else {
            setBidding({ order: rotateFrom(lead), index: 0, best: null });
        }

        setPlayers(nextPlayers);
        setDealtHands(nextPlayers);
        setCurrentTurn(lead);
        setPlayedCards([]);
        setTrickWinner(null);
        setRevealedAceOwner(null);
        setTrickPoints({ south: 0, west: 0, north: 0, east: 0 });
        setTrickCounts({ south: 0, west: 0, north: 0, east: 0 });
        setLastTrick(null);
        setRoundResult(null);
        setMarriage(null);
        setDoubling({ kontra: null, retour: false });
        // Every round is declared anew after the deal.
        setSelectedGame("Pass");
        setCalledAce(null);
        setTeams({ callerTeam: [], opposingTeam: [] });
    };

    const processCardPlay = (playerName, cardIndex, currentPlayersState, currentPlayedCardsState, currentTurnState, gameName = "Pass") => {
        const card = currentPlayersState[playerName][cardIndex];

        if (!card || playerName !== currentTurnState) {
            return null;
        }

        // Validate suit following rule
        if (!canPlayCard(card, currentPlayersState[playerName], currentPlayedCardsState, gameName, calledAce)) {
            return null;
        }

        const updatedPlayers = {
            ...currentPlayersState,
            [playerName]: currentPlayersState[playerName].filter((_, index) => index !== cardIndex),
        };

        const nextPlayedCards = [...currentPlayedCardsState, { player: playerName, card }];

        return {
            updatedPlayers,
            nextPlayedCards,
            isComplete: nextPlayedCards.length === playerOrder.length,
            winner: nextPlayedCards.length === playerOrder.length ? getTrickWinner(nextPlayedCards, gameName).player : null,
            nextTurn: nextPlayedCards.length === playerOrder.length
                ? getTrickWinner(nextPlayedCards, gameName).player
                : playerOrder[(playerOrder.indexOf(playerName) + 1) % playerOrder.length],
        };
    };

    const revealCalledAceIfNeeded = useCallback((playerName, card) => {
        if (
            selectedGame === "Sau Spiel" &&
            calledAce &&
            !revealedAceOwner &&
            card &&
            card.suit === calledAce &&
            card.rank === "A"
        ) {
            setRevealedAceOwner(playerName);
        }
    }, [calledAce, revealedAceOwner, selectedGame]);

    // --- Marriage, before announcing ----------------------------------------
    // A partner accepted: they swap a card for the offerer's one trump, and
    // the Marriage is played (two against two).
    const commitMarriage = useCallback(
        (offerer, partner, chosen = null) => {
            const result = swapMarriageCards(players, offerer, partner, "Marriage", chosen);
            setPlayers(result.players);
            setMarriage({ partner, trump: result.trump, given: result.given });
            const callerTeam = [offerer, partner];
            setTeams({ callerTeam, opposingTeam: playerOrder.filter((p) => !callerTeam.includes(p)) });
            // Maria offered: the swap is shown on the table until she goes on
            // (humanMarriageContinue); the others wait until then.
            setMarriageOffer(offerer === humanPlayer ? { offerer, stage: "reveal", order: [], index: 0, declinedBy: [] } : null);
            setCaller(offerer);
            setSelectedGame("Marriage");
        },
        [players, humanPlayer]
    );

    // Maria has seen the swap after her offer was accepted: play on.
    const humanMarriageContinue = useCallback(() => {
        if (marriageOffer?.stage === "reveal") setMarriageOffer(null);
    }, [marriageOffer]);

    // Nobody accepted (or Maria didn't offer): announcing goes on as usual.
    const startBidding = useCallback((lead) => {
        setMarriageOffer(null);
        setBidding({ order: rotateFrom(lead), index: 0, best: null });
    }, []);

    // One answer to a marriage offer.
    const answerMarriage = useCallback(
        (seat, accepts) => {
            if (!marriageOffer || marriageOffer.stage !== "ask" || marriageOffer.order[marriageOffer.index] !== seat) return;
            if (accepts) {
                // Maria accepts: she picks the card she gives back (humanMarriageExchange).
                if (seat === humanPlayer) setMarriageOffer({ ...marriageOffer, stage: "exchange" });
                // Maria's offer was accepted: she lays her trump on the swap field (humanMarriagePlace).
                else if (marriageOffer.offerer === humanPlayer) setMarriageOffer({ ...marriageOffer, stage: "place", partner: seat });
                else commitMarriage(marriageOffer.offerer, seat);
                return;
            }
            const index = marriageOffer.index + 1;
            const declinedBy = [...marriageOffer.declinedBy, seat];
            if (index >= marriageOffer.order.length) {
                setLastBid({ seat: marriageOffer.offerer, game: null, marriageDeclined: true });
                startBidding(marriageOffer.lead);
            } else {
                setMarriageOffer({ ...marriageOffer, index, declinedBy });
            }
        },
        [marriageOffer, commitMarriage, startBidding, humanPlayer]
    );

    // Maria accepted: the card she gives back for the offered trump.
    const humanMarriageExchange = useCallback(
        (card) => {
            if (marriageOffer?.stage !== "exchange" || !players[humanPlayer].some((c) => c.id === card.id)) return;
            // Only a card that is no trump can be given back.
            if (isTrumpForGame(card, "Marriage")) return;
            commitMarriage(marriageOffer.offerer, humanPlayer, card);
        },
        [marriageOffer, players, humanPlayer, commitMarriage]
    );

    // Maria, holding one trump: offer a marriage, or go straight to announcing.
    const humanMarriageOffer = useCallback(
        (offers) => {
            if (!marriageOffer || marriageOffer.stage !== "offer") return;
            // Offering: the others are asked in turn; the swap comes once someone accepts.
            if (offers) setMarriageOffer({ ...marriageOffer, stage: "ask" });
            else startBidding(marriageOffer.lead);
        },
        [marriageOffer, startBidding]
    );

    // Maria's offer was accepted and she laid her trump on the swap field:
    // the cards are swapped and shown (reveal) until she plays on.
    const humanMarriagePlace = useCallback(
        (card) => {
            if (marriageOffer?.stage !== "place" || !isTrumpForGame(card, "Marriage")) return;
            if (!players[humanPlayer].some((c) => c.id === card.id)) return;
            commitMarriage(humanPlayer, marriageOffer.partner);
        },
        [marriageOffer, players, humanPlayer, commitMarriage]
    );

    // Maria, asked by someone else: accept the marriage or decline.
    const humanMarriageAnswer = useCallback((accepts) => answerMarriage(humanPlayer, accepts), [answerMarriage, humanPlayer]);

    // Computer players answer a marriage offer in turn.
    useEffect(() => {
        if (paused || !marriageOffer || marriageOffer.stage !== "ask") return undefined;
        const seat = marriageOffer.order[marriageOffer.index];
        if (seat === humanPlayer) return undefined;
        const timer = setTimeout(() => answerMarriage(seat, wantsToAcceptMarriage(players[seat])), AI_BID_DELAY);
        return () => clearTimeout(timer);
    }, [paused, marriageOffer, players, humanPlayer, answerMarriage]);

    // The end of announcing: the best game is played, or the Cowards Game if
    // everybody passed.
    const finishBidding = useCallback(
        (best) => {
            setBidding(null);
            if (!best) {
                setCaller(null);
                setSelectedGame("Ramsch");
                return;
            }
            setCaller(best.seat);
            setCalledAce(best.game === "Sau Spiel" ? best.calledAce : null);
            setSelectedGame(best.game);
        },
        []
    );

    // One player's say: a game ({ game, calledAce }) or null to pass.
    const placeBid = useCallback(
        (seat, decision) => {
            if (!bidding || bidding.order[bidding.index] !== seat) return;
            const best = decision ? { seat, ...decision } : bidding.best;
            setLastBid({ seat, game: decision?.game ?? null });
            const index = bidding.index + 1;
            if (index >= bidding.order.length) finishBidding(best);
            else setBidding({ ...bidding, index, best });
        },
        [bidding, finishBidding]
    );

    // Maria's say: a game value ("Solo:leaf", "Sau Spiel", …) or null to pass.
    const humanBid = useCallback(
        (game, ace = null) => placeBid(humanPlayer, game ? { game, calledAce: ace } : null),
        [placeBid, humanPlayer]
    );

    // Computer players decide in turn while announcing.
    useEffect(() => {
        if (paused || !bidding) return undefined;
        const seat = bidding.order[bidding.index];
        if (seat === humanPlayer) return undefined;
        const timer = setTimeout(() => {
            placeBid(seat, decideAnnouncement(players[seat], getGameRank(bidding.best?.game)));
        }, AI_BID_DELAY);
        return () => clearTimeout(timer);
    }, [paused, bidding, players, humanPlayer, placeBid]);

    // A full trick stays on the table: show the winner, and give the turn to
    // nobody until the trick is collected.
    const showCompletedTrick = (result) => {
        setPlayedCards(result.nextPlayedCards);
        setTrickWinner(result.winner);
        setCurrentTurn(null);
    };

    // Clears the finished trick; its winner leads the next one. After the
    // last trick nobody has the turn until the next deal.
    const collectTrick = useCallback(() => {
        if (playedCards.length !== playerOrder.length || !trickWinner) return;
        // The announcing side: the caller, plus in a Sheep Game whoever was
        // dealt the called sheep, or in a Marriage the partner.
        const callerTeam = teams.callerTeam.length ? teams.callerTeam : [caller ?? humanPlayer];
        // A Tout is lost the moment the opponents take a trick; no need to play on.
        const toutLost = parseGame(selectedGame).tout && !callerTeam.includes(trickWinner);
        const roundOver = toutLost || playerOrder.every((player) => players[player].length === 0);
        const nextPoints = { ...trickPoints, [trickWinner]: trickPoints[trickWinner] + getTrickPoints(playedCards) };
        const nextCounts = { ...trickCounts, [trickWinner]: trickCounts[trickWinner] + 1 };
        setTrickPoints(nextPoints);
        setTrickCounts(nextCounts);
        setLastTrick({ cards: playedCards, winner: trickWinner });
        setPlayedCards([]);
        setCurrentTurn(roundOver ? null : trickWinner);
        setTrickWinner(null);

        if (roundOver) {
            const game = getGameType(selectedGame);
            // Cards still in hand after a lost Tout go back to the deck.
            if (toutLost) setPlayers(Object.fromEntries(playerOrder.map((player) => [player, []])));
            setRoundResult({
                id: Date.now(),
                gameName: selectedGame,
                points: nextPoints,
                // Tricks per player and the hands as dealt, for the achievements.
                tricks: nextCounts,
                hands: dealtHands,
                callerTeam: selectedGame === "Ramsch" ? [] : callerTeam,
                ...scoreRound({
                    gameName: selectedGame,
                    coins: game?.coins ?? 0,
                    callerTeam,
                    points: nextPoints,
                    tricks: nextCounts,
                    doubles: (doubling.kontra ? 1 : 0) + (doubling.retour ? 1 : 0),
                }),
                kontra: Boolean(doubling.kontra),
                retour: doubling.retour,
            });
        }
    }, [playedCards, trickWinner, players, trickPoints, trickCounts, dealtHands, selectedGame, teams, caller, humanPlayer, doubling]);

    // --- Kontra and Retour ---------------------------------------------------
    // Both can be said until the last card of the first trick is played. Only
    // an opponent of the announcing side says Kontra (not the partner in a
    // Sheep Game), before laying their own first card; the caller can answer
    // with Retour. Not in the Cowards Game, which nobody announced.
    const doublingOpen =
        allowDoubling &&
        !bidding &&
        !marriageOffer &&
        Boolean(caller) &&
        teams.callerTeam.includes(caller) &&
        !["Pass", "Ramsch"].includes(parseGame(selectedGame).base) &&
        !lastTrick &&
        playedCards.length < playerOrder.length;
    const canKontra = (seat) =>
        doublingOpen &&
        !doubling.kontra &&
        !teams.callerTeam.includes(seat) &&
        !playedCards.some((played) => played.player === seat);
    const canRetour = (seat) => doublingOpen && Boolean(doubling.kontra) && !doubling.retour && seat === caller;
    const humanCanRetour = canRetour(humanPlayer);

    const sayKontra = () => {
        if (canKontra(humanPlayer)) setDoubling((current) => ({ ...current, kontra: humanPlayer }));
    };
    const sayRetour = () => {
        if (humanCanRetour) setDoubling((current) => ({ ...current, retour: true }));
    };

    // A computer opponent decides on Kontra when its turn in the first trick
    // comes, before playing its card.
    const aiKontraSeat = currentTurn && currentTurn !== humanPlayer && canKontra(currentTurn) ? currentTurn : null;
    useEffect(() => {
        if (paused || !aiKontraSeat) return;
        if (decideKontra(players[aiKontraSeat], selectedGame)) {
            setDoubling((current) => (current.kontra ? current : { ...current, kontra: aiKontraSeat }));
        }
    }, [paused, aiKontraSeat]); // eslint-disable-line react-hooks/exhaustive-deps

    // A computer caller answers a Kontra.
    const aiRetourSeat = caller && caller !== humanPlayer && canRetour(caller) ? caller : null;
    useEffect(() => {
        if (paused || !aiRetourSeat) return undefined;
        const timer = setTimeout(() => {
            if (decideRetour(players[aiRetourSeat], selectedGame)) setDoubling((current) => ({ ...current, retour: true }));
        }, AI_RETOUR_DELAY);
        return () => clearTimeout(timer);
    }, [paused, aiRetourSeat, doubling.kontra]); // eslint-disable-line react-hooks/exhaustive-deps

    const playCard = useCallback(
        (playerName, cardIndex) => {
            if (selectedGame === "Pass") return false; // Nothing is played before a game is chosen
            const result = processCardPlay(playerName, cardIndex, players, playedCards, currentTurn, selectedGame);
            if (!result) return false;

            const playedCard = players[playerName][cardIndex];
            setPlayers(result.updatedPlayers);
            revealCalledAceIfNeeded(playerName, playedCard);

            if (result.isComplete) {
                showCompletedTrick(result);
                return true;
            }

            // Normal card play - add to pile
            setPlayedCards(result.nextPlayedCards);
            setCurrentTurn(result.nextTurn);
            return true;
        },
        [players, currentTurn, playedCards, selectedGame, calledAce, revealCalledAceIfNeeded]
    );

    useEffect(() => {
        // Cards are only played once a game has been decided.
        if (paused || bidding || marriageOffer || selectedGame === "Pass") return undefined;
        if (currentTurn && currentTurn !== humanPlayer && players[currentTurn].length > 0) {
            if (aiTimeoutRef.current || isProcessingRef.current) return; // Already pending or processing

            aiTimeoutRef.current = setTimeout(() => {
                isProcessingRef.current = true;  // Mark as processing
                const { players: currentPlayers, currentTurn: aiTurn, playedCards: currentPlayedCards } = gameStateRef.current;
                const hand = currentPlayers[aiTurn];
                if (!hand || hand.length === 0) {
                    isProcessingRef.current = false;
                    aiTimeoutRef.current = null;
                    return;
                }

                const cardIndex = chooseCard({
                    me: aiTurn,
                    hand,
                    playedCards: currentPlayedCards,
                    gameName: selectedGame,
                    calledAce,
                    caller,
                    teams,
                    revealedAceOwner,
                });
                const result = processCardPlay(aiTurn, cardIndex, currentPlayers, currentPlayedCards, aiTurn, selectedGame);

                if (!result) {
                    isProcessingRef.current = false;
                    aiTimeoutRef.current = null;
                    return;
                }

                setPlayers(result.updatedPlayers);
                revealCalledAceIfNeeded(aiTurn, currentPlayers[aiTurn][cardIndex]);

                if (result.isComplete) {
                    showCompletedTrick(result);
                } else {
                    // Normal card play - add to pile
                    setPlayedCards(result.nextPlayedCards);
                    setCurrentTurn(result.nextTurn);
                }
                isProcessingRef.current = false;  // Mark as done processing
                aiTimeoutRef.current = null;
            }, humanCanRetour ? AI_PLAY_DELAY_RETOUR : AI_PLAY_DELAY);

            return () => {
                if (aiTimeoutRef.current) {
                    clearTimeout(aiTimeoutRef.current);
                    aiTimeoutRef.current = null;
                    isProcessingRef.current = false;
                }
            };
        }
        return undefined;
    }, [paused, currentTurn, humanPlayer, players, playedCards, selectedGame, calledAce, caller, teams, revealedAceOwner, bidding, marriageOffer, revealCalledAceIfNeeded, humanCanRetour]);

    return {
        players,
        currentTurn,
        playedCards,
        trickWinner,
        selectedGame,
        setSelectedGame,
        calledAce,
        setCalledAce,
        teams,
        revealedAceOwner,
        dealHands,
        playCard,
        collectTrick,
        lastTrick,
        trickPoints,
        roundResult,
        marriage,
        marriageOffer: marriageOffer && {
            offerer: marriageOffer.offerer,
            stage: marriageOffer.stage,
            seat:
                marriageOffer.stage === "ask" || marriageOffer.stage === "exchange"
                    ? marriageOffer.order[marriageOffer.index]
                    : marriageOffer.offerer,
            declinedBy: marriageOffer.declinedBy,
            // While exchanging: the trump on offer, shown face up on the table.
            // After the swap (reveal): the trump Maria gave and the card she got.
            trump:
                marriageOffer.stage === "exchange"
                    ? players[marriageOffer.offerer].find((card) => isTrumpForGame(card, "Marriage"))
                    : marriageOffer.stage === "reveal"
                      ? marriage?.trump ?? null
                      : null,
            received: marriageOffer.stage === "reveal" ? marriage?.given ?? null : null,
            // Who accepted Maria's offer, while she lays her trump down.
            partner: marriageOffer.partner ?? null,
            // Maria's own trump, to lay on the swap field once someone accepted.
            offered:
                marriageOffer.offerer === humanPlayer && marriageOffer.stage === "place"
                    ? players[humanPlayer].find((card) => isTrumpForGame(card, "Marriage")) ?? null
                    : null,
        },
        humanMarriageExchange,
        humanMarriagePlace,
        humanMarriageContinue,
        humanMarriageOffer,
        humanMarriageAnswer,
        caller,
        forehand,
        bidding: bidding && { seat: bidding.order[bidding.index], best: bidding.best },
        lastBid,
        humanBid,
        // Kontra and Retour: who said Kontra, whether Retour was said, and
        // whether Maria can say either right now.
        doubling,
        canSayKontra: canKontra(humanPlayer),
        canSayRetour: humanCanRetour,
        sayKontra,
        sayRetour,
    };
}

export default useSchafkopfGame;
