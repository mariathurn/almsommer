// The five games from the rulebook ("Almsommer"), offered as festival
// banners with their coin reward. `label` is the English name, kept as a
// reference (and for tests); the interface names games through
// i18n/names.js, in the chosen language. Only the Sheep Game rules are
// implemented so far; the others are selectable but currently play with the
// same trumps.

import { canCallAce, isTrumpForGame, parseGame } from "../ai/schafkopfAI.js";

export const gameTypes = [
    {
        value: "Sau Spiel",
        label: "Sheep Game",
        coins: 5,
    },
    {
        value: "Solo",
        label: "Solo Game",
        coins: 20,
    },
    {
        value: "Wenz",
        label: "Dog Game",
        coins: 20,
    },
    {
        value: "Marriage",
        label: "Marriage",
        coins: 20,
    },
    {
        value: "Ramsch",
        label: "Cowards Game",
        coins: 5,
        // Never announced: it is what gets played when everybody passes.
        announceable: false,
    },
];

// Games this hand may announce. Sheep Game needs a sheep you may call;
// Marriage needs exactly one trump; Solo and Dog Game are always allowed.
export function getAvailableGames(hand) {
    const trumpCount = hand.filter((card) => isTrumpForGame(card, "Sau Spiel")).length;

    return gameTypes.filter((game) => {
        if (game.announceable === false) return false;
        if (game.value === "Sau Spiel") return ["bell", "acorn", "leaf"].some((suit) => canCallAce(suit, hand));
        if (game.value === "Marriage") return trumpCount === 1;
        return true;
    });
}

// Accepts full game values like "Solo:leaf" too.
export function getGameType(value) {
    const { base } = parseGame(value);
    return gameTypes.find((game) => game.value === base) ?? null;
}
