/* The illustrated card design: coloured frame with a dot pattern, a textured
centre panel with the artwork, the card number with a symbol above it (top
left, mirrored bottom right), the card's points in a tab (top right) and its
name (bottom left). Drawn in a 500 x 784 coordinate space that scales to any size. */

import Svg, { Circle, ClipPath, Defs, G, Image, Line, Path, Pattern, Rect, Text } from "react-native-svg";
import {
    artSizes,
    cardPoints,
    cardTexture,
    formatCardNumber,
    getCardNumber,
    ink,
    labelFont,
    numberFont,
    pointsFill,
    rankDesign,
    suitColors,
} from "../data/cardDesign";
import { SYMBOL_BOX, cardSymbols } from "../data/cardSymbols";
import { cardLabel } from "../i18n/names";

const panel = { x: 37, y: 92, width: 428, height: 585, rx: 20 };
// Artwork is fitted inside this box, so wide motifs (hat) and tall ones (sheep) both fill it.
const artBox = { x: 57, y: 116, width: 388, height: 537 };
const PANEL_STROKE = 7;
// Number box, top left: a symbol on top, the number below it.
const numberBox = { x: 24, y: 20, width: 108, height: 168, rx: 20 };
const SYMBOL_CENTER = { x: 78, y: 68 };
// Points tab, top right: rounded on top, hanging over the panel's top border.
const pointsTab = { left: 366, right: 448, top: 20, bottom: 124, radius: 36 };
const POINTS_TAB_PATH = (({ left, right, top, bottom, radius: r }) =>
    `M${left} ${bottom} V${top + r} A${r} ${r} 0 0 1 ${left + r} ${top} H${right - r} A${r} ${r} 0 0 1 ${right} ${top + r} V${bottom} Z`)(
    pointsTab
);
// Approximate width of an uppercase Barlow Condensed Bold letter at 36px, plus tracking.
const LABEL_CHAR_WIDTH = 18;
const LABEL_TRACKING = 2.5;
// Area a clipped figure may cover: inside the panel's side and bottom
// borders, but open at the top so the hat can overlap the top border.
const figureClip = {
    x: panel.x + PANEL_STROKE / 2,
    y: 0,
    width: panel.width - PANEL_STROKE,
    height: panel.y + panel.height - PANEL_STROKE / 2,
};

// Places a figure between its top and bottom, centred on centerX.
function getFigurePlacement({ file, top, bottom, centerX }) {
    const size = artSizes[file];
    const height = bottom - top;
    const width = height * (size.width / size.height);
    return { x: centerX - width / 2, y: top, width, height };
}

// Dog or shepherd symbol, centred on (x, y): suit-coloured with ink lines.
function FigureSymbol({ symbol, color, x, y, size }) {
    const scale = size / SYMBOL_BOX;
    return (
        <G transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale})`}>
            {cardSymbols[symbol].map((layer, i) => (
                <Path key={i} d={layer.d} fill={layer.fill === "suit" ? color : ink} />
            ))}
        </G>
    );
}

// Small suit symbols drawn in a 40 x 40 box.
export function SuitIcon({ suit, x, y, size }) {
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

// Trump cards get a gold frame, yellow number boxes and a crown above the symbol.
const TRUMP_FILL = "#eec652";

function IllustratedCard({ card, width, height, isTrump = false, gameName = null }) {
    const colors = suitColors[card.suit];
    const design = rankDesign[card.rank];
    const figure = design.figure?.[card.suit];
    const cardNumber = getCardNumber(card, gameName);
    const number = formatCardNumber(cardNumber);
    const isTwoDigit = cardNumber >= 10;
    const points = String(cardPoints[card.rank]);
    const label = cardLabel(card.rank);
    const labelWidth = label.length * (LABEL_CHAR_WIDTH + LABEL_TRACKING) + 44;
    // Trumps get a gold frame with ink dots instead of the suit colour.
    const dotsId = isTrump ? "card-dots-trump" : `card-dots-${card.suit}`;
    const frameFill = isTrump ? TRUMP_FILL : colors.frame;
    const dotFill = isTrump ? ink : colors.dots;
    // With a crown on top, the symbol moves down and shrinks a little.
    const symbolY = isTrump ? SYMBOL_CENTER.y + 12 : SYMBOL_CENTER.y;
    const figureImage = figure ? (
        <Image href={design.art[card.suit]} {...getFigurePlacement(figure)} preserveAspectRatio="none" />
    ) : null;

    return (
        <Svg width={width} height={height} viewBox="0 0 500 784">
            <Defs>
                <Pattern id={dotsId} width={16} height={16} patternUnits="userSpaceOnUse">
                    <Circle cx={8} cy={8} r={2.2} fill={dotFill} opacity={isTrump ? 0.3 : 1} />
                </Pattern>
                <ClipPath id="card-panel-clip">
                    <Rect {...panel} />
                </ClipPath>
                <ClipPath id="card-figure-clip">
                    <Rect {...figureClip} />
                </ClipPath>
            </Defs>

            {/* Frame with dot pattern */}
            <Rect x={4} y={4} width={492} height={776} rx={34} fill={frameFill} />
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
            {figure?.clip ? <G clipPath="url(#card-figure-clip)">{figureImage}</G> : figureImage}

            {/* Points tab, top right */}
            <Path d={POINTS_TAB_PATH} fill={pointsFill} stroke={ink} strokeWidth={7} strokeLinejoin="round" />
            <Text
                x={(pointsTab.left + pointsTab.right) / 2}
                y={points.length > 1 ? 91 : 95}
                fontSize={points.length > 1 ? 44 : 54}
                fontFamily={numberFont}
                fill={ink}
                textAnchor="middle"
            >
                {points}
            </Text>

            {/* Symbol and number, top left (crowned and yellow for trumps) */}
            <Rect {...numberBox} fill={isTrump ? TRUMP_FILL : "white"} stroke={ink} strokeWidth={7} />
            {isTrump ? (
                <Path d="M62 46 L60 30 L70 38 L78 27 L86 38 L96 30 L94 46 Z" fill={ink} strokeLinejoin="round" />
            ) : null}
            {design.symbol ? (
                <FigureSymbol
                    symbol={design.symbol}
                    color={colors.frame}
                    x={SYMBOL_CENTER.x}
                    y={symbolY}
                    size={isTrump ? 84 : 112}
                />
            ) : (
                <SuitIcon suit={card.suit} x={SYMBOL_CENTER.x} y={symbolY} size={isTrump ? 56 : 76} />
            )}
            <Text
                x={78}
                y={170}
                fontSize={isTwoDigit ? 60 : 62}
                fontFamily={numberFont}
                fill={ink}
                textAnchor="middle"
            >
                {number}
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
                {label}
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
                y={isTwoDigit ? 748 : 752}
                fontSize={isTwoDigit ? 50 : 60}
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
