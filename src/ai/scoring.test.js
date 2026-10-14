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
