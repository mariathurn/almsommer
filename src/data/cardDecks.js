// Card decks to choose from on the welcome screen and in the settings: the
// illustrated Almsommer deck and the classic one. The choice is kept across
// app starts.
//
// Each entry:
//   id:      unique key; its name and description are the texts
//            "deck.<id>.name" and "deck.<id>.description" in i18n/en.js and de.js
//   preview: a few cards to show as a sample, as { rank, suit }

import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const cardDecks = [
    {
        id: "almsommer",
        preview: [
            { rank: "O", suit: "acorn" },
            { rank: "A", suit: "leaf" },
            { rank: "U", suit: "heart" },
        ],
    },
    {
        id: "classic",
        preview: [
            { rank: "O", suit: "acorn" },
            { rank: "A", suit: "leaf" },
            { rank: "U", suit: "heart" },
        ],
    },
];

export const DEFAULT_DECK = "almsommer";

const DECK_KEY = "almsommer.deck";
let deck = DEFAULT_DECK;
const listeners = new Set();

export function getCardDeck() {
    return deck;
}

export function setCardDeck(next) {
    if (!cardDecks.some((d) => d.id === next) || next === deck) return;
    deck = next;
    AsyncStorage.setItem(DECK_KEY, next).catch(() => {});
    listeners.forEach((listener) => listener());
}

// React hook: the chosen deck's id, re-rendering when it changes.
export function useCardDeck() {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getCardDeck
    );
}

// The deck chosen last time, if any.
AsyncStorage.getItem(DECK_KEY)
    .then((saved) => {
        if (saved && cardDecks.some((d) => d.id === saved) && saved !== deck) {
            deck = saved;
            listeners.forEach((listener) => listener());
        }
    })
    .catch(() => {});
