// The five games from the rulebook ("Almsommer"), offered as festival
// banners with their coin reward. Only the Sheep Game rules are implemented so
// far; the others are selectable but currently play with the same trumps.

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
    },
];

export function getGameType(value) {
    return gameTypes.find((game) => game.value === value) ?? null;
}
