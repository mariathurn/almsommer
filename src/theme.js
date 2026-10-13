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

// Width of a fan of `count` cards for a given card height and overlap.
export function fanWidth(count, cardHeight, spacingFactor) {
    const cardWidth = cardHeight * CARD_RATIO;
    return cardWidth + Math.max(count - 1, 0) * cardWidth * spacingFactor;
}

// Derives card sizes and seat positions from the table's measured size,
// so the same layout works on phones, tablets and the web.
export function getTableLayout(width, height) {
    // Phones in landscape: smaller seats, north's tag beside its medallion,
    // your tag beside your hand, and the hand dipping below the screen edge.
    const compact = height < 460;
    const southCardHeight = Math.min(height * (compact ? 0.36 : 0.38), 280);
    const medallionSize = compact ? 40 : Math.max(Math.min(height * 0.17, 84), 46);

    // Fanned cards tilt and drop at the ends, so leave room for the arc.
    const southFanTop = compact ? height - southCardHeight * 0.9 : height - EDGE - southCardHeight * 1.1;
    const northBottom = EDGE + medallionSize * 1.18 + (compact ? 0 : TAG_HEIGHT);
    const southTop = southFanTop - (compact ? 12 : LABEL_HEIGHT);
    const gap = southTop - northBottom;

    // The trick is played onto a picnic blanket between the side seats.
    const sideSeatWidth = medallionSize + 90;
    const blanketHeight = Math.max(gap - 12, 90);
    const blanketWidth = Math.max(Math.min(width - 2 * (EDGE + sideSeatWidth), blanketHeight * 1.7, 560), 140);

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
