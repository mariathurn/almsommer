/* The illustrated card design: coloured frame with a dot pattern, a textured
centre panel with the artwork, the card number (top left and mirrored bottom
right), the card's points (top right) and its name (bottom left).
Drawn in a 500 x 784 coordinate space that scales to any size. */

import Svg, { Circle, ClipPath, Defs, G, Image, Line, Path, Pattern, Rect, Text } from "react-native-svg";
import { artSizes, cardPoints, cardTexture, getCardNumber, ink, labelFont, numberFont, rankDesign, suitColors } from "../data/cardDesign";

const panel = { x: 37, y: 132, width: 428, height: 545, rx: 20 };
// Artwork is fitted inside this box, so wide motifs (hat) and tall ones (dog) both fill it.
const artBox = { x: 57, y: 156, width: 388, height: 497 };
const PANEL_STROKE = 7;
// Approximate width of an uppercase Barlow Condensed Bold letter at 36px, plus tracking.
const LABEL_CHAR_WIDTH = 18;
const LABEL_TRACKING = 2.5;
// Area a standing figure may cover: inside the panel's side and bottom
// borders, but open at the top so the hat can overlap the top border.
const figureClip = {
    x: panel.x + PANEL_STROKE / 2,
    y: 0,
    width: panel.width - PANEL_STROKE,
    height: panel.y + panel.height - PANEL_STROKE / 2,
};

// Scales a figure so its feet touch the inside of the bottom border and the
// middle of its hat sits on the top border line.
function getFigurePlacement({ file, hatMiddle, offsetX = 0 }) {
    const size = artSizes[file];
    const feetY = figureClip.height;
    const height = (feetY - panel.y) / (1 - hatMiddle);
    const width = height * (size.width / size.height);
    return { x: panel.x + panel.width / 2 - width / 2 + offsetX, y: feetY - height, width, height };
}

