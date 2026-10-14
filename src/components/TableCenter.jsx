/* The picnic blanket in the middle of the table (or, on phones in portrait,
a round paper disc), where the current trick is played. Each card lands on the side of the player who played it, and a full
trick stays until it is collected. Between rounds the blanket holds the round
Deal button (and the result), and after the deal a round "Choose game" button. */

import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Image, Pattern, Rect, Defs } from "react-native-svg";
import Card from "./Card";
import { isTrumpForGame } from "../ai/schafkopfAI";
import { Image as PaintedImage } from "expo-image";
import { cardTexture } from "../data/cardDesign";
import { dealButton, tableDisc } from "../data/uiArt";
import { colors, fonts, paper, softShadow } from "../theme";

// Where a played card sits relative to the blanket centre, as a share of the
// card size, and its slight tilt.
const seatOffsets = {
    south: { x: 0, y: 0.28, rotate: -4 },
    west: { x: -0.62, y: 0, rotate: -12 },
    north: { x: 0, y: -0.28, rotate: 6 },
    east: { x: 0.62, y: 0, rotate: 11 },
};

// Portrait: the opponents sit in a row above the disc, so their cards fan out
// over its top edge, each tilted towards its player; yours lands at the bottom.
const discOffsets = {
    west: { x: -0.5, y: -0.42, rotate: -38 },
    north: { x: 0, y: -0.62, rotate: 0 },
    east: { x: 0.5, y: -0.42, rotate: 38 },
    south: { x: 0, y: 0.12, rotate: -3 },
};

function Gingham({ width, height }) {
    return (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
                <Pattern id="picnic-gingham" width={36} height={36} patternUnits="userSpaceOnUse">
                    <Rect width={36} height={36} fill={colors.paper} />
                    <Rect width={18} height={36} fill={colors.blanket} opacity={0.42} />
                    <Rect width={36} height={18} fill={colors.blanket} opacity={0.42} />
                </Pattern>
            </Defs>
            <Rect width={width} height={height} rx={10} fill="url(#picnic-gingham)" />
            <Image
                href={cardTexture}
                width={width}
                height={height}
                preserveAspectRatio="xMidYMid slice"
                opacity={0.3}
            />
            <Rect
                x={7}
                y={7}
                width={width - 14}
                height={height - 14}
                rx={6}
                fill="none"
                stroke={colors.paper}
                strokeWidth={2}
                strokeDasharray="6 5"
                opacity={0.9}
            />
        </Svg>
    );
}

function RoundButton({ label, size, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed, hovered }) => [
                styles.roundButton,
                { width: size, height: size, borderRadius: size / 2 },
                hovered && styles.roundButtonHovered,
                pressed && styles.roundButtonPressed,
            ]}
        >
            <Text style={[styles.roundButtonText, { fontSize: Math.max(size * 0.2, 15) }]}>{label}</Text>
        </Pressable>
    );
}

// The hand-painted "deal" button.
function DealButton({ size, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="Deal"
            style={({ pressed, hovered }) => [
                { width: size, height: size },
                hovered && styles.roundButtonHovered,
                pressed && styles.roundButtonPressed,
            ]}
        >
            <PaintedImage source={dealButton} contentFit="contain" style={StyleSheet.absoluteFill} />
        </Pressable>
    );
}

