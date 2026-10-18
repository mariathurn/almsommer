// Opponent portraits: head-and-shoulders crops of the card figures (dog,
// sheep, shepherd) in every suit colour, on the suit's panel colour.
//
// For each figure: the image file in src/assets/card-art, the point (in that
// image's pixels) that becomes the centre of the circle, and how many image
// pixels the circle's diameter spans (smaller = closer in).

import { rankDesign } from "./cardDesign";

const colourOfSuit = { heart: "red", leaf: "green", acorn: "blue", bell: "orange" };

const crops = {
    dog: {
        rank: "U",
        // Each dog is a different breed, so each has its own crop.
        heart: { centerX: 175, centerY: 135, span: 330 },
        leaf: { centerX: 155, centerY: 165, span: 320 },
        acorn: { centerX: 135, centerY: 155, span: 300 },
        bell: { centerX: 185, centerY: 165, span: 340 },
    },
    sheep: { rank: "A", default: { centerX: 295, centerY: 144, span: 465 } },
    shepherd: {
        rank: "O",
        // Each shepherd is a different person, so each has its own crop.
        heart: { centerX: 169, centerY: 167, span: 428 },
        leaf: { centerX: 231, centerY: 133, span: 341 },
        acorn: { centerX: 205, centerY: 158, span: 427 },
        bell: { centerX: 146, centerY: 139, span: 382 },
    },
};

const fileStem = { dog: "dog", sheep: "sheep", shepherd: "shepard" };

export const portraits = Object.entries(crops).flatMap(([figure, crop]) =>
    Object.keys(colourOfSuit).map((suit) => ({
        id: `${figure}-${suit}`,
        suit,
        source: rankDesign[crop.rank].art[suit],
        file: `${fileStem[figure]}-${colourOfSuit[suit]}.png`,
        ...(crop[suit] ?? crop.default),
    }))
);

// Three different portraits for the opponents, picked at random each time
// the app starts.
function pickThree() {
    const pool = [...portraits];
    const picked = [];
    while (picked.length < 3) picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return picked;
}

const [west, north, east] = pickThree();
export const opponentPortraits = { west, north, east };
