// Card decks to choose from in the settings. Only the Almsommer deck exists
// so far; more decks can be added here later.
//
// Each entry:
//   id:      unique key
//   name:    shown in the settings
//   preview: a few cards to show as a sample, as { rank, suit }

export const cardDecks = [
    {
        id: "almsommer",
        name: "Almsommer",
        description: "Hats, staffs, grain, sheep, dogs and shepherds",
        preview: [
            { rank: "O", suit: "acorn" },
            { rank: "A", suit: "leaf" },
            { rank: "U", suit: "heart" },
        ],
    },
];

export const DEFAULT_DECK = "almsommer";
