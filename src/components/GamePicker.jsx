/* Game choice as festival banners: one pennant tile per game with its coin
reward. Choosing Sauspiel asks which sheep (ace) to call, shown as the cards. */

import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import Card from "./Card";
import PaperButton from "./PaperButton";
import { gameTypes } from "../data/gameTypes";
import { colors, fonts, paper, softShadow, suitTheme } from "../theme";

const bannerColors = {
    "Sau Spiel": colors.apricot,
    Solo: colors.alpenrose,
    Wenz: colors.enzian,
    Marriage: colors.weide,
    Ramsch: colors.hay,
};

export function Coin({ value, size = 34 }) {
    return (
        <View style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.coinText, { fontSize: size * 0.42 }]}>{value}</Text>
        </View>
    );
}

function BannerTile({ game, width, height, isActive, disabledNote, onPress }) {
    const color = bannerColors[game.value];
    const notch = height * 0.12;

    return (
        <Pressable
            onPress={onPress}
            disabled={Boolean(disabledNote)}
            accessibilityRole="button"
            accessibilityLabel={`${game.label}, ${game.coins} coins`}
            style={({ pressed, hovered }) => [
                { width, height },
                styles.tile,
                !disabledNote && (hovered || isActive) && styles.tileRaised,
                !disabledNote && pressed && styles.tilePressed,
                disabledNote && styles.tileDisabled,
            ]}
        >
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
                <Path
                    d={`M2 2 H${width - 2} V${height - 2} L${width / 2} ${height - 2 - notch} L2 ${height - 2} Z`}
                    fill={colors.paper}
                    stroke={isActive ? colors.hay : colors.keyline}
                    strokeWidth={isActive ? 3 : 1.5}
                />
                <Path d={`M2 2 H${width - 2} V${height * 0.2} H2 Z`} fill={color} opacity={0.85} />
            </Svg>
            <View style={[styles.tileContent, { paddingTop: height * 0.24, paddingBottom: notch + 8 }]}>
                <Text style={styles.tileTitle} numberOfLines={1}>
                    {game.label}
                </Text>
                <Text style={styles.tileBlurb} numberOfLines={3}>
                    {disabledNote ?? game.blurb}
                </Text>
                <Coin value={game.coins} />
            </View>
        </Pressable>
    );
}

function GamePicker({ visible, selectedGame, calledAce, availableAces, onPick, onClose }) {
    const [step, setStep] = useState("game");
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    useEffect(() => {
        if (visible) setStep("game");
    }, [visible]);

    const tileWidth = Math.min((windowWidth - 120) / gameTypes.length, 170);
    const tileHeight = Math.min(windowHeight * 0.5, tileWidth * 1.25);
    const aceCardHeight = Math.min(windowHeight * 0.42, 220);

    const chooseGame = (game) => {
        if (game.value === "Sau Spiel") {
            setStep("ace");
            return;
        }
        onPick(game.value, null);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={() => {}}>
                    {step === "game" ? (
                        <>
                            <Text style={styles.heading}>What will you play?</Text>
                            <View style={styles.tiles}>
                                {gameTypes.map((game) => (
                                    <BannerTile
                                        key={game.value}
                                        game={game}
                                        width={tileWidth}
                                        height={tileHeight}
                                        isActive={selectedGame === game.value}
                                        disabledNote={
                                            game.value === "Sau Spiel" && availableAces.length === 0
                                                ? "You have no sheep you may call this round."
                                                : null
                                        }
                                        onPress={() => chooseGame(game)}
                                    />
                                ))}
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.heading}>Which sheep do you call?</Text>
                            <Text style={styles.subheading}>Whoever holds it plays with you, but stays secret until it is played.</Text>
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
                            <PaperButton label="Back" compact onPress={() => setStep("game")} />
                        </>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.scrim,
        padding: 16,
    },
    sheet: {
        ...paper,
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 22,
        alignItems: "center",
        gap: 12,
        maxWidth: "100%",
    },
    heading: {
        fontFamily: fonts.title,
        fontSize: 24,
        color: colors.ink,
    },
    subheading: {
        fontFamily: fonts.body,
        fontSize: 15,
        color: colors.inkSoft,
        textAlign: "center",
        marginTop: -6,
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
        transform: [{ translateY: -4 }],
        shadowOpacity: 0.32,
    },
    tileDisabled: {
        opacity: 0.5,
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
        gap: 6,
        borderRadius: 12,
    },
    aceLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 16,
    },
});

export default GamePicker;
