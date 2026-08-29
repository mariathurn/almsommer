import { useState, useEffect, useRef, useCallback } from "react";
import { combinations } from "../assets/CardDeck";
import { canPlayCard } from "../ai/schafkopfAI";

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

// Trump cards: all O (Ober), all U (Unter), all hearts
function isTrump(card) {
    return card.rank === "O" || card.rank === "U" || card.suit === "heart";
}

const shuffleDeck = (deck) => {
    const nextDeck = [...deck];

    for (let i = nextDeck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [nextDeck[i], nextDeck[j]] = [nextDeck[j], nextDeck[i]];
    }

    return nextDeck;
};

const getTrickWinner = (cards) => {
    const ledCard = cards[0].card;
    const ledSuit = ledCard.suit;

    return cards.reduce((best, current) => {
        const bestCard = best.card;
        const currentCard = current.card;

        const bestIsTrump = isTrump(bestCard);
        const currentIsTrump = isTrump(currentCard);

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

const getAIMove = (hand, playedCards) => {
    if (!hand || hand.length === 0) return 0;

    // If this is the first card (leading), play lowest non-trump to preserve trump
    if (playedCards.length === 0) {
        const nonTrumpCards = hand.filter((c) => !isTrump(c));
        if (nonTrumpCards.length > 0) {
            const lowestRank = Math.min(...nonTrumpCards.map((c) => rankValue[c.rank]));
            return hand.findIndex(
                (c) => !isTrump(c) && rankValue[c.rank] === lowestRank
            );
        }
        // All cards are trump, play lowest trump
        const lowestRank = Math.min(...hand.map((c) => rankValue[c.rank]));
        return hand.findIndex((c) => rankValue[c.rank] === lowestRank);
    }

    const ledCard = playedCards[0].card;
    const ledIsTrump = isTrump(ledCard);

    // If trump was led, must follow with trump
    if (ledIsTrump) {
        const trumpCards = hand.filter((c) => isTrump(c));
        if (trumpCards.length > 0) {
            const lowestRank = Math.min(...trumpCards.map((c) => rankValue[c.rank]));
            return hand.findIndex((c) => isTrump(c) && rankValue[c.rank] === lowestRank);
        }
        // No trump, play lowest card
        const lowestRank = Math.min(...hand.map((c) => rankValue[c.rank]));
        return hand.findIndex((c) => rankValue[c.rank] === lowestRank);
    }

    // Regular suit was led
    const ledSuit = ledCard.suit;
    const sameSuitCards = hand.filter((c) => c.suit === ledSuit && !isTrump(c));

    // If we have cards of the led suit (non-trump), play lowest
    if (sameSuitCards.length > 0) {
        const lowestRank = Math.min(...sameSuitCards.map((c) => rankValue[c.rank]));
        return hand.findIndex(
            (c) => c.suit === ledSuit && !isTrump(c) && rankValue[c.rank] === lowestRank
        );
    }

    // Can't follow suit, play lowest non-trump card if possible
    const nonTrumpCards = hand.filter((c) => !isTrump(c));
    if (nonTrumpCards.length > 0) {
        const lowestRank = Math.min(...nonTrumpCards.map((c) => rankValue[c.rank]));
        return hand.findIndex(
            (c) => !isTrump(c) && rankValue[c.rank] === lowestRank
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
    const [humanPlayer] = useState("south");
    const aiTimeoutRef = useRef(null);
    const clearDisplayTimeoutRef = useRef(null);
    const gameStateRef = useRef({ players: initialPlayers, currentTurn: "south", playedCards: [] });

    // Keep gameStateRef in sync with current state
    useEffect(() => {
        gameStateRef.current = { players, currentTurn, playedCards };
    }, [players, currentTurn, playedCards]);

    const dealHands = () => {
        // Clean up any pending timeouts
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
        if (clearDisplayTimeoutRef.current) clearTimeout(clearDisplayTimeoutRef.current);
        aiTimeoutRef.current = null;
        clearDisplayTimeoutRef.current = null;

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
    };

    const processCardPlay = (playerName, cardIndex, currentPlayersState, currentPlayedCardsState, currentTurnState) => {
        const card = currentPlayersState[playerName][cardIndex];

        if (!card || playerName !== currentTurnState) {
            return null;
        }

        // Validate suit following rule
        if (!canPlayCard(card, currentPlayersState[playerName], currentPlayedCardsState)) {
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
            winner: nextPlayedCards.length === playerOrder.length ? getTrickWinner(nextPlayedCards).player : null,
            nextTurn: nextPlayedCards.length === playerOrder.length
                ? getTrickWinner(nextPlayedCards).player
                : playerOrder[(playerOrder.indexOf(playerName) + 1) % playerOrder.length],
        };
    };

    const playCard = useCallback(
        (playerName, cardIndex) => {
            const result = processCardPlay(playerName, cardIndex, players, playedCards, currentTurn);
            if (!result) return false;

            setPlayers(result.updatedPlayers);

            if (result.isComplete) {
                // Immediately clear the pile when trick completes
                setPlayedCards([]);
                setTrickWinner(result.winner);
                setCurrentTurn(result.winner);

                // Only update display state after 600ms
                if (clearDisplayTimeoutRef.current) clearTimeout(clearDisplayTimeoutRef.current);
                clearDisplayTimeoutRef.current = setTimeout(() => {
                    setTrickWinner(null);
                    clearDisplayTimeoutRef.current = null;
                }, 600);

                return true;
            }

            // Normal card play - add to pile
            setPlayedCards(result.nextPlayedCards);
            setCurrentTurn(result.nextTurn);
            return true;
        },
        [players, currentTurn, playedCards]
    );

    useEffect(() => {
        if (currentTurn !== humanPlayer && players[currentTurn].length > 0) {
            if (aiTimeoutRef.current) return; // Already pending

            aiTimeoutRef.current = setTimeout(() => {
                const { players: currentPlayers, currentTurn: aiTurn, playedCards: currentPlayedCards } = gameStateRef.current;
                const hand = currentPlayers[aiTurn];
                if (!hand || hand.length === 0) return;

                const cardIndex = getAIMove(hand, currentPlayedCards);
                const result = processCardPlay(aiTurn, cardIndex, currentPlayers, currentPlayedCards, aiTurn);

                if (!result) {
                    aiTimeoutRef.current = null;
                    return;
                }

                setPlayers(result.updatedPlayers);

                if (result.isComplete) {
                    // Immediately clear the pile when trick completes
                    setPlayedCards([]);
                    setTrickWinner(result.winner);
                    setCurrentTurn(result.winner);

                    // Only update display state after 600ms
                    if (clearDisplayTimeoutRef.current) clearTimeout(clearDisplayTimeoutRef.current);
                    clearDisplayTimeoutRef.current = setTimeout(() => {
                        setTrickWinner(null);
                        clearDisplayTimeoutRef.current = null;
                    }, 600);
                } else {
                    // Normal card play - add to pile
                    setPlayedCards(result.nextPlayedCards);
                    setCurrentTurn(result.nextTurn);
                }
                aiTimeoutRef.current = null;
            }, 600);

            return () => {
                if (aiTimeoutRef.current) {
                    clearTimeout(aiTimeoutRef.current);
                    aiTimeoutRef.current = null;
                }
            };
        }
    }, [currentTurn, humanPlayer, players, playedCards]);

    return {
        players,
        currentTurn,
        playedCards,
        trickWinner,
        dealHands,
        playCard,
    };
}

export default useSchafkopfGame;
