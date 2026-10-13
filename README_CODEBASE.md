# Schafkopf Card Game - Codebase Overview

An Expo (React Native) implementation of Schafkopf, running on iOS, Android and the web,, a traditional Bavarian card game. One human player (South) plays against three AI opponents in real-time.

## Quick Start

```bash
npm install
npm start                          # Expo dev server (i = iOS, a = Android, w = web)
npm test                           # Unit tests (node:test)
npx expo export --platform web     # Static web build in dist/
```

## Architecture Overview

```
index.js                         # Expo entry point, registers src/App
app.json                         # Expo config (name, icons, landscape orientation)
metro.config.js                  # Adds .svg to the bundled asset types
src/
├── App.jsx                      # Loads fonts, switches between the menu, game and deck screens
├── screens/
│   ├── MenuScreen.jsx          # Start screen: Play / Card Deck
│   ├── GameScreen.jsx          # The card table, wires game state to the UI
│   └── DeckScreen.jsx          # Overview of all 24 cards, tap one to enlarge it
├── theme.js                     # Colours and table layout maths (card sizes, seat positions)
│
├── components/                  # React Native UI components
│   ├── MeadowBackground.jsx    # Watercolour Alm meadow (SVG + paper texture) behind every screen
│   ├── PaperButton.jsx         # Linen-paper button
│   ├── GamePicker.jsx          # Festival-banner game tiles with coins (rulebook games), then the sheep to call
│   ├── Card.jsx                # Single card renderer (expo-image + cardArt.js)
│   ├── FanOfCards.jsx          # Fanned hand; face-up hands are tappable, illegal cards dimmed
│   ├── GameHeader.jsx          # Menu and the ribbon banner ("Maria calls the orange sheep")
│   ├── PlayerPanel.jsx         # One seat: your fanned hand, or an opponent's portrait medallion
│   ├── PlayerName.jsx          # Player seat label
│   └── TableCenter.jsx         # Picnic blanket: trick cards, round Deal / Choose game buttons, result
│
├── hooks/                       # Game state management
│   └── useSchafkopfGame.js     # Core game logic (dealing, turns, trick resolution, AI automation)
│
├── ai/                          # AI decision-making
│   ├── schafkopfAI.js          # canPlayCard(), getAIMove(), Sau Spiel teams
│   └── schafkopfAI.test.js     # Rule tests
│
├── assets/
│   ├── cardArt.js              # require()s all 24 SVG card images, exported as cardArt map
│   ├── CardDeck.js             # Initial deck array with all 24 cards
│   └── cards/                  # SVG card images
│
└── data/
    ├── cardMeta.js             # Card metadata (suit, rank, value) for all 24 cards
    ├── cardDesign.js           # Card face design data (see below)
    └── gameTypes.js            # Rulebook games: Sheep 5, Solo 20, Dog 20, Marriage 20, Cowards 5 coins
```

## Key Functionality by Feature

### 1. **Game State & Logic** (`src/hooks/useSchafkopfGame.js`)
- **State variables:**
  - `players` - cards in each player's hand (north, east, south, west)
  - `currentTurn` - whose turn it is
  - `playedCards` - cards played in current trick
  - `trickWinner` - player who won the last trick
- **Key functions:**
  - `dealHands()` - shuffle deck, deal 5 cards to each player clockwise starting from north
  - `playCard(playerName, cardIndex)` - plays a card, validates suit following, advances turn
  - `getTrickWinner()` - compares played cards by rank, determines highest
  - Auto-triggers AI moves when it's not the human player's turn

### 2. **Game Rules & AI** (`src/ai/schafkopfAI.js`)
- **`canPlayCard(card, hand, playedCards)`** - validates suit following:
  - If suit was led, you must play that suit if you have it
  - Otherwise, any card is legal
- **`getAIMove(hand, playedCards)`** - AI strategy:
  - If leading: play lowest card
  - If must follow suit: play lowest of that suit
  - If can't follow: play lowest overall

### 3. **UI Components**

**`App.jsx`** - Root component
- Wires game state to UI
- Renders board, 4 player seats, center trick area
- Passes `playedCards` to all players so they can validate moves

**`GameHeader.jsx`** - Display area
- Shows current turn
- Shows trick winner (last 600ms)
- Deal button to start/restart game

**`TableCenter.jsx`** - Central board
- Displays cards currently played in the trick
- Cards cascade with rotation for visual effect
- Clears when trick ends

**`PlayerPanel.jsx`** - One player's area
- Contains player name + hand
- Passes props through to FanOfCards

**`FanOfCards.jsx`** - Hand display
- Renders cards in a fan layout
- Disables illegal cards (opacity 0.4)
- Dims cards that would break suit-following when it is your turn
- Uses `canPlayCard()` to mark playable cards

**`Card.jsx`** - Individual card
- Renders SVG image from `cardArt` map
- Supports face-up and face-down display
- Used in both hands and center trick area

### 4. **Card Assets** (`src/assets/`)
- **`cardArt.js`** - `require()`s all 24 SVG files plus the card back
  - Exports `cardArt` object: `{ "suit-rank": asset, ... }`
  - `metro.config.js` registers `.svg` as an asset type; `expo-image` renders the SVGs natively and on the web
- **`cards/` directory** - SVG files organized by suit (`<suit>/<rank>.svg`) plus `back.svg`

