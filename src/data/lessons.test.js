import test from "node:test";
import assert from "node:assert/strict";

import { chooseCard, decideAnnouncement, getGameRank, getWinningIndex } from "../ai/players.js";
import { canOfferMarriage, canPlayCard, getSauSpielTeams } from "../ai/schafkopfAI.js";
import { getTrickPoints } from "../ai/scoring.js";
import { dealGuided, dealPractice, guidedLesson, practiceLessons } from "./lessons.js";

const order = ["south", "west", "north", "east"];

test("guided game: nobody offers a marriage or outbids your Sheep Game", () => {
    const { hands } = dealGuided();
    for (const seat of order) assert.equal(canOfferMarriage(hands[seat]), false, seat);
    for (const seat of ["west", "north", "east"]) {
        assert.equal(decideAnnouncement(hands[seat], getGameRank(guidedLesson.game)), null, seat);
    }
});

test("guided game: every suggested card is legal, and you win 113 : 7", () => {
    const { hands } = dealGuided();
    const { game, calledAce } = guidedLesson;
    const teams = getSauSpielTeams(hands, "south", calledAce);
    assert.deepEqual(teams.callerTeam, ["south", "north"]);

    const points = { south: 0, west: 0, north: 0, east: 0 };
    let lead = guidedLesson.lead;
    let revealed = null;
    let turn = 0;
    for (let trick = 0; trick < 6; trick++) {
        const played = [];
        for (let k = 0; k < 4; k++) {
            const seat = order[(order.indexOf(lead) + k) % 4];
            const hand = hands[seat];
            let index;
            if (seat === "south") {
                index = hand.findIndex((card) => card.id === guidedLesson.turns[turn]);
                assert.ok(index >= 0, `turn ${turn + 1}: card in hand`);
                assert.ok(canPlayCard(hand[index], hand, played, game, calledAce), `turn ${turn + 1}: legal`);
                turn++;
            } else {
                index = chooseCard({ me: seat, hand, playedCards: played, gameName: game, calledAce, caller: "south", teams, revealedAceOwner: revealed });
            }
            const card = hand[index];
            hands[seat] = hand.filter((_, i) => i !== index);
            played.push({ player: seat, card });
            if (card.suit === calledAce && card.rank === "A") revealed = seat;
        }
        lead = played[getWinningIndex(played, game)].player;
        points[lead] += getTrickPoints(played);
    }
    assert.equal(points.south + points.north, 113);
    assert.equal(points.west + points.east, 7);
});

test("every practice lesson can be dealt", () => {
    for (const lesson of practiceLessons) {
        const { hands } = dealPractice(lesson);
        assert.equal(Object.values(hands).flat().length, 24, lesson.id);
    }
});
