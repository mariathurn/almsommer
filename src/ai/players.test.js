import test from "node:test";
import assert from "node:assert/strict";

import { chooseCard, decideAnnouncement, getGameRank, getWinningIndex } from "./players.js";

const c = (suit, rank) => ({ suit, rank });

test("Strong hands announce, weak hands pass", () => {
    // Six leaf cards incl. two shepherds: a Leaf Solo
    const solo = [c("acorn", "O"), c("leaf", "O"), c("leaf", "A"), c("leaf", "10"), c("leaf", "K"), c("leaf", "9")];
    assert.equal(decideAnnouncement(solo).game, "Solo:leaf");

    // Four Sheep Game trumps and a bell card without the bell sheep
    const sheep = [c("acorn", "O"), c("heart", "U"), c("heart", "A"), c("heart", "9"), c("bell", "9"), c("leaf", "K")];
    const announced = decideAnnouncement(sheep);
    assert.equal(announced.game, "Sau Spiel");
    assert.ok(["bell", "leaf"].includes(announced.calledAce));

    // Nothing worth playing
    const weak = [c("acorn", "9"), c("leaf", "K"), c("bell", "10"), c("acorn", "K"), c("leaf", "9"), c("heart", "9")];
    assert.equal(decideAnnouncement(weak), null);

    // A Sheep Game can't beat a Solo that's already announced
    assert.equal(decideAnnouncement(sheep, getGameRank("Solo:leaf")), null);
});

test("The winning card of a trick is found by game rules", () => {
    const trick = [
        { player: "south", card: c("bell", "A") },
        { player: "west", card: c("bell", "10") },
        { player: "north", card: c("heart", "9") },
    ];
    assert.equal(getWinningIndex(trick, "Sau Spiel"), 2); // the red hat is a trump
    assert.equal(getWinningIndex(trick, "Wenz"), 0); // in the Dog Game it isn't
});

test("A partner smears points onto a trick their partner is sure to win", () => {
    const hand = [c("leaf", "A"), c("leaf", "9")];
    const trick = [
        { player: "south", card: c("acorn", "O") }, // caller, unbeatable
        { player: "west", card: c("leaf", "K") },
        { player: "north", card: c("leaf", "10") },
    ];
    const teams = { callerTeam: ["south", "east"], opposingTeam: ["west", "north"] };
    const index = chooseCard({ me: "east", hand, playedCards: trick, gameName: "Solo:heart", caller: "south", teams });
    // In a Solo, east is the caller's opponent, so it doesn't smear
    assert.equal(hand[index].rank, "9");
    const sheepIndex = chooseCard({
        me: "east", hand: [...hand, c("bell", "A")], playedCards: trick, gameName: "Sau Spiel",
        calledAce: "bell", caller: "south", teams,
    });
    // In a Sheep Game east holds the called sheep and knows south is the partner: smear the leaf sheep
    assert.deepEqual([...hand, c("bell", "A")][sheepIndex], c("leaf", "A"));
});
