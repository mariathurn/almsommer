// Scoring a finished round: card points per player, who won, and how many
// coins change hands. Every round is zero-sum: what the winners get, the
// losers pay.

export const players = ["south", "west", "north", "east"];

// Points ("Augen") per card; the whole deck is worth 120.
export const CARD_POINTS = { "9": 0, K: 4, "10": 10, A: 11, U: 2, O: 3 };
export const POINTS_TO_WIN = 61;

export function getCardPoints(card) {
    return CARD_POINTS[card.rank] ?? 0;
}

export function getTrickPoints(trick) {
    return trick.reduce((sum, { card }) => sum + getCardPoints(card), 0);
}

const zero = () => Object.fromEntries(players.map((p) => [p, 0]));

/*
 * gameName:   the game value ("Sau Spiel", "Solo", "Wenz", "Marriage", "Ramsch")
 * coins:      the game's coin reward (from gameTypes)
 * callerTeam: the announcing side (caller, plus the partner in a Sheep Game)
 * points:     card points each player took in tricks, e.g. { south: 34, ... }
 *
 * Team games (Sheep Game): each player on the winning side gets the reward
 * from one player on the losing side.
 * Solo games (Solo, Dog Game, Marriage for now): one against three; the
 * soloist gets the reward from each opponent, or pays each of them.
 * Cowards Game: whoever took the most points pays the reward to each other
 * player (a tie for most points makes all of them losers).
 */
export function scoreRound({ gameName, coins, callerTeam = [], points }) {
    const deltas = zero();

    if (gameName === "Ramsch") {
        const most = Math.max(...players.map((p) => points[p]));
        const losers = players.filter((p) => points[p] === most);
        const winners = players.filter((p) => !losers.includes(p));
        for (const loser of losers) {
            for (const winner of winners) {
                deltas[loser] -= coins;
                deltas[winner] += coins;
            }
        }
        return { winners, losers, deltas, callerPoints: null };
    }

    const callers = callerTeam;
    const opponents = players.filter((p) => !callers.includes(p));
    const callerPoints = callers.reduce((sum, p) => sum + points[p], 0);
    const callersWin = callerPoints >= POINTS_TO_WIN;
    const winners = callersWin ? callers : opponents;
    const losers = callersWin ? opponents : callers;

    if (callers.length === 2) {
        // Two against two: each player gains or loses the reward once.
        for (const p of winners) deltas[p] += coins;
        for (const p of losers) deltas[p] -= coins;
    } else {
        // One against three: every opponent settles with the soloist.
        const [soloist] = callers;
        for (const opponent of opponents) {
            const amount = callersWin ? coins : -coins;
            deltas[soloist] += amount;
            deltas[opponent] -= amount;
        }
    }

    return { winners, losers, deltas, callerPoints };
}