// Small suit symbols drawn in a 40 x 40 box.
function SuitIcon({ suit, x, y, size }) {
    const color = suitColors[suit].accent;
    const stroke = { stroke: ink, strokeWidth: 3, strokeLinejoin: "round" };

    return (
        <G transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 40})`}>
            {suit === "bell" ? (
                <>
                    <Rect x={16} y={3} width={8} height={7} rx={2} fill={color} {...stroke} />
                    <Circle cx={20} cy={23} r={14} fill={color} {...stroke} />
                    <Line x1={6} y1={22} x2={34} y2={22} stroke={ink} strokeWidth={3} />
                    <Circle cx={20} cy={30} r={3} fill={ink} />
                </>
            ) : null}
            {suit === "heart" ? (
                <Path
                    d="M20 35 C6 25 3 15 10 9 C14 6 19 8 20 13 C21 8 26 6 30 9 C37 15 34 25 20 35 Z"
                    fill={color}
                    {...stroke}
                />
            ) : null}
            {suit === "leaf" ? (
                <>
                    <Path d="M20 3 C33 11 35 26 20 34 C5 26 7 11 20 3 Z" fill={color} {...stroke} />
                    <Line x1={20} y1={9} x2={20} y2={39} stroke={ink} strokeWidth={3} strokeLinecap="round" />
                </>
            ) : null}
            {suit === "acorn" ? (
                <>
                    <Path d="M11 19 L29 19 C29 30 24 36 20 38 C16 36 11 30 11 19 Z" fill={color} {...stroke} />
                    <Path d="M7 19 C7 10 33 10 33 19 Z" fill={ink} {...stroke} />
                    <Line x1={20} y1={4} x2={20} y2={11} stroke={ink} strokeWidth={3} strokeLinecap="round" />
                </>
            ) : null}
        </G>
    );
}

// Trump cards get yellow corner boxes and a crown above the rank.
const TRUMP_FILL = "#eec652";

function IllustratedCard({ card, width, height, isTrump = false }) {
    const colors = suitColors[card.suit];
    const design = rankDesign[card.rank];
    const figure = design.figure?.[card.suit];
    const number = String(getCardNumber(card));
    const points = String(cardPoints[card.rank]);
    const isTwoDigit = number.length > 1;
    const labelWidth = design.label.length * (LABEL_CHAR_WIDTH + LABEL_TRACKING) + 44;
    const dotsId = `card-dots-${card.suit}`;

    return (
        <Svg width={width} height={height} viewBox="0 0 500 784">
            <Defs>
                <Pattern id={dotsId} width={16} height={16} patternUnits="userSpaceOnUse">
                    <Circle cx={8} cy={8} r={2.2} fill={colors.dots} />
                </Pattern>
                <ClipPath id="card-panel-clip">
                    <Rect {...panel} />
                </ClipPath>
                <ClipPath id="card-figure-clip">
                    <Rect {...figureClip} />
                </ClipPath>
            </Defs>

            {/* Frame with dot pattern */}
            <Rect x={4} y={4} width={492} height={776} rx={34} fill={colors.frame} />
            <Rect x={4} y={4} width={492} height={776} rx={34} fill={`url(#${dotsId})`} />
            <Rect x={4} y={4} width={492} height={776} rx={34} fill="none" stroke={ink} strokeWidth={8} />

            {/* Centre panel: colour, texture at 50%, artwork */}
            <Rect {...panel} fill={colors.panel} />
            <G clipPath="url(#card-panel-clip)">
                <Image
                    href={cardTexture}
                    x={panel.x}
                    y={panel.y}
                    width={panel.width}
                    height={panel.height}
                    preserveAspectRatio="xMidYMid slice"
                    opacity={0.5}
                />
            </G>
            {figure ? null : (
                <Image
                    href={design.art[card.suit]}
                    x={artBox.x}
                    y={artBox.y}
                    width={artBox.width}
                    height={artBox.height}
                    preserveAspectRatio="xMidYMid meet"
                />
            )}
            <Rect {...panel} fill="none" stroke={ink} strokeWidth={PANEL_STROKE} />
            {figure ? (
                <G clipPath="url(#card-figure-clip)">
                    <Image href={design.art[card.suit]} {...getFigurePlacement(figure)} preserveAspectRatio="none" />
                </G>
            ) : null}

            {/* Number and suit, top left (crowned and yellow for trumps) */}
            <Rect
                x={24}
                y={17}
                width={108}
                height={142}
                rx={20}
                fill={isTrump ? TRUMP_FILL : "white"}
                stroke={ink}
                strokeWidth={7}
            />
            {isTrump ? (
                <Path d="M60 50 L58 31 L69 40 L78 27 L87 40 L98 31 L96 50 Z" fill={ink} strokeLinejoin="round" />
            ) : null}
            <Text
                x={78}
                y={isTrump ? (isTwoDigit ? 107 : 112) : isTwoDigit ? 94 : 100}
                fontSize={isTrump ? (isTwoDigit ? 50 : 64) : isTwoDigit ? 60 : 84}
                fontFamily={numberFont}
                fill={ink}
                textAnchor="middle"
            >
                {number}
            </Text>
            <SuitIcon suit={card.suit} x={78} y={isTrump ? 135 : 128} size={isTrump ? 30 : 34} />

            {/* Points, top right */}
            <Circle cx={417} cy={67} r={47} fill="white" stroke={ink} strokeWidth={7} />
            <Text
                x={417}
                y={points.length > 1 ? 83 : 86}
                fontSize={points.length > 1 ? 44 : 54}
                fontFamily={numberFont}
                fill={ink}
                textAnchor="middle"
            >
                {points}
            </Text>

            {/* Name, bottom left */}
            <Rect x={37} y={697} width={labelWidth} height={60} rx={16} fill={ink} />
            <Text
                x={37 + labelWidth / 2 + LABEL_TRACKING / 2}
                y={740}
                fontSize={36}
                fontFamily={labelFont}
                letterSpacing={LABEL_TRACKING}
                fill="white"
                textAnchor="middle"
            >
                {design.label}
            </Text>

            {/* Mirrored number, bottom right */}
            <Rect
                x={382}
                y={689}
                width={85}
                height={83}
                rx={18}
                fill={isTrump ? TRUMP_FILL : "white"}
                stroke={ink}
                strokeWidth={7}
            />
            <Text
                x={424.5}
                y={isTwoDigit ? 746 : 752}
                fontSize={isTwoDigit ? 44 : 60}
                fontFamily={numberFont}
                fill={ink}
                textAnchor="middle"
                transform="rotate(180 424.5 730.5)"
            >
                {number}
            </Text>
        </Svg>
    );
}

export default IllustratedCard;
