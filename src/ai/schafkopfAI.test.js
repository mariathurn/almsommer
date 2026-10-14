import test from "node:test";
import assert from "node:assert/strict";

import {
    isTrumpForGame,
    getPartnerForCalledAce,
    canCallAce,
    getSauSpielTeams,
    getTeamForPlayer,
    getSauSpielStatus,
    sortHandForGame,
    canPlayCard,
    resolveMarriage,
    getTrumpStrength,
} from "./schafkopfAI.js";
import { getAvailableGames } from "../data/gameTypes.js";

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

    // No regular bell card in hand, so the bell sheep cannot be called
    assert.equal(canCallAce("bell", callerHand), false);

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

test("Only a regular sheep can be called, and only with a regular card of its colour", () => {
    const hand = [
        { suit: "bell", rank: "9" },
        { suit: "acorn", rank: "A" },
        { suit: "leaf", rank: "U" },
    ];

    assert.equal(canCallAce("bell", hand), true);
    // The red sheep is a trump
    assert.equal(canCallAce("heart", [...hand, { suit: "heart", rank: "9" }]), false);
    // Holding the sheep yourself
    assert.equal(canCallAce("acorn", [...hand, { suit: "acorn", rank: "K" }]), false);
    // A green dog is a trump, not a regular green card
    assert.equal(canCallAce("leaf", hand), false);
});

test("Only the games a hand allows can be announced, never the Cowards Game", () => {
    const labels = (hand) => getAvailableGames(hand).map((game) => game.label);

    // Regular orange card without the orange sheep, and two trumps
    const sheepHand = [
        { suit: "bell", rank: "9" },
        { suit: "heart", rank: "K" },
        { suit: "acorn", rank: "O" },
    ];
    assert.deepEqual(labels(sheepHand), ["Sheep Game", "Solo Game", "Dog Game"]);

    // Exactly one trump and no sheep to call
    const marriageHand = [
        { suit: "bell", rank: "A" },
        { suit: "acorn", rank: "A" },
        { suit: "leaf", rank: "A" },
        { suit: "heart", rank: "9" },
    ];
    assert.deepEqual(labels(marriageHand), ["Solo Game", "Dog Game", "Marriage"]);
});

test("Trumps are sorted strongest first, depending on the game", () => {
    const hand = [
        { suit: "heart", rank: "9" },
        { suit: "bell", rank: "U" },
        { suit: "leaf", rank: "A" },
        { suit: "acorn", rank: "O" },
        { suit: "heart", rank: "A" },
        { suit: "acorn", rank: "U" },
    ];
    const ids = (cards) => cards.map((c) => `${c.suit}-${c.rank}`);

    assert.deepEqual(ids(sortHandForGame(hand, "Sau Spiel")), [
        "acorn-O", "acorn-U", "bell-U", "heart-A", "heart-9", "leaf-A",
    ]);
    // Dog Game: only dogs are trumps; the shepherd is an ordinary blue card
    assert.deepEqual(ids(sortHandForGame(hand, "Wenz")), [
        "acorn-U", "bell-U", "acorn-O", "leaf-A", "heart-A", "heart-9",
    ]);
});

test("A Solo makes its chosen suit the trump colour", () => {
    assert.ok(getTrumpStrength({ suit: "leaf", rank: "9" }, "Solo:leaf") > 0);
    assert.equal(getTrumpStrength({ suit: "heart", rank: "A" }, "Solo:leaf"), 0);
    // Shepherds and dogs stay trumps above the suit
    assert.ok(getTrumpStrength({ suit: "bell", rank: "U" }, "Solo:leaf") > getTrumpStrength({ suit: "leaf", rank: "A" }, "Solo:leaf"));
});

test("A dog of the led colour is a trump, not that colour", () => {
    const led = [{ player: "west", card: { suit: "bell", rank: "A" } }];
    const hand = [{ suit: "bell", rank: "U" }, { suit: "bell", rank: "9" }];
    assert.equal(canPlayCard(hand[0], hand, led, "Sau Spiel"), false);
    assert.equal(canPlayCard(hand[1], hand, led, "Sau Spiel"), true);
});

test("The called sheep must be played when its colour is led", () => {
    const hand = [{ suit: "bell", rank: "A" }, { suit: "bell", rank: "9" }, { suit: "leaf", rank: "K" }];
    const led = [{ player: "south", card: { suit: "bell", rank: "K" } }];
    assert.equal(canPlayCard(hand[0], hand, led, "Sau Spiel", "bell"), true);
    assert.equal(canPlayCard(hand[1], hand, led, "Sau Spiel", "bell"), false);
    // Without a called sheep the normal rules allow any bell
    assert.equal(canPlayCard(hand[1], hand, led, "Sau Spiel", "acorn"), true);
});

test("The called sheep can't be thrown off, and its colour can't be led without it", () => {
    const hand = [{ suit: "bell", rank: "A" }, { suit: "bell", rank: "9" }, { suit: "leaf", rank: "K" }];
    const acornLed = [{ player: "south", card: { suit: "acorn", rank: "K" } }];
    assert.equal(canPlayCard(hand[0], hand, acornLed, "Sau Spiel", "bell"), false);
    assert.equal(canPlayCard(hand[2], hand, acornLed, "Sau Spiel", "bell"), true);
    // Leading: the bell 9 is not allowed, the sheep or another colour is
    assert.equal(canPlayCard(hand[1], hand, [], "Sau Spiel", "bell"), false);
    assert.equal(canPlayCard(hand[0], hand, [], "Sau Spiel", "bell"), true);
    // Four of the colour: may run away with a low one
    const four = [...hand, { suit: "bell", rank: "K" }, { suit: "bell", rank: "10" }];
    assert.equal(canPlayCard(four[1], four, [], "Sau Spiel", "bell"), true);
    // Last trick: the sheep may go anywhere
    assert.equal(canPlayCard(hand[0], [hand[0]], acornLed, "Sau Spiel", "bell"), true);
});

test("Marriage: the first player from the left with four good trumps accepts and swaps a card", () => {
    const players = {
        south: [{ suit: "heart", rank: "9" }, { suit: "bell", rank: "A" }],
        west: [{ suit: "acorn", rank: "O" }, { suit: "leaf", rank: "9" }],
        // Four trumps, but the red staff isn't a good one
        north: [
            { suit: "acorn", rank: "U" }, { suit: "leaf", rank: "O" }, { suit: "heart", rank: "K" },
            { suit: "bell", rank: "U" }, { suit: "leaf", rank: "10" },
        ],
        east: [
            { suit: "bell", rank: "O" }, { suit: "heart", rank: "U" }, { suit: "heart", rank: "A" },
            { suit: "leaf", rank: "U" }, { suit: "acorn", rank: "9" },
        ],
    };
    const result = resolveMarriage(players);
    assert.equal(result.partner, "east");
    assert.deepEqual(result.given, { suit: "acorn", rank: "9" });
    assert.ok(result.players.east.some((c) => c.suit === "heart" && c.rank === "9"));
    assert.ok(result.players.south.some((c) => c.suit === "acorn" && c.rank === "9"));
});

test("Marriage: if nobody accepts, there is no partner and nothing is swapped", () => {
    const players = {
        south: [{ suit: "heart", rank: "9" }],
        west: [{ suit: "acorn", rank: "O" }],
        north: [{ suit: "leaf", rank: "9" }],
        east: [{ suit: "bell", rank: "K" }],
    };
    const result = resolveMarriage(players);
    assert.equal(result.partner, null);
    assert.equal(result.players, players);
});
