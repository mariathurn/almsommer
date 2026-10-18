// Achievements, shown on the achievements screen with a trophy. They are
// checked after every round you play (and the savings ones whenever your
// savings change); data/achievementStore.js remembers which you have.
//
// Each entry:
//   id:    unique key; its title and description are the texts
//          "achievement.<id>.title" and "achievement.<id>.description"
//          in i18n/en.js and de.js
//   check: ({ round, seat, savings }) => true once earned, where
//          round   is the finished round (see useSchafkopfGame: gameName,
//                  winners, losers, deltas, points, callerTeam, tricks, hands),
//                  or null when only the savings are checked
//          seat    is your seat ("south")
//          savings is your savings after the round

import { isTrumpForGame, parseGame } from "../ai/schafkopfAI.js";

const TOTAL_POINTS = 120;

const won = (round, seat) => Boolean(round?.winners.includes(seat));
const lost = (round, seat) => Boolean(round?.losers.includes(seat));
const base = (round) => parseGame(round.gameName).base;
// You announced the game and won it (Solo, Dog Game).
const wonOwnGame = (round, seat, game) => won(round, seat) && base(round) === game && round.callerTeam.includes(seat);
// You announced this game as a Tout and won it.
const wonOwnTout = (round, seat, game) => wonOwnGame(round, seat, game) && parseGame(round.gameName).tout;
const trumpsDealt = (round, seat) => round.hands[seat].filter((card) => isTrumpForGame(card, round.gameName)).length;
// Card points your side took: your team in a game with a caller, else your own.
const sidePoints = (round, seat) => {
    const side = round.callerTeam.includes(seat) ? round.callerTeam : round.callerTeam.length ? null : [seat];
    if (side) return side.reduce((sum, p) => sum + round.points[p], 0);
    return TOTAL_POINTS - round.callerTeam.reduce((sum, p) => sum + round.points[p], 0);
};

export const achievements = [
    { id: "first-win", check: ({ round, seat }) => won(round, seat) },
    { id: "first-loss", check: ({ round, seat }) => lost(round, seat) },
    { id: "first-solo", check: ({ round, seat }) => Boolean(round) && wonOwnGame(round, seat, "Solo") },
    { id: "first-dog-game", check: ({ round, seat }) => Boolean(round) && wonOwnGame(round, seat, "Wenz") },
    { id: "solo-tout", check: ({ round, seat }) => Boolean(round) && wonOwnTout(round, seat, "Solo") },
    { id: "dog-tout", check: ({ round, seat }) => Boolean(round) && wonOwnTout(round, seat, "Wenz") },
    { id: "two-trumps", check: ({ round, seat }) => won(round, seat) && base(round) !== "Ramsch" && trumpsDealt(round, seat) <= 2 },
    { id: "first-ramsch", check: ({ round, seat }) => won(round, seat) && base(round) === "Ramsch" },
    { id: "big-win", check: ({ round, seat }) => (round?.deltas[seat] ?? 0) >= 100 },
    { id: "savings-100", check: ({ savings }) => savings >= 100 },
    { id: "savings-1000", check: ({ savings }) => savings >= 1000 },
    { id: "savings-10000", check: ({ savings }) => savings >= 10000 },
    { id: "grandma-game", check: ({ round, seat }) => won(round, seat) && trumpsDealt(round, seat) >= 6 },
    { id: "all-points", check: ({ round, seat }) => won(round, seat) && sidePoints(round, seat) === TOTAL_POINTS },
];

// Ids of the achievements earned by this round (or these savings) that are
// not in `unlocked` yet.
export function findNewAchievements({ round = null, seat = "south", savings = 0, unlocked = {} }) {
    return achievements
        .filter((achievement) => !unlocked[achievement.id] && achievement.check({ round, seat, savings }))
        .map((achievement) => achievement.id);
}
