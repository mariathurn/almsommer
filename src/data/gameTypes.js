// The five games from the rulebook ("Almsommer"), offered as festival
// banners with their coin reward. Only the Sheep Game rules are implemented so
// far; the others are selectable but currently play with the same trumps.

import { canCallAce, isTrumpForGame, parseGame } from "../ai/schafkopfAI.js";

export const gameTypes = [
    {
        value: "Sau Spiel",
        label: "Sheep Game",
        coins: 5,
        blurb: "Call a regular sheep you don't hold. Whoever has it is your secret partner.",
    },
    {
        value: "Solo",
        label: "Solo Game",
        coins: 20,
        blurb: "Pick a colour as trumps and play one against three.",
    },
    {
        value: "Wenz",
        label: "Dog Game",
        coins: 20,
        blurb: "Only the dogs are trumps. You play alone.",
    },
    {
        value: "Marriage",
        label: "Marriage",
        coins: 20,
        blurb: "Only one trump? Offer it face down and find a partner.",
    },
    {
        value: "Ramsch",
        label: "Cowards Game",
        coins: 5,
        blurb: "Nobody announces. Whoever collects the most points loses.",
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

// English suit names, as in the Solo trump choice.
export const suitNamesEn = { acorn: "Acorn", heart: "Heart", leaf: "Leaf", bell: "Bell" };

// Accepts full game values like "Solo:leaf" too.
export function getGameType(value) {
    const { base } = parseGame(value);
    return gameTypes.find((game) => game.value === base) ?? null;
}

// Why a game can't be announced with this hand, or null if it can.
export function getUnavailableReason(game, hand) {
    if (getAvailableGames(hand).some((g) => g.value === game.value)) return null;
    if (game.value === "Sau Spiel") return "No sheep you may call";
    if (game.value === "Marriage") return "Needs exactly one trump in your hand";
    return "Not possible with this hand";
}
