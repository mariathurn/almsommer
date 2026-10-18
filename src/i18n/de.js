// Deutsche Texte, mit denselben Schlüsseln wie en.js (siehe i18n/index.js).
// Spiele: "Sau Spiel" = Schafspiel, "Solo", "Wenz" = Hundespiel,
// "Marriage" = Hochzeit, "Ramsch".

const suits = { acorn: "Eichel", heart: "Herz", leaf: "Gras", bell: "Schellen" };
// Farbe jeder Karte wie im Regelheft, gebeugt für "das blaue Schaf".
const colours = { acorn: "blaue", heart: "rote", leaf: "grüne", bell: "orange" };
const ranks = { "9": "Hut", K: "Stab", "10": "Korn", A: "Schaf", U: "Hund", O: "Schäfer" };
const games = {
    "Sau Spiel": "Schafspiel",
    Solo: "Solo",
    Wenz: "Hundespiel",
    Marriage: "Hochzeit",
    Ramsch: "Ramsch",
};
// Unbestimmter und bestimmter Artikel im Akkusativ ("sagt ein Schafspiel an",
// "verliert den Ramsch").
const indefinite = { "Sau Spiel": "ein", Solo: "ein", Wenz: "ein", Marriage: "eine", Ramsch: "einen" };
const definite = { "Sau Spiel": "das", Solo: "das", Wenz: "das", Marriage: "die", Ramsch: "den" };

// "Schafspiel", "Eichel-Solo"
const gameName = ({ game, suit }) => (game === "Solo" && suit ? `${suits[suit]}-Solo` : games[game]);
const withA = ({ game, suit }) => `${indefinite[game]} ${gameName({ game, suit })}`;

