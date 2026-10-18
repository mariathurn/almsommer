// Fixed deals for the developer menu (only in development builds): each
// scenario sets some hands and who leads, and may `check` the whole deal.
// The other hands are dealt at random, but never with exactly one trump, so
// no surprise marriage gets in the way. Card ids are "<suit>-<rank>",
// e.g. "acorn-O".

import { canAcceptMarriage, isTrumpForGame } from "../ai/schafkopfAI.js";
import { cardMeta } from "./cardMeta.js";

const seats = ["south", "west", "north", "east"];

export const devScenarios = [
    {
        id: "marriage-asked",
        // East holds one trump and offers a marriage; you are asked first
        // (with a card that is no trump, so you may accept).
        lead: "east",
        hands: { east: ["acorn-O", "acorn-9", "acorn-K", "leaf-9", "leaf-K", "bell-9"] },
        check: (hands) => canAcceptMarriage(hands.south),
    },
    {
        id: "marriage-offer",
        // You hold one trump and may offer a marriage.
        lead: "south",
        hands: { south: ["acorn-O", "acorn-9", "acorn-K", "leaf-9", "leaf-K", "bell-9"] },
    },
    {
        id: "sheep-game",
        // Four trumps and a leaf to call the green sheep with.
        lead: "south",
        hands: { south: ["acorn-O", "leaf-U", "heart-A", "heart-10", "leaf-9", "bell-K"] },
    },
    {
        id: "solo-tout",
        // All four shepherds and two dogs: a Solo Tout in any suit.
        lead: "south",
        hands: { south: ["acorn-O", "leaf-O", "heart-O", "bell-O", "acorn-U", "leaf-U"] },
    },
    {
        id: "dog-tout",
        // All four dogs and two sheep: a Dog Game Tout.
        lead: "south",
        hands: { south: ["acorn-U", "leaf-U", "heart-U", "bell-U", "acorn-A", "leaf-A"] },
    },
];

const byId = Object.fromEntries(cardMeta.map((card) => [card.id, card]));
const sheepTrumps = (hand) => hand.filter((card) => isTrumpForGame(card, "Sau Spiel")).length;

function shuffle(cards) {
    const deck = [...cards];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// The full deal for a scenario: { hands: { south: [cards], ... }, lead }.
export function dealScenario(scenario) {
    const fixed = Object.fromEntries(Object.entries(scenario.hands).map(([seat, ids]) => [seat, ids.map((id) => byId[id])]));
    const used = new Set(Object.values(scenario.hands).flat());
    const rest = cardMeta.filter((card) => !used.has(card.id));
    const open = seats.filter((seat) => !fixed[seat]);

    for (let attempt = 0; attempt < 500; attempt++) {
        const deck = shuffle(rest);
        const hands = { ...fixed };
        open.forEach((seat, i) => {
            hands[seat] = deck.slice(i * 6, i * 6 + 6);
        });
        const noSurprise = open.every((seat) => sheepTrumps(hands[seat]) !== 1);
        if (noSurprise && (!scenario.check || scenario.check(hands))) return { hands, lead: scenario.lead };
    }
    throw new Error(`No deal found for scenario ${scenario.id}`);
}
