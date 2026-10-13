import { useState, useEffect, useRef, useCallback } from "react";
import { combinations } from "../assets/CardDeck";
import { canPlayCard, getPlainRank, getSauSpielTeams, getTrumpStrength, isTrumpForGame } from "../ai/schafkopfAI";

// Timing constants - adjust these to change all delays at once
// Milliseconds an opponent "thinks" before playing. A finished trick stays on
// the table until the player collects it (collectTrick), so there is no timer.
const AI_PLAY_DELAY = 900;

const initialPlayers = {
    south: [],
    west: [],
    north: [],
    east: [],
};

const playerOrder = ["south", "west", "north", "east"];
const rankValue = {
    "9": 1,
    K: 2,
    "10": 3,
    A: 4,
    U: 5,
    O: 6,
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

const getAIMove = (hand, playedCards, gameName = "Pass") => {
    if (!hand || hand.length === 0) return 0;

    // If this is the first card (leading), play lowest non-trump to preserve trump
    if (playedCards.length === 0) {
        const nonTrumpCards = hand.filter((c) => !isTrump(c, gameName));
        if (nonTrumpCards.length > 0) {
            const lowestRank = Math.min(...nonTrumpCards.map((c) => rankValue[c.rank]));
            return hand.findIndex(
                (c) => !isTrump(c, gameName) && rankValue[c.rank] === lowestRank
            );
        }
        // All cards are trump, play lowest trump
        const lowestRank = Math.min(...hand.map((c) => rankValue[c.rank]));
        return hand.findIndex((c) => rankValue[c.rank] === lowestRank);
    }

    const ledCard = playedCards[0].card;
    const ledIsTrump = isTrump(ledCard, gameName);

    // If trump was led, must follow with trump
    if (ledIsTrump) {
        const trumpCards = hand.filter((c) => isTrump(c, gameName));
        if (trumpCards.length > 0) {
            const lowestRank = Math.min(...trumpCards.map((c) => rankValue[c.rank]));
            return hand.findIndex((c) => isTrump(c, gameName) && rankValue[c.rank] === lowestRank);
        }
        // No trump, play lowest card
        const lowestRank = Math.min(...hand.map((c) => rankValue[c.rank]));
        return hand.findIndex((c) => rankValue[c.rank] === lowestRank);
    }

    // Regular suit was led
    const ledSuit = ledCard.suit;
    const sameSuitCards = hand.filter((c) => c.suit === ledSuit && !isTrump(c, gameName));

    // If we have cards of the led suit (non-trump), play lowest
    if (sameSuitCards.length > 0) {
        const lowestRank = Math.min(...sameSuitCards.map((c) => rankValue[c.rank]));
        return hand.findIndex(
            (c) => c.suit === ledSuit && !isTrump(c, gameName) && rankValue[c.rank] === lowestRank
        );
    }

    // Can't follow suit, play lowest non-trump card if possible
    const nonTrumpCards = hand.filter((c) => !isTrump(c, gameName));
    if (nonTrumpCards.length > 0) {
        const lowestRank = Math.min(...nonTrumpCards.map((c) => rankValue[c.rank]));
        return hand.findIndex(
            (c) => !isTrump(c, gameName) && rankValue[c.rank] === lowestRank
        );
    }

    // Must play trump, play lowest
    const lowestRank = Math.min(...hand.map((c) => rankValue[c.rank]));
    return hand.findIndex((c) => rankValue[c.rank] === lowestRank);
};


function useSchafkopfGame() {
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
    const [humanPlayer] = useState("south");
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
        if (selectedGame !== "Sau Spiel") {
            setCalledAce(null);
            setTeams({ callerTeam: [], opposingTeam: [] });
            setRevealedAceOwner(null);
            return;
        }

        if (calledAce) {
            const nextTeams = getSauSpielTeams(dealtHands, humanPlayer, calledAce);
            setTeams(nextTeams);
        }
    }, [selectedGame, calledAce, dealtHands, humanPlayer]);

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

        setPlayers(nextPlayers);
        setDealtHands(nextPlayers);
        setCurrentTurn("south");
        setPlayedCards([]);
        setTrickWinner(null);
        setRevealedAceOwner(null);
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
        if (!canPlayCard(card, currentPlayersState[playerName], currentPlayedCardsState, gameName)) {
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
        setPlayedCards([]);
        setCurrentTurn(roundOver ? null : trickWinner);
        setTrickWinner(null);
    }, [playedCards, trickWinner, players]);

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
        [players, currentTurn, playedCards, selectedGame, revealCalledAceIfNeeded]
    );

    useEffect(() => {
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

                const cardIndex = getAIMove(hand, currentPlayedCards, selectedGame);
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
    }, [currentTurn, humanPlayer, players, playedCards, selectedGame, revealCalledAceIfNeeded]);

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
    };
}

export default useSchafkopfGame;
