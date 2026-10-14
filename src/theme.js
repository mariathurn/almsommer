// "Almsommer" look: warm linen paper, muted alpine suit colours, a
// bright yellow accent, ink for lines and text. Shared table geometry too.

export const colors = {
    // Paper, ink and gold come straight from the cards.
    paper: "#f7f3e9",
    paperDeep: "#ece5d5",
    keyline: "#d9cfba",
    ink: "#141210",
    inkSoft: "#5f574c",
    hay: "#eec652",
    hayLight: "#f8e7b0",
    hayDeep: "#c9a43a",
    apricot: "#e09a62",
    alpenrose: "#c25a63",
    enzian: "#3f6ea6",
    weide: "#7a9c5e",
    sky: "#cfe0e6",
    meadow: "#a9c08a",
    blanket: "#c25a63",
    shadow: "rgba(47, 42, 36, 0.28)",
    scrim: "rgba(47, 42, 36, 0.45)",
};

// Colour name (as in the rulebook) and interface colour for each suit.
export const suitTheme = {
    bell: { name: "Orange", color: colors.apricot },
    heart: { name: "Red", color: colors.alpenrose },
    acorn: { name: "Blue", color: colors.enzian },
    leaf: { name: "Green", color: colors.weide },
};

// Loaded in App.jsx. Three fonts: Caveat Brush for big moments, Alfa Slab One
// for all numbers, Alegreya Sans for everything else.
export const fonts = {
    title: "AlegreyaSans_800ExtraBold",
    titleBlack: "CaveatBrush_400Regular",
    number: "AlfaSlabOne_400Regular",
    body: "AlegreyaSans_400Regular",
    bodyMedium: "AlegreyaSans_500Medium",
    bodyBold: "AlegreyaSans_700Bold",
    hand: "CaveatBrush_400Regular",
};

// Soft drop shadow for paper on the table (iOS/web use shadow*, Android elevation).
export const softShadow = {
    shadowColor: "#2f2a24",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
};

// Linen card stock with a thin keyline: menus, tags, buttons and panels.
export const paper = {
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.keyline,
    borderRadius: 14,
    ...softShadow,
};

// Width / height of a card, from the illustrated design (500 x 784).
// The classic SVG art (349 x 610) is letterboxed into the same box.
export const CARD_RATIO = 500 / 784;

const EDGE = 10;
const LABEL_HEIGHT = 30;
const TAG_HEIGHT = 30;
// Profiles and name tags are this much larger in the web (landscape) view.
export const PROFILE_SCALE = 1.4;
// Size of an opponent's profile there (portrait ring and name tag).
const PROFILE_RING = 70 * PROFILE_SCALE + 10;
const PROFILE_WIDTH = 150;
// Share of your cards' height that shows above the bottom edge at rest.
export const HAND_VISIBLE = 0.8;

// Width of a fan of `count` cards for a given card height and overlap.
export function fanWidth(count, cardHeight, spacingFactor) {
    const cardWidth = cardHeight * CARD_RATIO;
    return cardWidth + Math.max(count - 1, 0) * cardWidth * spacingFactor;
}

// Derives card sizes and seat positions from the table's measured size,
// so the same layout works on phones, tablets and the web.
export function getTableLayout(width, height) {
    if (height > width) return getPortraitTableLayout(width, height);

    // Phones in landscape: smaller seats, north's tag beside its medallion and
    // your tag beside your hand. On every screen your hand dips below the
    // bottom edge (hovering lifts a card a little), leaving more room
    // for the blanket.
    const compact = height < 460;
    const southCardHeight = Math.min(height * (compact ? 0.36 : 0.38), 280);

    const southFanTop = height - southCardHeight * HAND_VISIBLE;
    // The player at the top has the name tag beside the portrait, so only the
    // portrait ring's height counts.
    const northBottom = EDGE + PROFILE_RING;
    const southTop = southFanTop - 12;
    const gap = southTop - northBottom;

    // The trick is played onto a picnic blanket between the side seats.
    const sideSeatWidth = PROFILE_WIDTH;
    // The trick is played on the painted table circle (as on phones).
    const discSize = Math.max(Math.min((gap - 8) * 0.82, width - 2 * (EDGE + sideSeatWidth)), 140);

    return {
        width,
        height,
        compact,
        edge: EDGE,
        labelHeight: LABEL_HEIGHT,
        tagHeight: TAG_HEIGHT,
        southCardHeight,
        southFanTop,
        blanket: {
            round: true,
            width: discSize,
            height: discSize,
            centerX: width / 2,
            centerY: northBottom + gap / 2,
        },
    };
}

// Phones in portrait: the opponents' name tags in a row along the top, a round
// paper disc in the middle where the trick is played, and a large hand at the
// bottom running off the edge, with your name tag at the very bottom.
// Room for the opponents' profiles (portrait, name tag, stagger) at the top.
const PORTRAIT_TAG_ROW = 160;
// Height the compact game panel needs above the hand, measured from the top of the table.
const PORTRAIT_PANEL_ROOM = 540;

function getPortraitTableLayout(width, height) {
    // On short phones the hand gets smaller, so the game panel (which reaches
    // up to the top of the screen) still fits above it with the Solo row open.
    const southCardHeight = Math.min(height * 0.36, 300, (height - PORTRAIT_PANEL_ROOM) / 0.84);
    const southFanTop = height - southCardHeight * 0.84;
    const opponentsBottom = EDGE + PORTRAIT_TAG_ROW;
    const gap = southFanTop - opponentsBottom;
    // The trick's cards fan out about 0.63 disc sizes above its centre, which
    // limits how large the disc can be.
    const discSize = Math.max(Math.min(width * 0.6, (gap - 24) / 1.13), 150);
    // The disc itself sits in the middle between the opponents and your hand.
    const discCenterY = opponentsBottom + gap / 2;

    return {
        width,
        height,
        compact: false,
        portrait: true,
        edge: EDGE,
        labelHeight: LABEL_HEIGHT,
        tagHeight: TAG_HEIGHT,
        southCardHeight,
        southFanTop,
        blanket: {
            round: true,
            width: discSize,
            height: discSize,
            centerX: width / 2,
            centerY: discCenterY,
        },
    };
}