### 4b. **Illustrated card design**
- `src/data/cardDesign.js` - suit colours and names, artwork per rank (`rankDesign`), card numbers (hat 1, staff 2, grain 3, sheep 4, dogs 5-8, shepherds 9-12, ordered bell < heart < leaf < acorn) and points
- `src/components/IllustratedCard.jsx` - draws the card with react-native-svg in a 500 x 784 box; numbers use Alfa Slab One, name tags Barlow Condensed Bold (both loaded in `App.jsx`)
- `src/assets/Illus/` - original artwork (`<motif>-<colour>.png`, colours orange = bell, red = heart, green = leaf, blue = acorn) and the `bg.png` texture
- `src/assets/card-art/` and `Illus/bg-card.png` - generated by `npm run card-art` (`scripts/prepare-card-art.js`): artwork downscaled to 720 px, and a luminance-only texture (translucent black/white) that darkens or lightens the suit colour without greying it. Re-run after changing anything in `Illus/`
- A card without artwork in `rankDesign` falls back to the classic SVG art
- `src/hooks/usePreloadedCardArt.js` loads and decodes all card artwork at startup (before the menu shows), so cards never appear without their illustration

### 5. **Look & Layout**
- "Almsommer": warm linen paper with thin keylines and soft shadows on a watercolour meadow, with a bright yellow accent (`#ffe300`). Palette, suit colour names (orange, red, blue, green), fonts and the shared `paper` style live in `src/theme.js`
- Interface type: Fraunces for titles and numbers, Alegreya Sans for text (card faces keep Alfa Slab One and Barlow Condensed)
- Round flow as in the rulebook: a round Deal button in the middle of the blanket (only when nobody holds cards), then the game picker. It sits above your hand and darkens only the table behind it, offers only the games your hand allows (`getAvailableGames`) plus Pass; passing plays the Cowards Game. Cards can be played once a game is declared
- A finished trick stays on the blanket until you tap anywhere; opponents take 0.9 s per card
- Your hand shows 70% of its height (`HAND_VISIBLE` in `theme.js`) and dips below the bottom edge, so the blanket gets more room; hovering lifts a card a little with a slow ease (`HOVER_RISE`, `RISE_DURATION` in `FanOfCards.jsx`)
- On your turn, playable cards lift and the rest fade, so following suit needs no pop-up
- Trumps per game (`getTrumpStrength` in `schafkopfAI.js`): Dog Game only dogs; all other games shepherds, dogs, then red (Solo has no colour choice yet). Shepherds and dogs rank blue > green > red > orange. Hovering a game in the picker sorts your hand with trumps strongest-first on the left (`sortHandForGame`) and gives trump cards a yellow corner with a crown; both stay once the game is chosen
- Sheep Game: only a regular sheep (not red) you don't hold, and only with a regular card of that colour (`canCallAce`). The other games can be chosen but still play with Sheep Game trumps; winning by 61 points is not implemented yet
- `getTableLayout()` derives card, medallion and blanket sizes from the measured table; below 460 px height it switches to a compact phone layout
- The app is locked to landscape (`app.json`)

### 6. **Data** (`src/data/`)
- **`cardMeta.js`** - Metadata for all 24 cards
  - Fields: `id`, `suit`, `rank`, `value`
  - Suits: acorn, leaf, heart, bell
  - Ranks: 9, K, 10, A, U (Unter/Jack), O (Ober/Queen)
  - Values: 1-6 (used to rank cards in tricks)

## Game Flow

1. **Deal** - User clicks "Deal" button
   - `dealHands()` shuffles deck, distributes 5 cards per player
   - Turn starts at "north"

2. **Play** - Players take turns playing one card
   - AI (`useSchafkopfGame` effect) auto-plays after 600ms delay
   - Human player (`south`) clicks cards to play
   - Suit following validated before move is accepted

3. **Trick Resolution** - After 4 cards played
   - `getTrickWinner()` finds highest card
   - Winner becomes next player to lead
   - Center display shows cards for 600ms, then clears
   - Next trick begins

4. **Round End** - After 5 tricks (all cards dealt)
   - Game pauses, waiting for "Deal" button to start next round

## State Flow Diagram

```
App.jsx (orchestrator)
    ↓
useSchafkopfGame (state + logic)
    ├─ players, currentTurn, playedCards, trickWinner
    ├─ dealHands()
    ├─ playCard()
    └─ AI effect loop (checks currentTurn, triggers AI move)
         ↓
    GameHeader, TableCenter, PlayerPanel × 4
         ↓
    FanOfCards (validates via canPlayCard)
         ↓
    Card (renders SVG from cardArt)
```

## Known Limitations & Future Work

- **No trump system** - All suits are equal (basic trick-taking only)
- **No scoring** - Tricks are won/lost but not counted
- **Simple AI** - Just plays lowest legal card (no strategy depth)
- **No animation** - Cards appear/disappear instantly
- **Single player only** - Human is always South

## Key Bugs & Fixes

- **Stale closure bug (fixed)** - AI timeout was capturing old state. Solution: use `gameStateRef` to get current state at timeout fire time.
- **Player position bug (fixed)** - East/West swapped on small screens. Fixed media query.

## Running Tests

```bash
npm test
```

Covers the Sau Spiel rules in `src/ai/schafkopfAI.js`.

## Technologies

- **Expo SDK 57 / React Native 0.86** - iOS, Android and web (via react-native-web)
- **React 19**
- **expo-image** - classic SVG card rendering
- **react-native-svg** - illustrated card design
- **expo-font** with Alfa Slab One (card numbers) and Barlow Condensed Bold (name tags)
- **react-native-safe-area-context** - keeps the table clear of notches
