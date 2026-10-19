/* The picnic blanket in the middle of the table (or, on phones in portrait,
a round paper disc), where the current trick is played. Each card lands on the side of the player who played it, and a full
trick stays until it is collected: then its cards fly to the winner's
portrait, turning their long side towards it and closing up into a pile on
the way, and shrink under it and fade out. Between rounds the blanket holds the round
Deal button (and the result), and after the deal a round "Choose game" button.
Between rounds the table shows the result (right under the other players)
with a plain "Deal cards" button below it, in place of the blanket. */

import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Image, Pattern, Rect, Defs } from "react-native-svg";
import Card from "./Card";
import { PanelButton } from "./SettingsPanel";
import WinnerGlow from "./WinnerGlow";
import { formatCoins } from "./PlayerName";
import { isTrumpForGame } from "../ai/schafkopfAI";
import { Image as PaintedImage } from "expo-image";
import { cardTexture } from "../data/cardDesign";
import { tableDisc } from "../data/uiArt";
import { t } from "../i18n";
import { cardShadow, colors, fonts, paper, softShadow } from "../theme";

const useNativeDriver = Platform.OS !== "web";
// Width of the result and deal button between rounds.
const DEAL_COLUMN = 340;
// Milliseconds a collected trick takes to fly to its winner. The cards have
// turned towards the winner after TURNED of the way, have closed up into a
// pile after CLOSED, and only fade once under the portrait (from FADE on).
const COLLECT_DURATION = 900;
const TURNED = 0.35;
const CLOSED = 0.5;
const FADE = 0.9;

// The rotation that points a card's long side along (x, y), in degrees,
// without turning it upside down.
function towards({ x, y }) {
    const angle = (Math.atan2(x, -y) * 180) / Math.PI;
    return angle > 90 ? angle - 180 : angle < -90 ? angle + 180 : angle;
}

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
            {canDeal || (blanket.round && needsGame && playedCards.length === 0) ? null : blanket.round ? (
                <PaintedImage source={tableDisc} contentFit="contain" style={StyleSheet.absoluteFill} pointerEvents="none" />
            ) : (
                <Gingham width={blanket.width} height={blanket.height} />
            )}

            {playedCards.map(({ player, card }, index) => {
                const offset = offsets[player];
                const from = { x: offset.x * cardHeight, y: offset.y * cardHeight };
                // Collecting: each card flies from its place to the winner, closing up
                // with the others into a slightly askew pile on the way, and turns
                // its long side towards the winner early in the flight.
                const pile = { x: index * 1.5, y: -index * 1.5, turn: index % 2 ? 3 : -3 };
                const heading = collectTo ? towards({ x: collectTo.x - from.x, y: collectTo.y - from.y }) : 0;
                const move = (start, end) => (collectTo ? flight.interpolate({ inputRange: [0, 1], outputRange: [start, end] }) : start);
                // Along the way to the winner, closed up after CLOSED of the flight.
                const fly = (start, end, inPile) =>
                    collectTo
                        ? flight.interpolate({ inputRange: [0, CLOSED, 1], outputRange: [start, end * CLOSED + inPile, end + inPile] })
                        : start;
                const turn = collectTo
                    ? flight.interpolate({
                          inputRange: [0, TURNED, 1],
                          outputRange: [`${offset.rotate}deg`, `${heading}deg`, `${heading + pile.turn}deg`],
                      })
                    : `${offset.rotate}deg`;
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
                                    { translateX: fly(from.x, collectTo?.x ?? 0, pile.x) },
                                    { translateY: fly(from.y, collectTo?.y ?? 0, pile.y) },
                                    { rotate: turn },
                                    { scale: move(1, 0.3) },
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

            {/* Between rounds: the result under the other players and a plain
            button to deal, in the space of the (hidden) blanket. */}
            {canDeal && playedCards.length === 0 ? (
                <View
                    style={[
                        styles.dealColumn,
                        { width: DEAL_COLUMN, left: (blanket.width - DEAL_COLUMN) / 2 },
                        // Before the first round there is no result: the button in the middle.
                        !gameResult && { top: blanket.height / 2 - 30 },
                    ]}
                >
                    {gameResult ? (
                        <View style={[styles.note, styles.noteFull]} pointerEvents="none">
                            <Text style={styles.noteTitle}>{gameResult.message}</Text>
                            {gameResult.points ? <Text style={styles.noteText}>{gameResult.points}</Text> : null}
                            {gameResult.rows ? <ResultRows rows={gameResult.rows} /> : null}
                        </View>
                    ) : null}
                    <PanelButton label={t("table.dealLabel")} onPress={onDeal} style={styles.dealButton} />
                </View>
            ) : playedCards.length === 0 && needsGame ? (
                <View style={styles.center}>
                    <ChooseGameButton size={blanket.round ? roundButtonSize : buttonSize} onPress={onChooseGame} />
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
    // Phones between rounds: the result and the deal button, from the top of
    // the disc's space down.
    dealColumn: {
        position: "absolute",
        top: -24,
        gap: 14,
        alignItems: "stretch",
    },
    noteFull: {
        maxWidth: "100%",
    },
    dealButton: {
        marginTop: 0,
    },
    center: {
        alignItems: "center",
        gap: 10,
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
