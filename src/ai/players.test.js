import test from "node:test";
import assert from "node:assert/strict";

import { chooseCard, decideAnnouncement, decideKontra, decideRetour, getGameRank, getWinningIndex } from "./players.js";

const c = (suit, rank) => ({ suit, rank });

test("Strong hands announce, weak hands pass", () => {
    // Six leaf trumps: a Leaf Solo
    const solo = [c("acorn", "O"), c("leaf", "O"), c("leaf", "A"), c("leaf", "10"), c("leaf", "K"), c("leaf", "9")];
    assert.equal(decideAnnouncement(solo).game, "Solo:leaf");
    // Five high leaf trumps and a sheep: also a Solo
    const highSolo = [c("acorn", "O"), c("leaf", "O"), c("bell", "U"), c("leaf", "10"), c("leaf", "K"), c("bell", "A")];
    assert.equal(decideAnnouncement(highSolo).game, "Solo:leaf");
    // Five trumps, but only two high ones: no Solo
    const thin = [c("acorn", "O"), c("leaf", "O"), c("leaf", "A"), c("leaf", "10"), c("leaf", "K"), c("bell", "A")];
    assert.notEqual(decideAnnouncement(thin)?.game, "Solo:leaf");

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

test("Tout outranks every game without one, Solo Tout above Dog Game Tout", () => {
    assert.ok(getGameRank("Wenz:tout") > getGameRank("Solo:acorn"));
    assert.ok(getGameRank("Solo:bell:tout") > getGameRank("Wenz:tout"));
    assert.equal(getGameRank("Solo:leaf"), getGameRank("Solo"));
});

test("a hand with all four dogs and two sheep announces a Dog Game Tout", () => {
    const hand = [
        { id: "acorn-U", suit: "acorn", rank: "U" },
        { id: "leaf-U", suit: "leaf", rank: "U" },
        { id: "heart-U", suit: "heart", rank: "U" },
        { id: "bell-U", suit: "bell", rank: "U" },
        { id: "acorn-A", suit: "acorn", rank: "A" },
        { id: "bell-A", suit: "bell", rank: "A" },
    ];
    assert.equal(decideAnnouncement(hand)?.game, "Wenz:tout");
});

test("Kontra with a strong hand against the announcers, Retour with a very strong one", () => {
    // Four Sheep Game trumps, two of them high: Kontra
    const strong = [c("acorn", "O"), c("bell", "U"), c("heart", "A"), c("heart", "9"), c("bell", "9"), c("leaf", "K")];
    assert.equal(decideKontra(strong, "Sau Spiel"), true);
    // Two trumps: no Kontra
    const weak = [c("heart", "9"), c("bell", "U"), c("acorn", "A"), c("leaf", "9"), c("bell", "9"), c("leaf", "K")];
    assert.equal(decideKontra(weak, "Sau Spiel"), false);
    // Against a Dog Game, two dogs are enough
    assert.equal(decideKontra([c("acorn", "U"), c("leaf", "U"), c("bell", "9"), c("leaf", "9"), c("heart", "K"), c("bell", "K")], "Wenz"), true);

    // Five trumps: Retour; four with only one shepherd: none
    const five = [c("acorn", "O"), c("bell", "U"), c("heart", "A"), c("heart", "9"), c("heart", "K"), c("leaf", "K")];
    assert.equal(decideRetour(five, "Sau Spiel"), true);
    assert.equal(decideRetour(strong, "Sau Spiel"), false);
});
