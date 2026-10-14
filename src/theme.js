// "Almsommer" look: warm linen paper, muted alpine suit colours, a
// bright yellow accent, ink for lines and text. Shared table geometry too.

export const colors = {
    paper: "#f6efe1",
    paperDeep: "#ebe0c9",
    keyline: "#d6c6a5",
    ink: "#2f2a24",
    inkSoft: "#6b6152",
    hay: "#ffe300",
    hayLight: "#fff3a3",
    hayDeep: "#cdb200",
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

// Loaded in App.jsx. Fraunces for titles and numbers, Alegreya Sans for the interface.
export const fonts = {
    title: "Fraunces_700Bold",
    titleBlack: "Fraunces_900Black",
    number: "Fraunces_600SemiBold",
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
    const medallionSize = compact ? 40 : Math.max(Math.min(height * 0.17, 84), 46);

    const southFanTop = height - southCardHeight * HAND_VISIBLE;
    const northBottom = EDGE + medallionSize * 1.18 + (compact ? 0 : TAG_HEIGHT);
    const southTop = southFanTop - (compact ? 12 : LABEL_HEIGHT);
    const gap = southTop - northBottom;

    // The trick is played onto a picnic blanket between the side seats.
    const sideSeatWidth = medallionSize + 90;
    const blanketHeight = Math.max(gap - 8, 90);
    const blanketWidth = Math.max(Math.min(width - 2 * (EDGE + sideSeatWidth), blanketHeight * 1.8, 760), 140);

    return {
        width,
        height,
        compact,
        edge: EDGE,
        labelHeight: LABEL_HEIGHT,
        tagHeight: TAG_HEIGHT,
        southCardHeight,
        southFanTop,
        medallionSize,
        blanket: {
            width: blanketWidth,
            height: blanketHeight,
            centerX: width / 2,
            centerY: northBottom + gap / 2,
        },
    };
}

// Phones in portrait: the opponents' name tags in a row along the top, a round
// paper disc in the middle where the trick is played, and a large hand at the
// bottom running off the edge, with your name tag at the very bottom.
const PORTRAIT_TAG_ROW = 64;

function getPortraitTableLayout(width, height) {
    const southCardHeight = Math.min(height * 0.36, 300);
    const southFanTop = height - southCardHeight * 0.84;
    const opponentsBottom = EDGE + PORTRAIT_TAG_ROW;
    const gap = southFanTop - opponentsBottom;
    // The trick (cards fanning out above the disc, plus the disc) spans about
    // 0.63 disc sizes above the disc centre and 0.5 below. It sits a little
    // above the middle of the gap.
    const discSize = Math.max(Math.min(width * 0.7, (gap - 24) / 1.13), 160);
    const discCenterY = opponentsBottom + (gap - 1.13 * discSize) * 0.3 + 0.63 * discSize;

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
        medallionSize: 0,
        blanket: {
            round: true,
            width: discSize,
            height: discSize,
            centerX: width / 2,
            centerY: discCenterY,
        },
    };
}
