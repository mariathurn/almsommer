import test from "node:test";
import assert from "node:assert/strict";

import { isTrumpForGame, marriageAskOrder } from "../ai/schafkopfAI.js";
import { dealScenario, devScenarios } from "./devScenarios.js";

const trumps = (hand) => hand.filter((card) => isTrumpForGame(card, "Sau Spiel")).length;

test("every scenario deals the whole deck, six cards each", () => {
    for (const scenario of devScenarios) {
        const { hands } = dealScenario(scenario);
        const ids = Object.values(hands).flat().map((card) => card.id);
        assert.equal(ids.length, 24, scenario.id);
        assert.equal(new Set(ids).size, 24, scenario.id);
        for (const hand of Object.values(hands)) assert.equal(hand.length, 6, scenario.id);
    }
});

test("marriage scenarios: the right player offers, and you are asked first", () => {
    const asked = dealScenario(devScenarios.find((s) => s.id === "marriage-asked"));
    assert.equal(trumps(asked.hands.east), 1);
    for (const seat of ["south", "west", "north"]) assert.notEqual(trumps(asked.hands[seat]), 1);
    assert.equal(marriageAskOrder("east")[0], "south");

    const offer = dealScenario(devScenarios.find((s) => s.id === "marriage-offer"));
    assert.equal(trumps(offer.hands.south), 1);
});
