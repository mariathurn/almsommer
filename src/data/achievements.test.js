import test from "node:test";
import assert from "node:assert/strict";

import { achievements, findNewAchievements } from "./achievements.js";

const card = (rank, suit) => ({ id: `${suit}-${rank}`, rank, suit });
const plainHand = [card("9", "bell"), card("K", "bell"), card("10", "leaf"), card("A", "leaf"), card("9", "acorn"), card("K", "acorn")];
const allTrumps = [card("O", "acorn"), card("O", "leaf"), card("U", "acorn"), card("U", "bell"), card("A", "heart"), card("10", "heart")];

// A finished round with sensible defaults: south announced and won a Sheep Game with west.
function round(overrides = {}) {
    return {
        gameName: "Sau Spiel",
        callerTeam: ["south", "west"],
        winners: ["south", "west"],
        losers: ["north", "east"],
        deltas: { south: 5, west: 5, north: -5, east: -5 },
        points: { south: 40, west: 30, north: 30, east: 20 },
        tricks: { south: 2, west: 2, north: 1, east: 1 },
        hands: { south: [card("O", "acorn"), card("U", "leaf"), card("A", "heart"), ...plainHand.slice(0, 3)] },
        ...overrides,
    };
}

const earned = (r, savings = 0) => findNewAchievements({ round: r, savings });

test("every achievement has a unique id", () => {
    const ids = achievements.map((a) => a.id);
    assert.equal(new Set(ids).size, ids.length);
});

test("first win and first loss", () => {
    assert.ok(earned(round()).includes("first-win"));
    const lost = round({ winners: ["north", "east"], losers: ["south", "west"], deltas: { south: -5, west: -5, north: 5, east: 5 } });
    assert.ok(earned(lost).includes("first-loss"));
    assert.ok(!earned(lost).includes("first-win"));
});

test("Solo and Dog Game count only when you announced and won them", () => {
    const solo = round({ gameName: "Solo:leaf", callerTeam: ["south"], winners: ["south"], losers: ["west", "north", "east"] });
    assert.ok(earned(solo).includes("first-solo"));
    const theirSolo = round({ gameName: "Solo:leaf", callerTeam: ["west"], winners: ["south", "north", "east"], losers: ["west"] });
    assert.ok(!earned(theirSolo).includes("first-solo"));
    const dog = round({ gameName: "Wenz", callerTeam: ["south"], winners: ["south"], losers: ["west", "north", "east"] });
    assert.ok(earned(dog).includes("first-dog-game"));
});

test("tout needs every trick", () => {
    const solo = { gameName: "Solo:acorn", callerTeam: ["south"], winners: ["south"], losers: ["west", "north", "east"] };
    assert.ok(!earned(round({ ...solo })).includes("solo-tout"));
    const tout = round({ ...solo, tricks: { south: 6, west: 0, north: 0, east: 0 } });
    assert.ok(earned(tout).includes("solo-tout"));
    assert.ok(!earned(tout).includes("dog-tout"));
});

test("few and many trumps in the dealt hand", () => {
    // Sheep Game trumps: shepherds, dogs and hearts. Two trumps in this hand.
    const twoTrumps = round({ hands: { south: [card("O", "acorn"), card("A", "heart"), ...plainHand.slice(0, 4)] } });
    assert.ok(earned(twoTrumps).includes("two-trumps"));
    assert.ok(!earned(round()).includes("two-trumps"));
    const grandma = round({ hands: { south: allTrumps } });
    assert.ok(earned(grandma).includes("grandma-game"));
});

test("winning the Cowards Game", () => {
    const ramsch = round({ gameName: "Ramsch", callerTeam: [], winners: ["south", "west", "east"], losers: ["north"] });
    assert.ok(earned(ramsch).includes("first-ramsch"));
    assert.ok(!earned(ramsch).includes("two-trumps"));
});

test("all 120 points, for your side", () => {
    const all = round({ points: { south: 70, west: 50, north: 0, east: 0 } });
    assert.ok(earned(all).includes("all-points"));
    const defended = round({
        callerTeam: ["north", "east"],
        winners: ["south", "west"],
        losers: ["north", "east"],
        points: { south: 60, west: 60, north: 0, east: 0 },
    });
    assert.ok(earned(defended).includes("all-points"));
    assert.ok(!earned(round()).includes("all-points"));
});

test("coins: a big win and the savings milestones", () => {
    assert.ok(earned(round({ deltas: { south: 100, west: 0, north: -50, east: -50 } })).includes("big-win"));
    assert.deepEqual(findNewAchievements({ savings: 1240 }), ["savings-100", "savings-1000"]);
    assert.deepEqual(findNewAchievements({ savings: 1240, unlocked: { "savings-100": 1 } }), ["savings-1000"]);
});

test("nothing is unlocked twice", () => {
    const unlocked = Object.fromEntries(achievements.map((a) => [a.id, 1]));
    assert.deepEqual(findNewAchievements({ round: round(), savings: 99999, unlocked }), []);
});
