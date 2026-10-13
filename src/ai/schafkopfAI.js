const rankValue = {
    "9": 1,
    K: 2,
    "10": 3,
    A: 4,
    U: 5,
    O: 6,
};

const validAceCalls = ["bell", "acorn", "leaf"];

export function isTrumpForGame(card, gameName = "Pass") {
    if (!card) return false;

    if (gameName === "Sau Spiel") {
        return card.rank === "O" || card.rank === "U" || card.suit === "heart";
    }

    // Fallback for the game variants we have so far.
    return card.rank === "O" || card.rank === "U" || card.suit === "heart";
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

export function canPlayCard(card, hand, playedCards, gameName = "Pass") {
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

    // If a regular suit was led, you must play that suit if you have it
    const ledSuit = ledCard.suit;
    if (card.suit === ledSuit) {
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