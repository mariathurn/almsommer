/* The picnic blanket in the middle of the table (or, on phones in portrait,
a round paper disc), where the current trick is played. Each card lands on the side of the player who played it, and a full
trick stays until it is collected: then its cards are pushed together into a
pile, which flies to the winner's portrait, shrinks under it and fades out. Between rounds the blanket holds the round
Deal button (and the result), and after the deal a round "Choose game" button. */

import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Image, Pattern, Rect, Defs } from "react-native-svg";
import Card from "./Card";
import WinnerGlow from "./WinnerGlow";
import { formatCoins } from "./PlayerName";
import { isTrumpForGame } from "../ai/schafkopfAI";
import { Image as PaintedImage } from "expo-image";
import { cardTexture } from "../data/cardDesign";
import { tableDisc } from "../data/uiArt";
import { t } from "../i18n";
import { cardShadow, colors, fonts, paper, softShadow } from "../theme";

const useNativeDriver = Platform.OS !== "web";
// Milliseconds a collected trick takes: first the cards are pushed together
// into a pile (until GATHERED of the way), then the pile flies to its winner
// and only fades once it is under the portrait (from FADE on).
const COLLECT_DURATION = 1000;
const GATHERED = 0.4;
const FADE = 0.9;

// Where a played card sits relative to the blanket centre, as a share of the
// card size, and its slight tilt.
const seatOffsets = {
    south: { x: 0, y: 0.28, rotate: -4 },
    west: { x: -0.62, y: 0, rotate: -12 },
    north: { x: 0, y: -0.28, rotate: 6 },
    east: { x: 0.62, y: 0, rotate: 11 },
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

// Each player's coins for the round just played, and their session balance.
function ResultRows({ rows }) {
    return (
        <View style={styles.resultRows}>
            {rows.map((row) => (
                <View key={row.seat} style={styles.resultRow}>
                    <Text style={[styles.resultName, row.isWinner && styles.resultWinner]} numberOfLines={1}>
                        {row.name}
                    </Text>
                    <Text style={[styles.resultDelta, row.delta > 0 ? styles.up : row.delta < 0 ? styles.down : null]}>
                        {formatCoins(row.delta)}
                    </Text>
                    <Text style={styles.resultTotal}>{formatCoins(row.total)}</Text>
                </View>
            ))}
            <View style={styles.resultRow}>
                <View style={styles.resultSpacer} />
                <Text style={styles.resultCaption}>{t("result.round")}</Text>
                <Text style={styles.resultCaption}>{t("result.session")}</Text>
            </View>
        </View>
    );
}

// Like the painted deal button: the painted circle, lettered "choose game".
function ChooseGameButton({ size, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={t("table.chooseGameLabel")}
            style={({ pressed, hovered }) => [
                styles.paintedButton,
                { width: size, height: size },
                hovered && styles.roundButtonHovered,
                pressed && styles.roundButtonPressed,
            ]}
        >
            <PaintedImage source={tableDisc} contentFit="contain" style={StyleSheet.absoluteFill} />
            <Text style={[styles.paintedLabel, { fontSize: size * 0.2, lineHeight: size * 0.21 }]}>{t("table.chooseGame")}</Text>
        </Pressable>
    );
}

// The "deal" button: the painted circle, lettered in the chosen language.
function DealButton({ size, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={t("table.dealLabel")}
            style={({ pressed, hovered }) => [
                styles.paintedButton,
                { width: size, height: size },
                hovered && styles.roundButtonHovered,
                pressed && styles.roundButtonPressed,
            ]}
        >
            <PaintedImage source={tableDisc} contentFit="contain" style={StyleSheet.absoluteFill} />
            <Text style={[styles.paintedLabel, { fontSize: size * 0.3, lineHeight: size * 0.34 }]}>{t("table.deal")}</Text>
        </Pressable>
    );
}

function TableCenter({
    blanket,
    portrait = false,
    playedCards,
    trickWinner = null,
    trickWinnerName,
    isTrickComplete,
    gameResult,
    canDeal,
    needsGame,
    onDeal,
    onChooseGame,
    trumpGame = null,
    // A trick being collected: where its winner is ({ x, y } from the blanket's
    // centre); onCollected is called once the cards have flown there.
    collectTo = null,
    onCollected = null,
}) {
    const flight = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (!collectTo) return undefined;
        flight.setValue(0);
        const animation = Animated.timing(flight, {
            toValue: 1,
            duration: COLLECT_DURATION,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver,
        });
        animation.start(({ finished }) => finished && onCollected?.());
        return () => animation.stop();
    }, [collectTo]); // eslint-disable-line react-hooks/exhaustive-deps

    const fanAbove = blanket.round && portrait;
    const cardHeight = fanAbove ? blanket.width * 0.68 : blanket.round ? blanket.width * 0.66 : Math.min(blanket.height * 0.6, blanket.width * 0.4);
    // Every card lands on its player's side, on phones as in the web view;
    // on phones the top player's card sits a little higher.
    const offsets = portrait ? { ...seatOffsets, north: { ...seatOffsets.north, y: -0.45 } } : seatOffsets;
    const buttonSize = Math.min(blanket.height * 0.42, 112);
    // The round deal / choose game button replaces the table circle: on phones
    // it is exactly the circle's size, on the web a little smaller.
    const roundButtonSize = portrait ? blanket.width : blanket.width * 0.6;
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
            {/* Portrait: the painted deal / choose game button takes the disc's place. */}
            {blanket.round && (canDeal || (needsGame && playedCards.length === 0)) ? null : blanket.round ? (
                <PaintedImage source={tableDisc} contentFit="contain" style={StyleSheet.absoluteFill} pointerEvents="none" />
            ) : (
                <Gingham width={blanket.width} height={blanket.height} />
            )}

            {playedCards.map(({ player, card }, index) => {
                const offset = offsets[player];
                const from = { x: offset.x * cardHeight, y: offset.y * cardHeight };
                // Collecting: from its place into the pile in the middle (stacked
                // slightly askew, like a gathered heap), then with the pile to the winner.
                const pile = { x: index * 1.5, y: -index * 1.5, rotate: `${index % 2 ? 2 : -2}deg` };
                const move = (start, gathered, end) =>
                    collectTo ? flight.interpolate({ inputRange: [0, GATHERED, 1], outputRange: [start, gathered, end] }) : start;
                return (
                    <Animated.View
                        key={player}
                        pointerEvents="none"
                        style={[
                            styles.playedCard,
                            // Cards stack in the order they were played.
                            { zIndex: index + 1 },
                            collectTo && { opacity: flight.interpolate({ inputRange: [0, FADE, 1], outputRange: [1, 1, 0] }) },
                            {
                                transform: [
                                    { translateX: move(from.x, pile.x, (collectTo?.x ?? 0) + pile.x) },
                                    { translateY: move(from.y, pile.y, (collectTo?.y ?? 0) + pile.y) },
                                    { rotate: move(`${offset.rotate}deg`, pile.rotate, pile.rotate) },
                                    { scale: move(1, 1, 0.3) },
                                ],
                            },
                        ]}
                    >
                        <WinnerGlow
                            active={isTrickComplete && player === trickWinner}
                            radius={cardHeight * 0.045}
                            spread={6}
                            scaleTo={1.06}
                        >
                            <Card
                                card={card}
                                faceUp
                                isTrump={Boolean(trumpGame) && isTrumpForGame(card, trumpGame)}
                                height={cardHeight}
                                gameName={trumpGame}
                            />
                        </WinnerGlow>
                    </Animated.View>
                );
            })}

            {playedCards.length === 0 && (canDeal || needsGame) ? (
                <View style={[styles.center, isSmall && styles.centerRow]}>
                    {gameResult ? (
                        <View
                            style={[
                                styles.note,
                                isSmall && { maxWidth: blanket.width - buttonSize - 40 },
                                // Phones: below the deal button, where the (now empty) hand was.
                                blanket.round && canDeal && styles.noteBelowDisc,
                            ]}
                            pointerEvents="none"
                        >
                            <Text style={styles.noteTitle}>{gameResult.message}</Text>
                            {gameResult.points ? <Text style={styles.noteText}>{gameResult.points}</Text> : null}
                            {gameResult.rows ? <ResultRows rows={gameResult.rows} /> : null}
                        </View>
                    ) : null}
                    {canDeal ? <DealButton size={blanket.round ? roundButtonSize : buttonSize} onPress={onDeal} /> : null}
                    {needsGame ? (
                        <ChooseGameButton size={blanket.round ? roundButtonSize : buttonSize} onPress={onChooseGame} />
                    ) : null}
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
        ...cardShadow,
    },
    resultRows: {
        marginTop: 8,
        gap: 2,
        width: 230,
    },
    resultRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    resultName: {
        flex: 1,
        fontFamily: fonts.bodyMedium,
        fontSize: 14,
        color: colors.inkSoft,
    },
    resultWinner: {
        fontFamily: fonts.bodyBold,
        color: colors.ink,
    },
    resultDelta: {
        width: 46,
        textAlign: "right",
        fontFamily: fonts.number,
        fontSize: 15,
        color: colors.inkSoft,
    },
    up: {
        color: "#3d7a2a",
    },
    down: {
        color: "#a8323d",
    },
    resultTotal: {
        width: 52,
        textAlign: "right",
        fontFamily: fonts.number,
        fontSize: 13,
        color: colors.inkSoft,
    },
    resultSpacer: {
        flex: 1,
    },
    resultCaption: {
        width: 49,
        textAlign: "right",
        fontFamily: fonts.body,
        fontSize: 11,
        color: colors.inkSoft,
    },
    paintedButton: {
        alignItems: "center",
        justifyContent: "center",
    },
    paintedLabel: {
        fontFamily: fonts.hand,
        textAlign: "center",
        color: colors.ink,
    },
    noteBelowDisc: {
        position: "absolute",
        top: "100%",
        marginTop: 16,
        zIndex: 2,
        // Wider than the deal button it hangs from.
        width: 300,
        maxWidth: 300,
    },
    center: {
        alignItems: "center",
        gap: 10,
    },
    centerRow: {
        flexDirection: "row",
        paddingHorizontal: 10,
    },
    roundButtonHovered: {
        transform: [{ scale: 1.04 }],
    },
    roundButtonPressed: {
        transform: [{ scale: 0.97 }],
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
        fontFamily: fonts.hand,
        fontSize: 24,
        lineHeight: 27,
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
