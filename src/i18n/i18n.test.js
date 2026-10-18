import test from "node:test";
import assert from "node:assert/strict";

import de from "./de.js";
import en from "./en.js";

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test("English and German have the same texts", () => {
    assert.deepEqual(Object.keys(de).sort(), Object.keys(en).sort());
});

test("each text has the same kind and placeholders in both languages", () => {
    for (const key of Object.keys(en)) {
        assert.equal(typeof de[key], typeof en[key], key);
        if (typeof en[key] === "string") assert.deepEqual(placeholders(de[key]), placeholders(en[key]), key);
    }
});

test("names and phrases cover every game, suit and rank", () => {
    const games = ["Sau Spiel", "Solo", "Wenz", "Marriage", "Ramsch"];
    const suits = ["acorn", "heart", "leaf", "bell"];
    const ranks = ["9", "K", "10", "A", "U", "O"];

    for (const [language, dictionary] of Object.entries({ en, de })) {
        const outputs = [
            ...games.flatMap((game) => [
                dictionary["game.name"]({ game }),
                dictionary["game.a"]({ game }),
                dictionary["game.the"]({ game }),
                dictionary["picker.play"]({ game }),
                dictionary["result.wins"]({ names: "Resi", plural: false, game }),
                dictionary["result.loses"]({ names: "Resi & Jonas", plural: true, game }),
            ]),
            ...suits.flatMap((suit) => [
                dictionary["suit.name"]({ suit }),
                dictionary["game.name"]({ game: "Solo", suit }),
                dictionary["banner.callsSheep"]({ name: "Resi", suit }),
                dictionary["picker.callSheep"]({ suit }),
            ]),
            ...ranks.flatMap((rank) => [dictionary["rank.name"]({ rank }), dictionary["rank.cardLabel"]({ rank })]),
        ];
        for (const output of outputs) assert.ok(output && !output.includes("undefined"), `${language}: ${output}`);
    }
});

test("German phrases use the right articles", () => {
    assert.equal(de["bid.announces"]({ name: "Jonas", game: "Solo", suit: "leaf" }), "Jonas sagt ein Gras-Solo an");
    assert.equal(de["bid.wants"]({ name: "Resi", game: "Marriage" }), "Resi will eine Hochzeit spielen");
    assert.equal(de["result.loses"]({ names: "Bernd", plural: false, game: "Ramsch" }), "Bernd verliert den Ramsch");
    assert.equal(de["banner.callsSheep"]({ name: "Ernie", suit: "acorn" }), "Ernie ruft das blaue Schaf");
    assert.equal(en["banner.plays"]({ name: "Resi", game: "Solo", suit: "acorn" }), "Resi plays an Acorn Solo");
});
