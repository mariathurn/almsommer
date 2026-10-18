// Scoring a finished round: card points per player, who won, and how many
// coins change hands. Every round is zero-sum: what the winners get, the
// losers pay.

export const players = ["south", "west", "north", "east"];

// Points ("Augen") per card; the whole deck is worth 120.
export const CARD_POINTS = { "9": 0, K: 4, "10": 10, A: 11, U: 2, O: 3 };
export const POINTS_TO_WIN = 61;
// Schneider: the announcing side took at most 30 points, or the other side
// at most 29. Schwarz: a side took no trick at all (and so is Schneider too).
// Each raises the game's value by 5 coins.
export const SCHNEIDER_MAX = { callers: 30, opponents: 29 };
export const SCHNEIDER_BONUS = 5;
export const SCHWARZ_BONUS = 5;
// A Tout (Solo or Dog Game) doubles the game's value instead.
export const TOUT_FACTOR = 2;

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
 * tricks:     tricks each player took, e.g. { south: 2, ... } (for Schwarz)
 *
 * Team games (Sheep Game): each player on the winning side gets the reward
 * from one player on the losing side.
 * Solo games (Solo, Dog Game, Marriage for now): one against three; the
 * soloist gets the reward from each opponent, or pays each of them.
 * Cowards Game: whoever took the most points pays the reward to each other
 * player (a tie for most points makes all of them losers). No Schneider or
 * Schwarz there.
 *
 * Every game but the Cowards Game is worth more when a side is Schneider
 * (+5) or Schwarz (another +5); the result says which in `schneider` and
 * `schwarz`, and the coins per settlement in `value`.
 *
 * Tout ("Solo:leaf:tout", "Wenz:tout"): the soloist wins only if the
 * opponents take no trick at all, whatever the points. Its value is doubled,
 * and Schneider and Schwarz don't count on top.
 */
export function scoreRound({ gameName, coins, callerTeam = [], points, tricks = null }) {
    const tout = String(gameName).split(":").includes("tout");
    const deltas = zero();

    if (String(gameName).split(":")[0] === "Ramsch") {
        const most = Math.max(...players.map((p) => points[p]));
        const losers = players.filter((p) => points[p] === most);
        const winners = players.filter((p) => !losers.includes(p));
        for (const loser of losers) {
            for (const winner of winners) {
                deltas[loser] -= coins;
                deltas[winner] += coins;
            }
        }
        return { winners, losers, deltas, callerPoints: null, schneider: false, schwarz: false, tout: false, value: coins };
    }

    const callers = callerTeam;
    const opponents = players.filter((p) => !callers.includes(p));
    const callerPoints = callers.reduce((sum, p) => sum + points[p], 0);
    const opponentPoints = opponents.reduce((sum, p) => sum + points[p], 0);
    const sideTricks = (side) => side.reduce((sum, p) => sum + (tricks?.[p] ?? 0), 0);
    const callersWin = tout ? Boolean(tricks) && sideTricks(opponents) === 0 : callerPoints >= POINTS_TO_WIN;
    const winners = callersWin ? callers : opponents;
    const losers = callersWin ? opponents : callers;

    const schwarz = !tout && Boolean(tricks) && (sideTricks(callers) === 0 || sideTricks(opponents) === 0);
    const schneider =
        !tout && (schwarz || callerPoints <= SCHNEIDER_MAX.callers || opponentPoints <= SCHNEIDER_MAX.opponents);
    const value = tout
        ? coins * TOUT_FACTOR
        : coins + (schneider ? SCHNEIDER_BONUS : 0) + (schwarz ? SCHWARZ_BONUS : 0);

    if (callers.length === 2) {
        // Two against two: each player gains or loses the reward once.
        for (const p of winners) deltas[p] += value;
        for (const p of losers) deltas[p] -= value;
    } else {
        // One against three: every opponent settles with the soloist.
        const [soloist] = callers;
        for (const opponent of opponents) {
            const amount = callersWin ? value : -value;
            deltas[soloist] += amount;
            deltas[opponent] -= amount;
        }
    }

    return { winners, losers, deltas, callerPoints, schneider, schwarz, tout, value };
}
