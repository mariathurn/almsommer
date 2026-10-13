// Shared colours and table geometry for the native UI.

export const colors = {
    page: "#10244d",
    table: "#252d45",
    gold: "#fbbf24",
    goldSoft: "rgba(251, 191, 36, 0.8)",
    goldText: "#fcd34d",
    text: "rgba(255, 255, 255, 0.92)",
    textMuted: "rgba(255, 255, 255, 0.8)",
    pill: "rgba(18, 39, 55, 0.75)",
    badge: "rgba(21, 64, 43, 0.8)",
    badgeBorder: "rgba(74, 222, 128, 0.9)",
    badgeText: "#d1fae5",
    button: "#d6ebf8",
    menu: "rgba(15, 23, 42, 0.96)",
};

// Width / height of a card, from the illustrated design (500 x 784).
// The classic SVG art (349 x 610) is letterboxed into the same box.
export const CARD_RATIO = 500 / 784;

const EDGE = 8;
const LABEL_HEIGHT = 24;

// Width of a fan of `count` cards for a given card height and overlap.
export function fanWidth(count, cardHeight, spacingFactor) {
    const cardWidth = cardHeight * CARD_RATIO;
    return cardWidth + Math.max(count - 1, 0) * cardWidth * spacingFactor;
}

// Derives card sizes and seat positions from the table's measured size,
// so the same layout works on phones, tablets and the web.
export function getTableLayout(width, height) {
    const southCardHeight = Math.min(height * 0.34, 260);
    const opponentCardHeight = Math.min(height * 0.17, 120);

    // Fanned cards tilt and drop at the ends, so leave room for the arc.
    const southFanTop = height - EDGE - southCardHeight * 1.1;
    const sideInset = EDGE + opponentCardHeight * 0.15;

    const northBottom = EDGE + opponentCardHeight;
    const southTop = southFanTop - LABEL_HEIGHT;
    const gap = southTop - northBottom;
    const boardSize = Math.max(Math.min(gap - 8, width * 0.3, 320), 100);

    return {
        width,
        height,
        edge: EDGE,
        labelHeight: LABEL_HEIGHT,
        southCardHeight,
        southFanTop,
        sideInset,
        opponentCardHeight,
        board: {
            size: boardSize,
            centerX: width / 2,
            centerY: northBottom + gap / 2,
        },
    };
}
