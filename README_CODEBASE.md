# Schafkopf Card Game - Codebase Overview

A React/Vite implementation of Schafkopf, a traditional Bavarian card game. One human player (South) plays against three AI opponents in real-time.

## Quick Start

```bash
npm install
npm run dev      # Development server at http://localhost:5173
npm run build    # Production build
```

## Architecture Overview

```
src/
├── App.jsx                      # Main app component, orchestrates game UI
├── main.jsx                     # Entry point
├── App.css                      # (deprecated)
│
├── components/                  # Reusable UI components
│   ├── Card.jsx                # Single card renderer (uses cardArt.js for images)
│   ├── FanOfCards.jsx          # Hand layout with rotation, card validation via canPlayCard()
│   ├── GameHeader.jsx          # Title, turn display, deal button
│   ├── PlayerPanel.jsx         # Wrapper for player name + hand
│   ├── PlayerName.jsx          # Player seat label
│   └── TableCenter.jsx         # Central trick display (shows played cards)
│
├── hooks/                       # Game state management
│   └── useSchafkopfGame.js     # Core game logic (dealing, turns, trick resolution, AI automation)
│
├── ai/                          # AI decision-making
│   └── schafkopfAI.js          # canPlayCard(), getAIMove() - suit following + basic strategy
│
├── assets/
│   ├── cardArt.js              # Imports all 24 SVG card images, exported as cardArt map
│   ├── CardDeck.js             # Initial deck array with all 24 cards
│   └── cards/                  # SVG card images
│       ├── acorn/              # Acorn suit (9, K, 10, A, U, O)
│       ├── leaf/               # Leaf suit (9, K, 10, A, U, O)
│       ├── heart/              # Heart suit (9, K, 10, A, U, O)
│       ├── bell/               # Bell suit (9, K, 10, A, U, O)
│       └── back.svg            # Card back design
│
├── data/
│   └── cardMeta.js             # Card metadata (suit, rank, value) for all 24 cards
│
├── styles/
│   └── table.css               # All custom styling (board, cards, layout, responsive)
│
├── index.html                  # HTML template
└── vite.config.js              # Vite configuration
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
- Shows "Must follow suit" tooltip on hover
- Uses `canPlayCard()` to mark playable cards

**`Card.jsx`** - Individual card
- Renders SVG image from `cardArt` map
- Supports face-up and face-down display
- Used in both hands and center trick area

### 4. **Card Assets** (`src/assets/`)
- **`cardArt.js`** - Imports all 24 SVG files using Vite's `?url` query parameter
  - Exports `cardArt` object: `{ "suit-rank": url, ... }`
  - Maps stored as `"acorn-9"`, `"leaf-K"`, etc.
- **`cards/` directory** - SVG files organized by suit
  - Each file: `<suit>/<rank>.svg` (e.g., `acorn/9.svg`)
  - Hand-drawn Bavarian card design
  - Back design included

### 5. **Styling** (`src/styles/table.css`)
- **Board layout:**
  - `.table-shell` - main container, teal background, responsive sizing
  - `.table-center` - central trick area (circle, centered)
  - `.player-slot.{north,east,south,west}` - player seat positions with rotation
- **Card styling:**
  - `.hand-card` - individual card button (90×130px)
  - `.hand-card:disabled` - reduced opacity for illegal moves
  - `.hand-card:hover:not(:disabled)` - lifts on hover
  - `.trick-card` - played cards in center (same size as hand cards)
- **Responsiveness:**
  - `@media (max-width: 820px)` - adjust player slot widths
  - `@media (max-width: 560px)` - stack layout for mobile

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
- **Card images not showing (fixed)** - Vite was converting SVGs to base64. Solution: import with `?url` query parameter.
- **Player position bug (fixed)** - East/West swapped on small screens. Fixed media query.

## Running Tests

```bash
npm run build  # Verify production build succeeds
```

No unit tests yet. Tested manually during development.

## Technologies

- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility classes (minimal usage)
- **Custom CSS** - Game board styling
- **SVG** - Card graphics (hand-drawn)
