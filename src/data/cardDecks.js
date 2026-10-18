// Card decks to choose from in the settings. Only the Almsommer deck exists
// so far; more decks can be added here later.
//
// Each entry:
//   id:      unique key
//   name:    shown in the settings (a name, not translated); the description
//            is the text "deck.<id>.description" in i18n/en.js and de.js
//   preview: a few cards to show as a sample, as { rank, suit }

export const cardDecks = [
    {
        id: "almsommer",
        name: "Almsommer",
        preview: [
            { rank: "O", suit: "acorn" },
            { rank: "A", suit: "leaf" },
            { rank: "U", suit: "heart" },
        ],
    },
];

export const DEFAULT_DECK = "almsommer";
