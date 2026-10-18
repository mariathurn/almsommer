// Lessons for new players: the guided first game (a Sheep Game with fixed
// cards and a tip for every move) and practice games for every game type.
// Texts are in i18n ("lesson.<id>.…", "tutorial.…").
//
// The computer players don't play at random, so with fixed cards and you
// playing the suggested card every time, the guided game always runs the
// same way: tricks, partner and the 113 : 7 result below are known.

import { decideAnnouncement } from "../ai/players.js";
import { canOfferMarriage, marriageCandidates, wantsToAcceptMarriage } from "../ai/schafkopfAI.js";
import { dealScenario } from "./devScenarios.js";

export const guidedLesson = {
    id: "guided",
    lead: "south",
    hands: {
        // Four trumps, the orange sheep to cash and a green hat to call the green sheep with.
        south: ["acorn-O", "heart-U", "heart-A", "heart-10", "leaf-9", "bell-A"],
        west: ["leaf-O", "acorn-U", "acorn-9", "acorn-K", "bell-9", "leaf-K"],
        // North holds the green sheep: your partner.
        north: ["heart-O", "heart-9", "heart-K", "leaf-A", "acorn-10", "bell-K"],
        east: ["bell-O", "leaf-U", "bell-U", "acorn-A", "leaf-10", "bell-10"],
    },
    game: "Sau Spiel",
    calledAce: "leaf",
    // Your six moves, in order: the card to play and its tip ("tutorial.turn<n>").
    turns: ["acorn-O", "heart-U", "leaf-9", "bell-A", "heart-A", "heart-10"],
};

// The fixed deal of the guided lesson: { hands: { south: [cards], ... }, lead }.
export function dealGuided() {
    return dealScenario({ id: guidedLesson.id, lead: guidedLesson.lead, hands: guidedLesson.hands });
}

const others = ["west", "north", "east"];
// No computer player announces anything, and nobody offers a marriage.
const quietTable = (hands) =>
    others.every((seat) => !decideAnnouncement(hands[seat], 0) && !canOfferMarriage(hands[seat]));

// Practice games: a hand that suits the game, the others dealt at random.
// Coins and achievements don't count.
export const practiceLessons = [
    {
        id: "sheep",
        game: "Sau Spiel",
        lead: "south",
        hands: { south: ["leaf-O", "acorn-U", "heart-A", "heart-K", "bell-9", "acorn-A"] },
        check: (hands) => quietTable(hands) && !canOfferMarriage(hands.south),
    },
    {
        id: "solo",
        game: "Solo",
        lead: "south",
        // Five acorn trumps with two shepherds and a dog: an Acorn Solo.
        hands: { south: ["acorn-O", "leaf-O", "bell-U", "acorn-A", "acorn-10", "bell-A"] },
        check: quietTable,
    },
    {
        id: "dog",
        game: "Wenz",
        lead: "south",
        // Three dogs and two sheep: a Dog Game.
        hands: { south: ["acorn-U", "leaf-U", "bell-U", "leaf-A", "bell-A", "bell-10"] },
        check: quietTable,
    },
    {
        id: "marriage",
        game: "Marriage",
        lead: "south",
        // Just one trump: offer a marriage.
        hands: { south: ["acorn-O", "leaf-A", "leaf-10", "bell-A", "bell-10", "acorn-A"] },
        check: (hands) =>
            others.every((seat) => !canOfferMarriage(hands[seat])) &&
            marriageCandidates(hands, "south").some((seat) => wantsToAcceptMarriage(hands[seat])),
    },
    {
        id: "ramsch",
        game: "Ramsch",
        lead: "south",
        // Nobody may announce anything, so all four hands are fixed: everybody
        // passes and the Cowards Game is played. Your heart sheep (11 points)
        // is the card to get rid of.
        hands: {
            south: ["heart-U", "bell-U", "heart-A", "acorn-9", "leaf-9", "bell-9"],
            west: ["acorn-O", "leaf-O", "heart-9", "acorn-A", "acorn-10", "acorn-K"],
            north: ["heart-O", "bell-O", "heart-K", "leaf-A", "leaf-10", "leaf-K"],
            east: ["acorn-U", "leaf-U", "heart-10", "bell-A", "bell-10", "bell-K"],
        },
    },
];

export function dealPractice(lesson) {
    return dealScenario({ id: lesson.id, lead: lesson.lead, hands: lesson.hands, check: lesson.check });
}
