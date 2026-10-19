import test from "node:test";
import assert from "node:assert/strict";

import { scoreRound, getTrickPoints } from "./scoring.js";

const sum = (deltas) => Object.values(deltas).reduce((a, b) => a + b, 0);

test("Trick points add up the card values", () => {
    const trick = [
        { player: "south", card: { suit: "heart", rank: "A" } },
        { player: "west", card: { suit: "heart", rank: "10" } },
        { player: "north", card: { suit: "bell", rank: "9" } },
        { player: "east", card: { suit: "acorn", rank: "O" } },
    ];
    assert.equal(getTrickPoints(trick), 24);
});

test("Sheep Game: the calling pair wins with 61 points, two against two", () => {
    const result = scoreRound({
        gameName: "Sau Spiel",
        coins: 5,
        callerTeam: ["south", "north"],
        points: { south: 40, north: 21, west: 30, east: 29 },
    });
    assert.deepEqual(result.winners, ["south", "north"]);
    assert.deepEqual(result.deltas, { south: 5, west: -5, north: 5, east: -5 });
    assert.equal(sum(result.deltas), 0);
});

test("Sheep Game: 60 points is not enough", () => {
    const result = scoreRound({
        gameName: "Sau Spiel",
        coins: 5,
        callerTeam: ["south", "north"],
        points: { south: 40, north: 20, west: 30, east: 30 },
    });
    assert.deepEqual(result.winners, ["west", "east"]);
    assert.equal(result.deltas.south, -5);
});

test("Solo: the soloist settles with each of the three opponents", () => {
    const won = scoreRound({ gameName: "Solo", coins: 20, callerTeam: ["south"], points: { south: 70, west: 20, north: 20, east: 10 } });
    assert.deepEqual(won.deltas, { south: 60, west: -20, north: -20, east: -20 });

    const lost = scoreRound({ gameName: "Wenz", coins: 20, callerTeam: ["south"], points: { south: 50, west: 30, north: 20, east: 20 } });
    assert.deepEqual(lost.deltas, { south: -60, west: 20, north: 20, east: 20 });
});

test("Cowards Game: whoever took the most points pays everyone else", () => {
    const result = scoreRound({ gameName: "Ramsch", coins: 5, points: { south: 20, west: 45, north: 30, east: 25 } });
    assert.deepEqual(result.losers, ["west"]);
    assert.deepEqual(result.deltas, { south: 5, west: -15, north: 5, east: 5 });
    assert.equal(sum(result.deltas), 0);
});

test("Schneider: the opponents with at most 29 points make the game 5 coins dearer", () => {
    const schneider = scoreRound({
        gameName: "Sau Spiel",
        coins: 5,
        callerTeam: ["south", "north"],
        points: { south: 50, north: 41, west: 20, east: 9 },
    });
    assert.equal(schneider.schneider, true);
    assert.equal(schneider.schwarz, false);
    assert.deepEqual(schneider.deltas, { south: 10, west: -10, north: 10, east: -10 });

    // 30 points for the opponents is not Schneider yet.
    const free = scoreRound({
        gameName: "Sau Spiel",
        coins: 5,
        callerTeam: ["south", "north"],
        points: { south: 50, north: 40, west: 20, east: 10 },
    });
    assert.equal(free.schneider, false);
    assert.equal(free.deltas.south, 5);
});

test("Schneider: the announcing side with at most 30 points loses dearer", () => {
    const schneider = scoreRound({ gameName: "Solo", coins: 20, callerTeam: ["south"], points: { south: 30, west: 40, north: 30, east: 20 } });
    assert.equal(schneider.schneider, true);
    assert.deepEqual(schneider.deltas, { south: -75, west: 25, north: 25, east: 25 });

    // 31 points gets the soloist out of Schneider.
    const free = scoreRound({ gameName: "Solo", coins: 20, callerTeam: ["south"], points: { south: 31, west: 40, north: 29, east: 20 } });
    assert.equal(free.schneider, false);
    assert.equal(free.deltas.south, -60);
});

test("Schwarz: a side without a single trick adds another 5 coins", () => {
    const result = scoreRound({
        gameName: "Wenz",
        coins: 20,
        callerTeam: ["south"],
        points: { south: 120, west: 0, north: 0, east: 0 },
        tricks: { south: 6, west: 0, north: 0, east: 0 },
    });
    assert.equal(result.schneider, true);
    assert.equal(result.schwarz, true);
    assert.equal(result.value, 30);
    assert.deepEqual(result.deltas, { south: 90, west: -30, north: -30, east: -30 });
    assert.equal(sum(result.deltas), 0);

    // A trick with no points still saves a side from Schwarz, not from Schneider.
    const oneTrick = scoreRound({
        gameName: "Wenz",
        coins: 20,
        callerTeam: ["south"],
        points: { south: 120, west: 0, north: 0, east: 0 },
        tricks: { south: 5, west: 1, north: 0, east: 0 },
    });
    assert.equal(oneTrick.schwarz, false);
    assert.equal(oneTrick.value, 25);
});

test("Cowards Game: no Schneider or Schwarz", () => {
    const result = scoreRound({
        gameName: "Ramsch",
        coins: 5,
        points: { south: 0, west: 100, north: 10, east: 10 },
        tricks: { south: 0, west: 5, north: 1, east: 0 },
    });
    assert.equal(result.schneider, false);
    assert.equal(result.schwarz, false);
    assert.equal(result.deltas.west, -15);
});

test("Tout: won only if the opponents take no trick, at double value", () => {
    const won = scoreRound({
        gameName: "Solo:leaf:tout",
        coins: 20,
        callerTeam: ["south"],
        points: { south: 120, west: 0, north: 0, east: 0 },
        tricks: { south: 6, west: 0, north: 0, east: 0 },
    });
    assert.equal(won.tout, true);
    assert.equal(won.value, 40);
    // No Schneider or Schwarz on top of a Tout.
    assert.equal(won.schneider, false);
    assert.equal(won.schwarz, false);
    assert.deepEqual(won.deltas, { south: 120, west: -40, north: -40, east: -40 });

    // One trick for the opponents loses it, even with most of the points.
    const lost = scoreRound({
        gameName: "Wenz:tout",
        coins: 20,
        callerTeam: ["south"],
        points: { south: 110, west: 10, north: 0, east: 0 },
        tricks: { south: 5, west: 1, north: 0, east: 0 },
    });
    assert.deepEqual(lost.winners, ["west", "north", "east"]);
    assert.deepEqual(lost.deltas, { south: -120, west: 40, north: 40, east: 40 });
    assert.equal(sum(lost.deltas), 0);
});

test("Kontra doubles the value, Retour doubles it again", () => {
    const round = {
        gameName: "Sau Spiel",
        coins: 5,
        callerTeam: ["south", "north"],
        points: { south: 40, north: 21, west: 30, east: 29 },
    };
    assert.equal(scoreRound({ ...round, doubles: 1 }).value, 10);
    const retour = scoreRound({ ...round, doubles: 2 });
    assert.equal(retour.value, 20);
    assert.deepEqual(retour.deltas, { south: 20, west: -20, north: 20, east: -20 });
    // Schneider counts before doubling: (5 + 5) × 2
    const schneider = scoreRound({ ...round, points: { south: 60, north: 31, west: 20, east: 9 }, doubles: 1 });
    assert.equal(schneider.value, 20);
});
