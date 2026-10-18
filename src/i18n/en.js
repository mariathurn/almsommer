// English texts. Keys are grouped by where they appear; see i18n/index.js.
// Games are named by their internal value: "Sau Spiel" (Sheep Game), "Solo",
// "Wenz" (Dog Game), "Marriage", "Ramsch" (Cowards Game).

const suits = { acorn: "Acorn", heart: "Heart", leaf: "Leaf", bell: "Bell" };
// Colour of each suit, as in the rulebook ("the blue sheep").
const colours = { acorn: "blue", heart: "red", leaf: "green", bell: "orange" };
const ranks = { "9": "Hat", K: "Staff", "10": "Grain", A: "Sheep", U: "Dog", O: "Shepherd" };
const games = {
    "Sau Spiel": "Sheep Game",
    Solo: "Solo Game",
    Wenz: "Dog Game",
    Marriage: "Marriage",
    Ramsch: "Cowards Game",
};

// "Sheep Game", "Acorn Solo"
const gameName = ({ game, suit }) => (game === "Solo" && suit ? `${suits[suit]} Solo` : games[game]);
const withA = (words) => `${/^[AEIOU]/.test(words) ? "an" : "a"} ${words}`;

export default {
    // Start menu
    "menu.play": "Play",
    "menu.achievements": "Achievements",
    "menu.settings": "Settings",
    "menu.playLabel": "Play",
    "menu.achievementsLabel": "Achievements",
    "menu.settingsLabel": "Settings",

    // Shared
    "common.done": "Done",
    "common.back": "Back",
    "common.close": "Close",
    "common.backToMenu": "‹ Menu",
    "common.menu": "Menu",
    "coins.count": "{count} coins",
    "coins.session": "{count} coins this session",

    // Settings
    "settings.heading": "Settings",
    "settings.close": "Close settings",
    "settings.music": "Music",
    "settings.musicHint": "The meadow tune in the background",
    "settings.effects": "Sound effects",
    "settings.effectsHint": "Shuffling, cards, tricks and the sheep",
    "settings.language": "Language",
    "settings.cardDeck": "Card deck",
    "settings.viewCards": "View all cards ›",
    "settings.viewCardsLabel": "View the {deck} cards",
    "deck.almsommer.description": "Hats, staffs, grain, sheep, dogs and shepherds",

    // Pause menu in the game
    "pause.heading": "Paused",
    "pause.resume": "Resume",
    "pause.leave": "Leave game",
    "pause.leaveHeading": "leave the game?",
    "pause.leaveText": "This round isn't finished. If you leave now, it won't count.",
    "pause.stay": "Stay",

    // Profile
    "profile.heading": "Your Shepherd",
    "profile.close": "Close profile",
    "profile.choosePortrait": "Choose a portrait",
    "profile.portrait": "Portrait {number}",
    "profile.name": "Name",
    "profile.nameHint": "Shown on the menu and in your game results",
    "profile.savedOverall": "Saved overall",
    "profile.bestGame": "Best game",
    "profile.gamesPlayed": "Games played",
    "profile.saved": "{amount} saved",
    "profile.badgeLabel": "Your profile: {name}, {amount} coins saved",

    // Deck screen
    "deck.title": "The Deck",
    "deck.hint": "Tap a card to look closer",
    "deck.rank": "Rank",
    "deck.points": "Points",
    "deck.closeHint": "Tap anywhere to close",

    // Achievements screen
    "achievements.title": "Achievements",
    "achievements.count": "{earned} / {total}",
    "achievements.locked": "not earned yet",
    "achievements.unlockedOn": "Earned {date}",
    "achievements.toast": "Achievement unlocked",
    "achievement.first-win.title": "Novice",
    "achievement.first-win.description": "Win your first round.",
    "achievement.first-loss.title": "Stumble",
    "achievement.first-loss.description": "Lose a round. It happens to every shepherd.",
    "achievement.first-solo.title": "Lone Shepherd",
    "achievement.first-solo.description": "Announce a Solo Game and win it.",
    "achievement.first-dog-game.title": "Top Dog",
    "achievement.first-dog-game.description": "Announce a Dog Game and win it.",
    "achievement.solo-tout.title": "Solo Tout",
    "achievement.solo-tout.description": "Win a Solo Game and take every trick.",
    "achievement.dog-tout.title": "Dog Tout",
    "achievement.dog-tout.description": "Win a Dog Game and take every trick.",
    "achievement.two-trumps.title": "Thin Ice",
    "achievement.two-trumps.description": "Win a round with no more than two trumps in your hand.",
    "achievement.first-ramsch.title": "Lucky Coward",
    "achievement.first-ramsch.description": "Come out on top in a Cowards Game.",
    "achievement.big-win.title": "Jackpot",
    "achievement.big-win.description": "Win at least 100 coins in a single round.",
    "achievement.savings-100.title": "Good Savings",
    "achievement.savings-100.description": "Save up 100 coins.",
    "achievement.savings-1000.title": "Better Savings",
    "achievement.savings-1000.description": "Save up 1,000 coins.",
    "achievement.savings-10000.title": "Coin Hoarder",
    "achievement.savings-10000.description": "Save up 10,000 coins.",
    "achievement.grandma-game.title": "Grandma Game",
    "achievement.grandma-game.description": "Win a round with six trumps in your hand.",
    "achievement.all-points.title": "Point Expert",
    "achievement.all-points.description": "Win a round with all 120 points.",

    // Cards
    "suit.name": ({ suit }) => suits[suit],
    "rank.name": ({ rank }) => ranks[rank],
    // Label at the bottom of a card face.
    "rank.cardLabel": ({ rank }) => ranks[rank].toUpperCase(),
    // "Leaf grain"
    "card.name": ({ suit, rank }) => `${suits[suit]} ${ranks[rank].toLowerCase()}`,

    // Games
    "game.name": gameName,
    // "a Sheep Game", "an Acorn Solo"
    "game.a": (params) => withA(gameName(params)),
    // "the Sheep Game"
    "game.the": ({ game }) => `the ${games[game]}`,
    "game.blurb.Sau Spiel": "Call a sheep. Whoever holds it is your secret partner.",
    "game.blurb.Solo": "Pick a trump suit. One against three.",
    "game.blurb.Wenz": "Only the dogs are trumps. You play alone.",
    "game.blurb.Marriage": "Offer your one trump and find a partner.",
    "game.unavailable.sheep": "No sheep you may call",
    "game.unavailable.marriage": "Needs exactly one trump in your hand",
    "game.unavailable.other": "Not possible with this hand",

    // Roles at the table
    "status.Caller": "Caller",
    "status.Player": "Player",
    "status.Partner": "Partner",
    "status.Opponent": "Opponent",
    "status.Unknown": "Unknown",
    "status.Friend": "Friend",

    // Banner at the top of the table
    "banner.declare": "Declare your game",
    "banner.callsSheep": ({ name, suit }) => `${name} calls the ${colours[suit]} sheep`,
    "banner.plays": ({ name, game, suit }) => `${name} plays ${withA(gameName({ game, suit }))}`,
    "banner.cowards": "Cowards Game: nobody announced",
    "banner.marries": "{name} marries {partner}",
    "banner.takesTrick": "{name} takes the trick",
    "banner.dealToBegin": "Deal the cards to begin",
    "banner.choose": "Choose what you want to play",
    "banner.yourTurn": "Your turn",
    "banner.thinking": "{name} is thinking…",

    // Announcing
    "bid.whoPlays": "Who will play?",
    "bid.wants": ({ name, game, suit }) => `${name} wants ${withA(gameName({ game, suit }))}`,
    "bid.announces": ({ name, game, suit }) => `${name} announces ${withA(gameName({ game, suit }))}`,
    "bid.passes": "{name} passes",
    "bid.nobodyMarried": "nobody married {name}",
    "bid.yourSay": "your say",
    "bid.deciding": "{name} is deciding…",

    // Marriage
    "marriage.oneTrump": "You hold just one trump",
    "marriage.offers": "{name} offers a marriage",
    "marriage.yourAnswer": "your answer",
    "marriage.swapped": "Swapped: {from} → {to}",
    "marriage.offeredBefore": "Offered before announcing, with just one trump",
    "marriage.offerHeading": "A marriage?",
    "marriage.offerText":
        "You hold just one trump. Offer it face down and find a partner? Whoever accepts takes it and gives you a card.",
    "marriage.no": "No",
    "marriage.offer": "Offer marriage",
    "marriage.askHeading": "Marriage!",
    "marriage.askText":
        "{name} holds just one trump and offers it to you. Accept, take the trump and give back your weakest card, and play together?",
    "marriage.decline": "Decline",
    "marriage.accept": "Accept",

    // Round result
    "result.wins": ({ names, plural, game }) => `${names} ${plural ? "win" : "wins"} the ${games[game]}`,
    "result.loses": ({ names, plural, game }) => `${names} ${plural ? "lose" : "loses"} the ${games[game]}`,
    "result.pointsTaken": "{points} points taken",
    "result.score": "{ours} : {theirs} points",
    "result.round": "round",
    "result.session": "session",

    // Game picker
    "picker.heading": "What will you play?",
    "picker.subheading": "Choose a game for this round, or pass.",
    "picker.soloRow": "Solo · choose your trump suit",
    "picker.sheepRow": "Sheep Game · call a sheep",
    "picker.pass": "Pass",
    "picker.chooseGame": "Choose a game",
    "picker.chooseSheep": "Choose a sheep",
    "picker.callSheep": ({ suit }) => `Call the ${suits[suit]} sheep`,
    "picker.play": ({ game }) => `Play ${game === "Solo" ? "Solo" : games[game]}`,
    "picker.tileLabel": "{game}, {coins} coins",

    // Table
    "table.deal": "deal",
    "table.dealLabel": "Deal",
    "table.chooseGame": "choose\ngame",
    "table.chooseGameLabel": "Choose game",
    "table.collectTrick": "Collect the trick",
    "hand.mustFollow": "Must follow suit",
};
