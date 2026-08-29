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

export function canPlayCard(card, hand, playedCards) {
    // If this is the first card of the trick, any card is legal
    if (playedCards.length === 0) {
        return true;
    }

    const ledCard = playedCards[0].card;
    const ledIsTrump = isTrump(ledCard);

    // If trump was led, you must follow with trump if you have it
    if (ledIsTrump) {
        const hasTrump = hand.some((c) => isTrump(c));
        if (hasTrump) {
            return isTrump(card);
        }
        // No trump available, any card is legal
        return true;
    }

    // If a regular suit was led, you must play that suit if you have it
    const ledSuit = ledCard.suit;
    if (card.suit === ledSuit) {
        return true;
    }

    // Check if player has cards of the led suit
    const hasLedSuit = hand.some((c) => c.suit === ledSuit && !isTrump(c));

    // Only allowed to play a different non-trump suit if you don't have the led suit
    if (!hasLedSuit) {
        return true;
    }

    return false;
}

export function getAIMove(hand, playedCards) {
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
}