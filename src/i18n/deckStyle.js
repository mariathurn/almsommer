// Which card names the texts use: the Almsommer deck's (suits by colour:
// "Grün", "das grüne Schaf") or the classic deck's ("Gras", "Ober").
// Set by data/cardDecks.js; kept here so the dictionaries can read it
// without loading the app's storage.

let classic = false;

export const isClassicDeck = () => classic;

export function setClassicDeck(value) {
    classic = value;
}
