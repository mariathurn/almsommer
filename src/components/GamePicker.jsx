/* Declaring a game, as festival banners: one pennant tile per game this hand
may announce, with its coin reward, plus Pass. If everybody passes, the
Cowards Game is played. Choosing the Sheep Game asks which sheep to call.

The panel sits at the top of the table, sized to the space above your hand,
so your cards stay visible while you decide. */

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import Card from "./Card";
import PaperButton from "./PaperButton";
import { getAvailableGames } from "../data/gameTypes";
import { CARD_RATIO, colors, fonts, paper, softShadow, suitTheme } from "../theme";

const bannerColors = {
    "Sau Spiel": colors.apricot,
    Solo: colors.alpenrose,
    Wenz: colors.enzian,
    Marriage: colors.weide,
};

const HEADER_HEIGHT = 44;
const PANEL_PADDING = 14;

export function Coin({ value, size = 34 }) {
    return (
        <View style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.coinText, { fontSize: size * 0.42 }]}>{value}</Text>
        </View>
    );
}

function BannerTile({ game, width, height, isActive, onPress, onPreview }) {
    const color = bannerColors[game.value];
    const notch = height * 0.1;
    const showBlurb = height >= 140;

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => onPreview(game.value)}
            onHoverOut={() => onPreview(null)}
            onPressIn={() => onPreview(game.value)}
            accessibilityRole="button"
            accessibilityLabel={`${game.label}, ${game.coins} coins`}
            style={({ pressed, hovered }) => [
                { width, height },
                styles.tile,
                (hovered || isActive) && styles.tileRaised,
                pressed && styles.tilePressed,
            ]}
        >
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
                <Path
                    d={`M2 2 H${width - 2} V${height - 2} L${width / 2} ${height - 2 - notch} L2 ${height - 2} Z`}
                    fill={colors.paper}
                    stroke={isActive ? colors.hayDeep : colors.keyline}
                    strokeWidth={isActive ? 3 : 1.5}
                />
                <Path d={`M2 2 H${width - 2} V${height * 0.16} H2 Z`} fill={color} opacity={0.85} />
            </Svg>
            <View style={[styles.tileContent, { paddingTop: height * 0.2, paddingBottom: notch + 6 }]}>
                <Text style={[styles.tileTitle, !showBlurb && styles.tileTitleSmall]} numberOfLines={1}>
                    {game.label}
                </Text>
                {showBlurb ? (
                    <Text style={styles.tileBlurb} numberOfLines={3}>
                        {game.blurb}
                    </Text>
                ) : null}
                <Coin value={game.coins} size={showBlurb ? 34 : 28} />
            </View>
        </Pressable>
    );
}

// onPreview(game) reports the hovered (or pressed) game so the hand can show
// its trumps; null when nothing is hovered.
function GamePicker({ width, maxHeight, hand, selectedGame, calledAce, availableAces, onPick, onPass, onPreview }) {
    const [step, setStep] = useState("game");
    const games = getAvailableGames(hand);

    // Start at the game list each time the hand changes (a new deal).
    useEffect(() => setStep("game"), [hand.length]);

    const contentHeight = Math.max(maxHeight - HEADER_HEIGHT - PANEL_PADDING * 2 - 8, 80);
    // One row of tiles, or a two-column grid on narrow (portrait) screens.
    const inner = width - PANEL_PADDING * 2;
    const columns = width < 560 ? Math.min(2, games.length) : Math.max(games.length, 1);
    const rows = Math.ceil(games.length / columns);
    const tileWidth = Math.min((inner - 12 * (columns - 1)) / columns, 180);
    const tileHeight = Math.min((contentHeight - 12 * (rows - 1)) / rows, 200);
    const aceCardHeight = Math.min(contentHeight - 22, 200, (inner - 24) / 3 / CARD_RATIO);

    const chooseGame = (game) => {
        if (game.value === "Sau Spiel") {
            onPreview("Sau Spiel"); // keep showing its trumps while the sheep is chosen
            setStep("ace");
            return;
        }
        onPick(game.value, null);
    };

    return (
        <View style={[styles.panel, { width, maxHeight }]}>
            <View style={styles.header}>
                {step === "ace" ? <PaperButton
                        label="‹ Back"
                        compact
                        onPress={() => {
                            onPreview(null);
                            setStep("game");
                        }}
                    /> : null}
                <Text style={styles.heading} numberOfLines={1}>
                    {step === "game" ? "What will you play?" : "Which sheep do you call?"}
                </Text>
                {step === "game" ? <PaperButton label="Pass" compact onPress={onPass} /> : null}
            </View>

            {step === "game" ? (
                <View style={styles.tiles}>
                    {games.map((game) => (
                        <BannerTile
                            key={game.value}
                            game={game}
                            width={tileWidth}
                            height={tileHeight}
                            isActive={selectedGame === game.value}
                            onPress={() => chooseGame(game)}
                            onPreview={onPreview}
                        />
                    ))}
                </View>
            ) : (
                <View style={styles.tiles}>
                    {availableAces.map((suit) => (
                        <Pressable
                            key={suit}
                            onPress={() => onPick("Sau Spiel", suit)}
                            accessibilityRole="button"
                            accessibilityLabel={`${suitTheme[suit].name} sheep`}
                            style={({ pressed, hovered }) => [
                                styles.aceChoice,
                                (hovered || calledAce === suit) && styles.tileRaised,
                                pressed && styles.tilePressed,
                            ]}
                        >
                            <Card card={{ id: `${suit}-A`, suit, rank: "A" }} height={aceCardHeight} />
                            <Text style={[styles.aceLabel, { color: suitTheme[suit].color }]}>
                                {suitTheme[suit].name}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        ...paper,
        borderRadius: 18,
        padding: PANEL_PADDING,
        gap: 8,
        alignSelf: "center",
    },
    header: {
        height: HEADER_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
    },
    heading: {
        flexShrink: 1,
        fontFamily: fonts.title,
        fontSize: 22,
        color: colors.ink,
    },
    tiles: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 12,
    },
    tile: {
        ...softShadow,
    },
    tileRaised: {
        transform: [{ translateY: -3 }],
        shadowOpacity: 0.32,
    },
    tilePressed: {
        transform: [{ translateY: -1 }],
    },
    tileContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
    },
    tileTitle: {
        fontFamily: fonts.title,
        fontSize: 19,
        color: colors.ink,
    },
    tileTitleSmall: {
        fontSize: 15,
    },
    tileBlurb: {
        fontFamily: fonts.body,
        fontSize: 12.5,
        lineHeight: 15,
        textAlign: "center",
        color: colors.inkSoft,
    },
    coin: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.hayLight,
        borderWidth: 2,
        borderColor: colors.hay,
    },
    coinText: {
        fontFamily: fonts.number,
        color: colors.ink,
    },
    aceChoice: {
        alignItems: "center",
        gap: 4,
        borderRadius: 12,
    },
    aceLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 15,
    },
});

export default GamePicker;
