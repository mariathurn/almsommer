/* PlayerPanel

Owns one seat at the table. South is your fanned hand with a name tag above it.
Opponents are portrait medallions with their name tag and how many cards they
still hold; the medallion gets a gold ring while it is their turn. */

import { StyleSheet, Text, View } from "react-native";
import FanOfCards from "./FanOfCards";
import PlayerName from "./PlayerName";
import { CARD_RATIO, colors, fanWidth, fonts, paper } from "../theme";

const SOUTH_SPACING = 0.55;
const SOUTH_ROTATION_STEP = 5;
const seatColors = { west: colors.weide, north: colors.enzian, east: colors.alpenrose };

function Medallion({ name, seat, size, isCurrentTurn, cardCount }) {
    const ring = size * 0.09;
    const outer = size + ring * 2;

    return (
        <View style={{ width: outer, height: outer, alignItems: "center", justifyContent: "center" }}>
            {isCurrentTurn ? <View style={[styles.glow, { width: outer, height: outer, borderRadius: outer / 2 }]} /> : null}
            <View
                style={[
                    styles.medallion,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderColor: isCurrentTurn ? colors.hay : seatColors[seat],
                    },
                ]}
            >
                <View style={[styles.wash, { backgroundColor: seatColors[seat] }]} />
                <Text style={[styles.initial, { fontSize: size * 0.48 }]}>{name.charAt(0)}</Text>
            </View>
            {cardCount > 0 ? (
                <View style={[styles.count, { minWidth: size * 0.38, height: size * 0.38 }]}>
                    <Text style={[styles.countText, { fontSize: size * 0.2 }]}>{cardCount}</Text>
                </View>
            ) : null}
        </View>
    );
}

// Portrait: the three opponents share the top row, one column each.
const portraitColumn = { west: 0, north: 1, east: 2 };

function getOpponentPlacement(seat, layout) {
    const { edge, blanket, medallionSize } = layout;
    if (layout.portrait) {
        const columnWidth = layout.width / 3;
        return { left: portraitColumn[seat] * columnWidth, width: columnWidth, top: edge, alignItems: "center" };
    }
    const lift = { transform: [{ translateY: -medallionSize * 0.75 }] };

    switch (seat) {
        case "north":
            return {
                left: 0,
                right: 0,
                top: edge,
                alignItems: "center",
                justifyContent: "center",
                ...(layout.compact && { flexDirection: "row", gap: 8 }),
            };
        case "west":
            return { left: edge, top: blanket.centerY, alignItems: "flex-start", ...lift };
        case "east":
        default:
            return { right: edge, top: blanket.centerY, alignItems: "flex-end", ...lift };
    }
}

function PlayerPanel({
    seat,
    layout,
    name,
    cards,
    isCurrentTurn,
    onPlayCard,
    playedCards = [],
    gameType = null,
    status = null,
    showFriendBadge = false,
    trumpGame = null,
    highlightTrumps = false,
}) {
    const tag = (
        <PlayerName
            style={layout.portrait && seat !== "south" && styles.portraitTag}
            name={name}
            gameType={gameType}
            status={status}
            showFriendBadge={showFriendBadge}
            isCurrentTurn={isCurrentTurn}
        />
    );

    if (seat !== "south") {
        return (
            <View style={[styles.seat, getOpponentPlacement(seat, layout)]} pointerEvents="none">
                {/* Portrait shows only the name tags, as in the phone sketch. */}
                {layout.portrait ? null : (
                    <Medallion
                        name={name}
                        seat={seat}
                        size={layout.medallionSize}
                        isCurrentTurn={isCurrentTurn}
                        cardCount={cards.length}
                    />
                )}
                {tag}
            </View>
        );
    }

    // On narrow (portrait) screens the cards overlap more so the hand fits,
    // with a margin for the tilt of the outer cards.
    const cardWidth = layout.southCardHeight * CARD_RATIO;
    const spacing =
        cards.length > 1
            ? Math.min(SOUTH_SPACING, (layout.width - 2 * layout.edge - 24 - cardWidth) / ((cards.length - 1) * cardWidth))
            : SOUTH_SPACING;
    const fanLength = cards.length ? fanWidth(cards.length, layout.southCardHeight, spacing) : 0;
    // Portrait: nudged right, since the tilted fan otherwise looks left-heavy.
    const left = (layout.width - fanLength) / 2 + (layout.portrait ? cardWidth * 0.1 : 0);

    return (
        <>
            <View style={[styles.fan, { left, top: layout.southFanTop }]} pointerEvents="box-none">
                <FanOfCards
                    cards={cards}
                    cardHeight={layout.southCardHeight}
                    faceUp
                    onPlayCard={onPlayCard}
                    isCurrentTurn={isCurrentTurn}
                    playedCards={playedCards}
                    spacing={spacing}
                    rotationStep={SOUTH_ROTATION_STEP}
                    trumpGame={trumpGame}
                    highlightTrumps={highlightTrumps}
                />
            </View>
            <View
                style={[
                    styles.label,
                    layout.portrait
                        ? styles.labelBottom
                        : layout.compact
                          ? { right: layout.width - left + 10, top: layout.southFanTop + layout.southCardHeight * 0.35 }
                          : { left: cards.length ? left : layout.width / 2 - 80, top: layout.southFanTop - layout.labelHeight },
                ]}
                pointerEvents="none"
            >
                {tag}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    // Portrait opponents: name above status, like the phone sketch.
    portraitTag: {
        maxWidth: 136,
        flexDirection: "column",
        gap: 0,
        paddingVertical: 4,
    },
    labelBottom: {
        left: 0,
        right: 0,
        bottom: 10,
        alignItems: "center",
    },
    seat: {
        position: "absolute",
        gap: 4,
    },
    fan: {
        position: "absolute",
    },
    label: {
        position: "absolute",
        zIndex: 5,
    },
    glow: {
        position: "absolute",
        backgroundColor: colors.hayLight,
        borderWidth: 2,
        borderColor: colors.hay,
        shadowColor: colors.hay,
        shadowOpacity: 0.9,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
    },
    medallion: {
        ...paper,
        borderWidth: 3,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    wash: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.22,
    },
    initial: {
        fontFamily: fonts.titleBlack,
        color: colors.ink,
    },
    count: {
        ...paper,
        position: "absolute",
        right: -2,
        bottom: -2,
        borderRadius: 999,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    countText: {
        fontFamily: fonts.number,
        color: colors.ink,
    },
});

export default PlayerPanel;
