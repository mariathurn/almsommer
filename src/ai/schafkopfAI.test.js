import test from "node:test";
import assert from "node:assert/strict";

import {
    isTrumpForGame,
    getPartnerForCalledAce,
    canCallAce,
    getSauSpielTeams,
    getTeamForPlayer,
    getSauSpielStatus,
} from "./schafkopfAI.js";

test("Sau Spiel treats hearts, obers, and unters as trumps", () => {
    assert.equal(isTrumpForGame({ suit: "heart", rank: "A" }, "Sau Spiel"), true);
    assert.equal(isTrumpForGame({ suit: "bell", rank: "O" }, "Sau Spiel"), true);
    assert.equal(isTrumpForGame({ suit: "bell", rank: "U" }, "Sau Spiel"), true);
    assert.equal(isTrumpForGame({ suit: "bell", rank: "A" }, "Sau Spiel"), false);
});

test("Caller cannot call an ace they already hold and can identify the partner", () => {
    const callerHand = [
        { id: "heart-A", suit: "heart", rank: "A" },
        { id: "acorn-9", suit: "acorn", rank: "9" },
    ];

    assert.equal(canCallAce("heart", callerHand), false);
    assert.equal(canCallAce("bell", callerHand), true);

    const players = {
        south: [
            { id: "heart-A", suit: "heart", rank: "A" },
            { id: "acorn-9", suit: "acorn", rank: "9" },
        ],
        west: [{ id: "bell-A", suit: "bell", rank: "A" }],
        north: [{ id: "leaf-9", suit: "leaf", rank: "9" }],
        east: [{ id: "acorn-K", suit: "acorn", rank: "K" }],
    };

    assert.equal(getPartnerForCalledAce("bell", players, "south"), "west");
});

test("The called Ace defines the hidden Sau Spiel partner team", () => {
    const players = {
        south: [
            { id: "heart-A", suit: "heart", rank: "A" },
            { id: "acorn-9", suit: "acorn", rank: "9" },
        ],
        west: [{ id: "bell-A", suit: "bell", rank: "A" }],
        north: [{ id: "leaf-9", suit: "leaf", rank: "9" }],
        east: [{ id: "acorn-K", suit: "acorn", rank: "K" }],
    };

    const teams = getSauSpielTeams(players, "south", "bell");
    assert.deepEqual(teams.callerTeam, ["south", "west"]);
    assert.deepEqual(teams.opposingTeam, ["north", "east"]);
    assert.equal(getTeamForPlayer("west", players, "south", "bell"), "callerTeam");
    assert.equal(getTeamForPlayer("north", players, "south", "bell"), "opposingTeam");
});

test("Sau Spiel labels keep the partner hidden until the called ace is played", () => {
    const teams = { callerTeam: ["south", "west"], opposingTeam: ["north", "east"] };

    assert.equal(getSauSpielStatus("south", "south", teams, null), "Caller");
    assert.equal(getSauSpielStatus("west", "south", teams, null), "Unknown");
    assert.equal(getSauSpielStatus("north", "south", teams, null), "Unknown");

    assert.equal(getSauSpielStatus("west", "south", teams, "west"), "Partner");
    assert.equal(getSauSpielStatus("north", "south", teams, "west"), "Opponent");
});