export default {
    // Startmenü
    "menu.play": "Spielen",
    "menu.achievements": "Erfolge",
    "menu.settings": "Einstellungen",
    "menu.playLabel": "Spielen",
    "menu.achievementsLabel": "Erfolge",
    "menu.settingsLabel": "Einstellungen",

    // Allgemein
    "common.done": "Fertig",
    "common.back": "Zurück",
    "common.close": "Schließen",
    "common.backToMenu": "‹ Menü",
    "common.menu": "Menü",
    "coins.count": "{count} Münzen",
    "coins.session": "{count} Münzen in dieser Sitzung",

    // Einstellungen
    "settings.heading": "Einstellungen",
    "settings.close": "Einstellungen schließen",
    "settings.music": "Musik",
    "settings.musicHint": "Die Almmelodie im Hintergrund",
    "settings.effects": "Soundeffekte",
    "settings.effectsHint": "Mischen, Karten, Stiche und die Schafe",
    "settings.language": "Sprache",
    "settings.cardDeck": "Kartendeck",
    "settings.viewCards": "Alle Karten ansehen ›",
    "settings.viewCardsLabel": "Die {deck}-Karten ansehen",
    "deck.almsommer.description": "Hüte, Stäbe, Korn, Schafe, Hunde und Schäfer",

    // Pausenmenü im Spiel
    "pause.heading": "Pause",
    "pause.resume": "Weiterspielen",
    "pause.leave": "Spiel verlassen",
    "pause.leaveHeading": "Spiel verlassen?",
    "pause.leaveText": "Diese Runde ist noch nicht vorbei. Wenn du jetzt gehst, zählt sie nicht.",
    "pause.stay": "Bleiben",

    // Profil
    "profile.heading": "Dein Schäfer",
    "profile.close": "Profil schließen",
    "profile.choosePortrait": "Wähle ein Porträt",
    "profile.portrait": "Porträt {number}",
    "profile.name": "Name",
    "profile.nameHint": "Steht im Menü und in deinen Spielergebnissen",
    "profile.savedOverall": "Insgesamt gespart",
    "profile.bestGame": "Bestes Spiel",
    "profile.gamesPlayed": "Gespielte Spiele",
    "profile.saved": "{amount} gespart",
    "profile.badgeLabel": "Dein Profil: {name}, {amount} Münzen gespart",

    // Kartenansicht
    "deck.title": "Die Karten",
    "deck.hint": "Tippe auf eine Karte, um sie genauer anzusehen",
    "deck.rank": "Rang",
    "deck.points": "Augen",
    "deck.closeHint": "Zum Schließen irgendwo tippen",

    // Erfolge
    "achievements.title": "Erfolge",
    "achievements.count": "{earned} / {total}",
    "achievements.locked": "noch nicht erreicht",
    "achievements.unlockedOn": "Erreicht am {date}",
    "achievements.toast": "Erfolg freigeschaltet",
    "achievement.first-win.title": "Neuling",
    "achievement.first-win.description": "Gewinne deine erste Runde.",
    "achievement.first-loss.title": "Stolperer",
    "achievement.first-loss.description": "Verliere eine Runde. Das passiert jedem Schäfer.",
    "achievement.first-solo.title": "Einsamer Schäfer",
    "achievement.first-solo.description": "Sag ein Solo an und gewinne es.",
    "achievement.first-dog-game.title": "Leithund",
    "achievement.first-dog-game.description": "Sag ein Hundespiel an und gewinne es.",
    "achievement.solo-tout.title": "Solo Tout",
    "achievement.solo-tout.description": "Gewinne ein Solo und mach jeden Stich.",
    "achievement.dog-tout.title": "Hundespiel Tout",
    "achievement.dog-tout.description": "Gewinne ein Hundespiel und mach jeden Stich.",
    "achievement.two-trumps.title": "Dünnes Eis",
    "achievement.two-trumps.description": "Gewinne eine Runde mit höchstens zwei Trümpfen auf der Hand.",
    "achievement.first-ramsch.title": "Glück im Ramsch",
    "achievement.first-ramsch.description": "Komm in einem Ramsch ungeschoren davon.",
    "achievement.big-win.title": "Volltreffer",
    "achievement.big-win.description": "Gewinne mindestens 100 Münzen in einer Runde.",
    "achievement.savings-100.title": "Gut gespart",
    "achievement.savings-100.description": "Spare 100 Münzen an.",
    "achievement.savings-1000.title": "Besser gespart",
    "achievement.savings-1000.description": "Spare 1.000 Münzen an.",
    "achievement.savings-10000.title": "Münzhamster",
    "achievement.savings-10000.description": "Spare 10.000 Münzen an.",
    "achievement.grandma-game.title": "Oma-Spiel",
    "achievement.grandma-game.description": "Gewinne eine Runde mit sechs Trümpfen auf der Hand.",
    "achievement.all-points.title": "Augenkenner",
    "achievement.all-points.description": "Gewinne eine Runde mit allen 120 Augen.",

    // Karten
    "suit.name": ({ suit }) => suits[suit],
    "rank.name": ({ rank }) => ranks[rank],
    "rank.cardLabel": ({ rank }) => ranks[rank].toUpperCase(),
    // "Gras-Korn"
    "card.name": ({ suit, rank }) => `${suits[suit]}-${ranks[rank]}`,

    // Spiele
    "game.name": gameName,
    "game.a": withA,
    "game.the": ({ game }) => `${definite[game]} ${games[game]}`,
    "game.blurb.Sau Spiel": "Ruf ein Schaf. Wer es hat, ist heimlich dein Partner.",
    "game.blurb.Solo": "Wähle eine Trumpffarbe. Einer gegen drei.",
    "game.blurb.Wenz": "Nur die Hunde sind Trumpf. Du spielst allein.",
    "game.blurb.Marriage": "Biete deinen einzigen Trumpf an und finde einen Partner.",
    "game.unavailable.sheep": "Kein Schaf, das du rufen darfst",
    "game.unavailable.marriage": "Nur mit genau einem Trumpf auf der Hand",
    "game.unavailable.other": "Mit diesem Blatt nicht möglich",

    // Rollen am Tisch
    "status.Caller": "Ansager",
    "status.Player": "Spieler",
    "status.Partner": "Partner",
    "status.Opponent": "Gegner",
    "status.Unknown": "Unbekannt",
    "status.Friend": "Freund",

    // Banner oben am Tisch
    "banner.declare": "Sag dein Spiel an",
    "banner.callsSheep": ({ name, suit }) => `${name} ruft das ${colours[suit]} Schaf`,
    "banner.plays": ({ name, game, suit }) => `${name} spielt ${withA({ game, suit })}`,
    "banner.cowards": "Ramsch: Keiner hat angesagt",
    "banner.marries": "{name} heiratet {partner}",
    "banner.takesTrick": "{name} macht den Stich",
    "banner.dealToBegin": "Teil die Karten aus, um zu beginnen",
    "banner.choose": "Wähle, was du spielen willst",
    "banner.yourTurn": "Du bist dran",
    "banner.thinking": "{name} überlegt…",

    // Ansagen
    "bid.whoPlays": "Wer spielt?",
    "bid.wants": ({ name, game, suit }) => `${name} will ${withA({ game, suit })} spielen`,
    "bid.announces": ({ name, game, suit }) => `${name} sagt ${withA({ game, suit })} an`,
    "bid.passes": "{name} passt",
    "bid.nobodyMarried": "niemand heiratet {name}",
    "bid.yourSay": "du bist dran",
    "bid.deciding": "{name} überlegt…",

    // Hochzeit
    "marriage.oneTrump": "Du hast nur einen Trumpf",
    "marriage.offers": "{name} bietet eine Hochzeit an",
    "marriage.yourAnswer": "deine Antwort",
    "marriage.swapped": "Getauscht: {from} → {to}",
    "marriage.offeredBefore": "Wird vor dem Ansagen angeboten, mit nur einem Trumpf",
    "marriage.offerHeading": "Eine Hochzeit?",
    "marriage.offerText":
        "Du hast nur einen Trumpf. Verdeckt anbieten und einen Partner finden? Wer annimmt, bekommt ihn und gibt dir eine Karte.",
    "marriage.no": "Nein",
    "marriage.offer": "Hochzeit anbieten",
    "marriage.askHeading": "Hochzeit!",
    "marriage.askText":
        "{name} hat nur einen Trumpf und bietet ihn dir an. Annehmen, den Trumpf nehmen, deine schwächste Karte zurückgeben und zusammen spielen?",
    "marriage.decline": "Ablehnen",
    "marriage.accept": "Annehmen",

    // Rundenergebnis
    "result.wins": ({ names, plural, game }) => `${names} ${plural ? "gewinnen" : "gewinnt"} ${definite[game]} ${games[game]}`,
    "result.loses": ({ names, plural, game }) => `${names} ${plural ? "verlieren" : "verliert"} ${definite[game]} ${games[game]}`,
    "result.pointsTaken": "{points} Augen gemacht",
    "result.score": "{ours} : {theirs} Augen",
    "result.round": "Runde",
    "result.session": "Sitzung",

    // Spielauswahl
    "picker.heading": "Was spielst du?",
    "picker.subheading": "Wähle ein Spiel für diese Runde oder passe.",
    "picker.soloRow": "Solo · wähle deine Trumpffarbe",
    "picker.sheepRow": "Schafspiel · ruf ein Schaf",
    "picker.pass": "Passen",
    "picker.chooseGame": "Wähle ein Spiel",
    "picker.chooseSheep": "Wähle ein Schaf",
    "picker.callSheep": ({ suit }) => `${suits[suit]}-Schaf rufen`,
    "picker.play": ({ game }) => `${games[game]} spielen`,
    "picker.tileLabel": "{game}, {coins} Münzen",

    // Tisch
    "table.deal": "Geben",
    "table.dealLabel": "Geben",
    "table.chooseGame": "Spiel\nwählen",
    "table.chooseGameLabel": "Spiel wählen",
    "table.collectTrick": "Stich einsammeln",
    "hand.mustFollow": "Farbe bedienen",
};