function TableCenter({
    blanket,
    playedCards,
    trickWinnerName,
    isTrickComplete,
    gameResult,
    canDeal,
    needsGame,
    onDeal,
    onChooseGame,
    trumpGame = null,
}) {
    const cardHeight = blanket.round ? blanket.width * 0.56 : Math.min(blanket.height * 0.6, blanket.width * 0.4);
    const offsets = blanket.round ? discOffsets : seatOffsets;
    const buttonSize = Math.min(blanket.height * 0.42, 112);
    // On a small (phone) blanket the result sits beside the Deal button.
    const isSmall = blanket.height < 200 && !blanket.round;

    return (
        <View
            pointerEvents="box-none"
            style={[
                styles.blanket,
                blanket.round && [styles.disc, { borderRadius: blanket.width / 2 }],
                {
                    width: blanket.width,
                    height: blanket.height,
                    left: blanket.centerX - blanket.width / 2,
                    top: blanket.centerY - blanket.height / 2,
                },
            ]}
        >
            {/* Portrait: before a deal the painted deal button takes the disc's place. */}
            {blanket.round && canDeal ? null : blanket.round ? (
                <PaintedImage source={tableDisc} contentFit="contain" style={StyleSheet.absoluteFill} pointerEvents="none" />
            ) : (
                <Gingham width={blanket.width} height={blanket.height} />
            )}

            {playedCards.map(({ player, card }) => {
                const offset = offsets[player];
                return (
                    <View
                        key={player}
                        pointerEvents="none"
                        style={[
                            styles.playedCard,
                            {
                                transform: [
                                    { translateX: offset.x * cardHeight },
                                    { translateY: offset.y * cardHeight },
                                    { rotate: `${offset.rotate}deg` },
                                ],
                            },
                        ]}
                    >
                        <Card
                            card={card}
                            faceUp
                            isTrump={Boolean(trumpGame) && isTrumpForGame(card, trumpGame)}
                            height={cardHeight}
                        />
                    </View>
                );
            })}

            {isTrickComplete ? (
                <View style={styles.collectNote} pointerEvents="none">
                    <Text style={styles.collectText} numberOfLines={2}>
                        {trickWinnerName} takes the trick · tap anywhere to continue
                    </Text>
                </View>
            ) : null}

            {playedCards.length === 0 && (canDeal || needsGame) ? (
                <View style={[styles.center, isSmall && styles.centerRow]}>
                    {gameResult ? (
                        <View
                            style={[
                                styles.note,
                                isSmall && { maxWidth: blanket.width - buttonSize - 40 },
                                // Above the deal circle, which fills the whole disc area.
                                blanket.round && canDeal && styles.noteAboveDisc,
                            ]}
                            pointerEvents="none"
                        >
                            <Text style={styles.noteTitle}>{gameResult.message}</Text>
                            <Text style={styles.noteText}>{gameResult.points}</Text>
                        </View>
                    ) : null}
                    {canDeal ? <DealButton size={blanket.round ? blanket.width : buttonSize * 1.15} onPress={onDeal} /> : null}
                    {needsGame ? <RoundButton label="Choose game" size={buttonSize} onPress={onChooseGame} /> : null}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    blanket: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        transform: [{ rotate: "-1.5deg" }],
        ...softShadow,
    },
    // The painted disc image brings its own edge and translucency.
    disc: {
        transform: [],
        shadowOpacity: 0,
        elevation: 0,
    },
    playedCard: {
        position: "absolute",
        ...softShadow,
    },
    noteAboveDisc: {
        position: "absolute",
        bottom: "100%",
        marginBottom: 12,
        zIndex: 2,
    },
    center: {
        alignItems: "center",
        gap: 10,
    },
    centerRow: {
        flexDirection: "row",
        paddingHorizontal: 10,
    },
    collectNote: {
        ...paper,
        position: "absolute",
        bottom: -14,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 999,
        maxWidth: "95%",
        zIndex: 2,
    },
    collectText: {
        fontFamily: fonts.bodyBold,
        fontSize: 13,
        color: colors.ink,
    },
    roundButton: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.hay,
        borderWidth: 3,
        borderColor: colors.hayDeep,
        padding: 8,
        ...softShadow,
    },
    roundButtonHovered: {
        transform: [{ scale: 1.04 }],
    },
    roundButtonPressed: {
        transform: [{ scale: 0.97 }],
    },
    roundButtonText: {
        fontFamily: fonts.title,
        textAlign: "center",
        color: colors.ink,
    },
    note: {
        ...paper,
        paddingVertical: 10,
        paddingHorizontal: 18,
        alignItems: "center",
        gap: 2,
        maxWidth: "85%",
    },
    noteTitle: {
        fontFamily: fonts.title,
        fontSize: 17,
        textAlign: "center",
        color: colors.ink,
    },
    noteText: {
        fontFamily: fonts.bodyBold,
        fontSize: 15,
        color: colors.inkSoft,
    },
});

export default TableCenter;
