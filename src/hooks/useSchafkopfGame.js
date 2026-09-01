import { useState, useEffect, useRef, useCallback } from "react";
import { combinations } from "../assets/CardDeck";
import { canPlayCard, getSauSpielTeams, isTrumpForGame } from "../ai/schafkopfAI";

// Timing constants - adjust these to change all delays at once
const TESTING = 0.2;
const AI_PLAY_DELAY = 1000 * TESTING;  // milliseconds between AI card plays
const TRICK_DISPLAY_DELAY = 1200 * TESTING;  // milliseconds to show completed trick
const WINNER_DISPLAY_DELAY = (TRICK_DISPLAY_DELAY + 1500) * TESTING;  // milliseconds before hiding winner

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

        // Both trump: higher rank wins
        if (bestIsTrump && currentIsTrump) {
            const bestValue = rankValue[bestCard.rank] ?? 0;
            const currentValue = rankValue[currentCard.rank] ?? 0;
            return currentValue > bestValue ? current : best;
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
            const bestValue = rankValue[bestCard.rank] ?? 0;
            const currentValue = rankValue[currentCard.rank] ?? 0;
            return currentValue > bestValue ? current : best;
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
    const [currentTurn, setCurrentTurn] = useState("south");
    const [playedCards, setPlayedCards] = useState([]);
    const [trickWinner, setTrickWinner] = useState(null);
    const [selectedGame, setSelectedGame] = useState("Pass");
    const [calledAce, setCalledAce] = useState(null);
    const [teams, setTeams] = useState({ callerTeam: [], opposingTeam: [] });
    const [revealedAceOwner, setRevealedAceOwner] = useState(null);
    const [humanPlayer] = useState("south");
    const aiTimeoutRef = useRef(null);
    const clearPlayedCardsTimeoutRef = useRef(null);
    const clearWinnerTimeoutRef = useRef(null);
    const isProcessingRef = useRef(false);  // Prevent concurrent plays
    const gameStateRef = useRef({ players: initialPlayers, currentTurn: "south", playedCards: [] });

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
            const nextTeams = getSauSpielTeams(players, humanPlayer, calledAce);
            setTeams(nextTeams);
        }
    }, [selectedGame, calledAce, players, humanPlayer]);

    const dealHands = () => {
        // Clean up any pending timeouts
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
        if (clearPlayedCardsTimeoutRef.current) clearTimeout(clearPlayedCardsTimeoutRef.current);
        if (clearWinnerTimeoutRef.current) clearTimeout(clearWinnerTimeoutRef.current);
        aiTimeoutRef.current = null;
        clearPlayedCardsTimeoutRef.current = null;
        clearWinnerTimeoutRef.current = null;

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
        setCurrentTurn("south");
        setPlayedCards([]);
        setTrickWinner(null);
        setRevealedAceOwner(null);

        if (selectedGame === "Sau Spiel" && calledAce) {
            setTeams(getSauSpielTeams(nextPlayers, humanPlayer, calledAce));
        } else {
            setTeams({ callerTeam: [], opposingTeam: [] });
        }
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

    const playCard = useCallback(
        (playerName, cardIndex) => {
            const result = processCardPlay(playerName, cardIndex, players, playedCards, currentTurn, selectedGame);
            if (!result) return false;

            const playedCard = players[playerName][cardIndex];
            setPlayers(result.updatedPlayers);
            revealCalledAceIfNeeded(playerName, playedCard);

            if (result.isComplete) {
                if (clearPlayedCardsTimeoutRef.current) clearTimeout(clearPlayedCardsTimeoutRef.current);
                if (clearWinnerTimeoutRef.current) clearTimeout(clearWinnerTimeoutRef.current);

                // Show all 4 cards first
                setPlayedCards(result.nextPlayedCards);

                clearPlayedCardsTimeoutRef.current = setTimeout(() => {
                    setPlayedCards([]);
                    setTrickWinner(result.winner);
                    setCurrentTurn(result.winner);
                }, TRICK_DISPLAY_DELAY);

                clearWinnerTimeoutRef.current = setTimeout(() => {
                    setTrickWinner(null);
                    clearWinnerTimeoutRef.current = null;
                }, WINNER_DISPLAY_DELAY);

                return true;
            }

            // Normal card play - add to pile
            setPlayedCards(result.nextPlayedCards);
            setCurrentTurn(result.nextTurn);
            return true;
        },
        [players, currentTurn, playedCards, selectedGame]
    );

    useEffect(() => {
        if (currentTurn !== humanPlayer && players[currentTurn].length > 0) {
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
                    if (clearPlayedCardsTimeoutRef.current) clearTimeout(clearPlayedCardsTimeoutRef.current);
                    if (clearWinnerTimeoutRef.current) clearTimeout(clearWinnerTimeoutRef.current);

                    // Show all 4 cards first
                    setPlayedCards(result.nextPlayedCards);

                    clearPlayedCardsTimeoutRef.current = setTimeout(() => {
                        setPlayedCards([]);
                        setTrickWinner(result.winner);
                        setCurrentTurn(result.winner);
                        isProcessingRef.current = false;  // Mark as done processing
                    }, TRICK_DISPLAY_DELAY);

                    clearWinnerTimeoutRef.current = setTimeout(() => {
                        setTrickWinner(null);
                        clearWinnerTimeoutRef.current = null;
                    }, WINNER_DISPLAY_DELAY);
                } else {
                    // Normal card play - add to pile
                    setPlayedCards(result.nextPlayedCards);
                    setCurrentTurn(result.nextTurn);
                    isProcessingRef.current = false;  // Mark as done processing
                }
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
    };
}

export default useSchafkopfGame;
