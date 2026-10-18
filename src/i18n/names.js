// Names of games, cards, suits and roles in the current language, for the
// interface. The game data itself (data/gameTypes.js) stays language-free.

import { parseGame } from "../ai/schafkopfAI";
import { getAvailableGames } from "../data/gameTypes";
import { t } from "./index";

// Game names, from a game value like "Sau Spiel" or "Solo:leaf".
// "Sheep Game", "Acorn Solo"
export function gameName(value) {
    const { base, suit, tout } = parseGame(value);
    return t("game.name", { game: base, suit, tout });
}

// With an article: "a Sheep Game", "ein Eichel-Solo".
export function gameWithArticle(value) {
    const { base, suit, tout } = parseGame(value);
    return t("game.a", { game: base, suit, tout });
}

export function suitName(suit) {
    return t("suit.name", { suit });
}

export function rankName(rank) {
    return t("rank.name", { rank });
}

// The label at the bottom of a card face: "SHEEP", "SCHÄFER".
export function cardLabel(rank) {
    return t("rank.cardLabel", { rank });
}

// By colour: "blue shepherd", "blauer Schäfer".
export function cardName(card) {
    return t("card.name", { suit: card.suit, rank: card.rank });
}

// A role at the table ("Caller", "Partner", …), shown under a player's name.
export function statusName(status) {
    return status ? t(`status.${status}`) : null;
}

// Why a game can't be announced with this hand, or null if it can.
export function getUnavailableReason(game, hand) {
    if (getAvailableGames(hand).some((g) => g.value === game.value)) return null;
    if (game.value === "Sau Spiel") return t("game.unavailable.sheep");
    if (game.value === "Marriage") return t("game.unavailable.marriage");
    return t("game.unavailable.other");
}
