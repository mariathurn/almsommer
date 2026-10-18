import { useState, useEffect, useRef, useCallback } from "react";
import { combinations } from "../assets/CardDeck";
import { getTrickPoints, scoreRound } from "../ai/scoring";
import { chooseCard, decideAnnouncement, getGameRank } from "../ai/players";
import { getGameType } from "../data/gameTypes";
import {
    canPlayCard,
    getPlainRank,
    getSauSpielTeams,
    getTrumpStrength,
    isTrumpForGame,
    parseGame,
    canOfferMarriage,
    marriageAskOrder,
    swapMarriageCards,
    wantsToAcceptMarriage,
} from "../ai/schafkopfAI";

// Timing constants - adjust these to change all delays at once
// Milliseconds an opponent "thinks" before playing. A finished trick stays on
// the table until the player collects it (collectTrick), so there is no timer.
const AI_PLAY_DELAY = 900;
// Milliseconds a computer player takes to decide whether to announce a game.
const AI_BID_DELAY = 1100;

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
function useSchafkopfGame({ paused = false } = {}) {
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

    const dealHands = () => {
        // Clean up a pending AI move
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
        isProcessingRef.current = false;

        const shuffledDeck = shuffleDeck(combinations);
        const nextPlayers = {
            south: [],
            west: [],
            north: [],
            east: [],
        };

        shuffledDeck.forEach((card, index) => {
            const player = playerOrder[index % playerOrder.length];
            nextPlayers[player].push(card);
        });

        // The forehand leads the first trick and has the first say.
        const lead = playerOrder[roundNumber % playerOrder.length];
        setRoundNumber(roundNumber + 1);
        setForehand(lead);
        setCaller(null);
        setLastBid(null);
        setBidding(null);
        setMarriageOffer(null);
        // Before anyone announces, a player with exactly one trump may offer a
        // marriage (the first such player from the forehand). A computer player
        // always offers; Maria is asked.
        const offerer = rotateFrom(lead).find((seat) => canOfferMarriage(nextPlayers[seat]));
        if (offerer) {
            setMarriageOffer({
                offerer,
                stage: offerer === humanPlayer ? "offer" : "ask",
                order: marriageAskOrder(offerer),
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
        setRoundResult(null);
        setMarriage(null);
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
        (offerer, partner) => {
            const result = swapMarriageCards(players, offerer, partner);
            setPlayers(result.players);
            setMarriage({ partner, trump: result.trump, given: result.given });
            const callerTeam = [offerer, partner];
            setTeams({ callerTeam, opposingTeam: playerOrder.filter((p) => !callerTeam.includes(p)) });
            setMarriageOffer(null);
            setCaller(offerer);
            setSelectedGame("Marriage");
        },
        [players]
    );

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
                commitMarriage(marriageOffer.offerer, seat);
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
        [marriageOffer, commitMarriage, startBidding]
    );

    // Maria, holding one trump: offer a marriage, or go straight to announcing.
    const humanMarriageOffer = useCallback(
        (offers) => {
            if (!marriageOffer || marriageOffer.stage !== "offer") return;
            if (offers) setMarriageOffer({ ...marriageOffer, stage: "ask" });
            else startBidding(marriageOffer.lead);
        },
        [marriageOffer, startBidding]
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
        const roundOver = playerOrder.every((player) => players[player].length === 0);
        const nextPoints = { ...trickPoints, [trickWinner]: trickPoints[trickWinner] + getTrickPoints(playedCards) };
        const nextCounts = { ...trickCounts, [trickWinner]: trickCounts[trickWinner] + 1 };
        setTrickPoints(nextPoints);
        setTrickCounts(nextCounts);
        setPlayedCards([]);
        setCurrentTurn(roundOver ? null : trickWinner);
        setTrickWinner(null);

        if (roundOver) {
            const game = getGameType(selectedGame);
            // The announcing side: the caller, plus in a Sheep Game whoever was
            // dealt the called sheep, or in a Marriage the partner.
            const callerTeam = teams.callerTeam.length ? teams.callerTeam : [caller ?? humanPlayer];
            setRoundResult({
                id: Date.now(),
                gameName: selectedGame,
                points: nextPoints,
                // Tricks per player and the hands as dealt, for the achievements.
                tricks: nextCounts,
                hands: dealtHands,
                callerTeam: selectedGame === "Ramsch" ? [] : callerTeam,
                ...scoreRound({ gameName: selectedGame, coins: game?.coins ?? 0, callerTeam, points: nextPoints }),
            });
        }
    }, [playedCards, trickWinner, players, trickPoints, trickCounts, dealtHands, selectedGame, teams, caller, humanPlayer]);

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
            }, AI_PLAY_DELAY);

            return () => {
                if (aiTimeoutRef.current) {
                    clearTimeout(aiTimeoutRef.current);
                    aiTimeoutRef.current = null;
                    isProcessingRef.current = false;
                }
            };
        }
        return undefined;
    }, [paused, currentTurn, humanPlayer, players, playedCards, selectedGame, calledAce, caller, teams, revealedAceOwner, bidding, marriageOffer, revealCalledAceIfNeeded]);

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
        trickPoints,
        roundResult,
        marriage,
        marriageOffer: marriageOffer && {
            offerer: marriageOffer.offerer,
            stage: marriageOffer.stage,
            seat: marriageOffer.stage === "ask" ? marriageOffer.order[marriageOffer.index] : marriageOffer.offerer,
            declinedBy: marriageOffer.declinedBy,
        },
        humanMarriageOffer,
        humanMarriageAnswer,
        caller,
        forehand,
        bidding: bidding && { seat: bidding.order[bidding.index], best: bidding.best },
        lastBid,
        humanBid,
    };
}

export default useSchafkopfGame;
