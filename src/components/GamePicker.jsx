/* Declaring a game. A dotted paper panel with one tile per game (picture strip
from the card art, coin reward, name and rule), games this hand can't announce
greyed out with the reason, a trump-suit row for a Solo or a sheep row for a
Sheep Game, and Pass / "Play …" at the bottom. If everybody passes, the
Cowards Game is played.

The selected (or hovered) game is reported through onPreview, so your hand
shows its trumps while you decide. The panel sits above your hand, so your
cards stay visible. */

import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { SuitIcon } from "./IllustratedCard";
import { canCallAce } from "../ai/schafkopfAI";
import { rankDesign, suitColors } from "../data/cardDesign";
import { gameTypes, getUnavailableReason, suitNamesEn } from "../data/gameTypes";
import { colors, fonts, softShadow } from "../theme";

// Picture strip for each tile: a card illustration, its panel colour, and
// which part of the picture to show.
const tileArt = {
    "Sau Spiel": { rank: "A", suit: "leaf", position: { top: "12%", left: "50%" } },
    Solo: { rank: "O", suit: "acorn", position: "top" },
    Wenz: { rank: "U", suit: "heart", position: { top: "20%", left: "50%" } },
    Marriage: { rank: "9", suit: "bell", position: "center" },
};
const tileBlurbs = {
    "Sau Spiel": "Call a sheep. Whoever holds it is your secret partner.",
    Solo: "Pick a trump suit. One against three.",
    Wenz: "Only the dogs are trumps. You play alone.",
    Marriage: "Offer your one trump and find a partner.",
};
const soloSuits = ["acorn", "heart", "leaf", "bell"];
const sheepSuits = ["acorn", "leaf", "bell"];

function DottedPaper() {
    return (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
                <Pattern id="picker-dots" width={14} height={14} patternUnits="userSpaceOnUse">
                    <Circle cx={7} cy={7} r={1.3} fill={colors.ink} opacity={0.09} />
                </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#picker-dots)" />
        </Svg>
    );
}

export function CoinBadge({ value, dimmed = false, size = 15 }) {
    return (
        <View style={[styles.coinBadge, dimmed && styles.coinBadgeDimmed]}>
            <View style={[styles.coin, dimmed && styles.coinDimmed, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2 }]}>
                <View style={[styles.coinInner, { width: size - 2, height: size - 2, borderRadius: size }]} />
            </View>
            <Text style={[styles.coinText, { fontSize: size + 2 }, dimmed && styles.dimText]}>{value}</Text>
        </View>
    );
}

function GameTile({ game, width, artHeight, selected, reason, onSelect, onHover }) {
    const art = tileArt[game.value];
    const disabled = Boolean(reason);

    return (
        <Pressable
            onPress={onSelect}
            onHoverIn={() => onHover(game.value)}
            onHoverOut={() => onHover(null)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`${game.label}, ${game.coins} coins`}
            style={({ hovered }) => [
                styles.tile,
                { width },
                selected && styles.tileSelected,
                hovered && !disabled && !selected && styles.tileHovered,
                disabled && styles.tileDisabled,
            ]}
        >
            <View style={[styles.tileArt, { height: artHeight, backgroundColor: suitColors[art.suit].panel }]}>
                <Image
                    source={rankDesign[art.rank].art[art.suit]}
                    contentFit="cover"
                    contentPosition={art.position}
                    style={StyleSheet.absoluteFill}
                />
                {disabled ? <View style={styles.tileArtFade} /> : null}
                <View style={styles.tileCoin}>
                    <CoinBadge value={game.coins} dimmed={disabled} />
                </View>
            </View>
            <View style={styles.tileText}>
                <Text style={[styles.tileTitle, disabled && styles.dimText]} numberOfLines={1}>
                    {game.label}
                </Text>
                <Text style={[styles.tileBlurb, disabled && styles.dimText]} numberOfLines={2}>
                    {reason ?? tileBlurbs[game.value]}
                </Text>
            </View>
        </Pressable>
    );
}

function SuitChip({ suit, selected, disabled, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`${suitNamesEn[suit]}`}
            style={({ hovered }) => [
                styles.chip,
                selected && styles.chipSelected,
                hovered && !selected && !disabled && styles.tileHovered,
                disabled && styles.tileDisabled,
            ]}
        >
            <Svg width={24} height={24} viewBox="0 0 40 40">
                <SuitIcon suit={suit} x={20} y={20} size={36} />
            </Svg>
            <Text style={[styles.chipLabel, disabled && styles.dimText]}>{suitNamesEn[suit]}</Text>
        </Pressable>
    );
}

// A yes/no question in the style of the game panel (used for the marriage:
// offering one, or accepting someone else's).
export function ChoicePrompt({ heading, text, noLabel, yesLabel, onNo, onYes }) {
    return (
        <View style={[styles.panel, styles.promptPanel]}>
            <DottedPaper />
            <View style={styles.content}>
                <Text style={styles.heading}>{heading}</Text>
                <Text style={styles.subheading}>{text}</Text>
                <View style={styles.actions}>
                    <Pressable
                        onPress={onNo}
                        accessibilityRole="button"
                        accessibilityLabel={noLabel}
                        style={({ hovered, pressed }) => [styles.passButton, (hovered || pressed) && styles.tileHovered]}
                    >
                        <Text style={styles.passLabel}>{noLabel}</Text>
                    </Pressable>
                    <Pressable
                        onPress={onYes}
                        accessibilityRole="button"
                        accessibilityLabel={yesLabel}
                        style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmPressed]}
                    >
                        <Text style={styles.confirmLabel}>{yesLabel}</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

// declined: games tried and turned down this round, e.g. { Marriage: "Nobody accepted your marriage" }.
function GamePicker({ width, maxHeight, hand, onPick, onPass, onPreview, declined = null }) {
    const [selected, setSelected] = useState(null);
    const [hovered, setHovered] = useState(null);
    const [soloSuit, setSoloSuit] = useState("heart");
    const [sheepSuit, setSheepSuit] = useState(null);

    const games = gameTypes.filter((game) => game.announceable !== false);
    const callable = sheepSuits.filter((suit) => canCallAce(suit, hand));

    // A game turned down this round (e.g. a marriage nobody accepted) can't stay selected.
    useEffect(() => {
        if (selected && declined?.[selected]) setSelected(null);
    }, [declined, selected]);

    // Fresh choice after every deal.
    useEffect(() => {
        setSelected(null);
        setSheepSuit(null);
    }, [hand.length]);

    // Show the hovered game's trumps in your hand, otherwise the selected one's.
    const withSuit = (value) => (value === "Solo" ? `Solo:${soloSuit}` : value);
    const preview = hovered ?? selected;
    useEffect(() => {
        onPreview(preview ? withSuit(preview) : null);
    }, [preview, soloSuit]); // eslint-disable-line react-hooks/exhaustive-deps

    const isPortrait = width < 560;
    const columns = isPortrait ? 2 : 4;
    const gap = 10;
    // Inner width: minus the panel's border (2 x 2.5) and padding (2 x 18).
    const tileWidth = Math.floor((width - 5 - 2 * 18 - gap * (columns - 1)) / columns);
    // Short screens (small phones): no subtitle, shorter picture strips.
    // The full panel with the Solo row open is about 655 high.
    const tight = maxHeight < 660;
    // Phones: tall picture strips, as in the mockup.
    const artHeight = tight ? 64 : isPortrait ? 92 : 72;

    const selectedGame = games.find((g) => g.value === selected);
    const needsSheep = selected === "Sau Spiel";
    const canConfirm = Boolean(selected) && (!needsSheep || Boolean(sheepSuit));
    const confirmLabel = !selectedGame
        ? "Choose a game"
        : needsSheep
            ? sheepSuit
                ? `Call the ${suitNamesEn[sheepSuit]} sheep`
                : "Choose a sheep"
            : `Play ${selected === "Solo" ? "Solo" : selectedGame.label}`;
    const confirmSuit = selected === "Solo" ? soloSuit : needsSheep ? sheepSuit : null;

    const confirm = () => {
        if (!canConfirm) return;
        onPick(withSuit(selected), needsSheep ? sheepSuit : null);
    };

    return (
        <View style={[styles.panel, { width, maxHeight }]}>
            <DottedPaper />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.heading, tight && styles.headingTight]}>What will you play?</Text>
                {tight ? null : <Text style={styles.subheading}>Choose a game for this round, or pass.</Text>}

                <View style={[styles.tiles, { gap }]}>
                    {games.map((game) => (
                        <GameTile
                            key={game.value}
                            game={game}
                            width={tileWidth}
                            artHeight={artHeight}
                            selected={selected === game.value}
                            reason={declined?.[game.value] ?? getUnavailableReason(game, hand)}
                            onSelect={() => setSelected(game.value)}
                            onHover={setHovered}
                        />
                    ))}
                </View>

                {selected === "Solo" ? (
                    <>
                        <Text style={styles.rowLabel}>Solo · choose your trump suit</Text>
                        <View style={styles.chips}>
                            {soloSuits.map((suit) => (
                                <SuitChip key={suit} suit={suit} selected={soloSuit === suit} onPress={() => setSoloSuit(suit)} />
                            ))}
                        </View>
                    </>
                ) : null}

                {needsSheep ? (
                    <>
                        <Text style={styles.rowLabel}>Sheep Game · call a sheep</Text>
                        <View style={styles.chips}>
                            {sheepSuits.map((suit) => (
                                <SuitChip
                                    key={suit}
                                    suit={suit}
                                    selected={sheepSuit === suit}
                                    disabled={!callable.includes(suit)}
                                    onPress={() => setSheepSuit(suit)}
                                />
                            ))}
                        </View>
                    </>
                ) : null}

                <View style={styles.actions}>
                    <Pressable
                        onPress={onPass}
                        accessibilityRole="button"
                        accessibilityLabel="Pass"
                        style={({ hovered: h, pressed }) => [styles.passButton, (h || pressed) && styles.tileHovered]}
                    >
                        <Text style={styles.passLabel}>Pass</Text>
                    </Pressable>
                    <Pressable
                        onPress={confirm}
                        disabled={!canConfirm}
                        accessibilityRole="button"
                        accessibilityLabel={confirmLabel}
                        style={({ pressed }) => [styles.confirmButton, !canConfirm && styles.confirmDisabled, pressed && styles.confirmPressed]}
                    >
                        <Text style={styles.confirmLabel} numberOfLines={1}>
                            {confirmLabel}
                        </Text>
                        {confirmSuit && canConfirm ? (
                            <Svg width={20} height={20} viewBox="0 0 40 40">
                                <SuitIcon suit={confirmSuit} x={20} y={20} size={34} />
                            </Svg>
                        ) : null}
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        backgroundColor: colors.paper,
        borderRadius: 22,
        borderWidth: 2.5,
        borderColor: colors.ink,
        overflow: "hidden",
        alignSelf: "center",
        ...softShadow,
    },
    promptPanel: {
        width: "100%",
        maxWidth: 420,
    },
    content: {
        padding: 18,
        gap: 10,
    },
    heading: {
        fontFamily: fonts.hand,
        fontSize: 40,
        lineHeight: 44,
        color: colors.ink,
    },
    headingTight: {
        fontSize: 32,
        lineHeight: 36,
    },
    subheading: {
        marginTop: -6,
        fontFamily: fonts.body,
        fontSize: 16,
        lineHeight: 20,
        color: colors.inkSoft,
    },
    tiles: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 4,
    },
    tile: {
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: colors.ink,
        overflow: "hidden",
    },
    tileSelected: {
        borderWidth: 4,
        borderColor: colors.hay,
        transform: [{ translateY: -2 }],
        ...softShadow,
    },
    tileHovered: {
        borderColor: colors.hayDeep,
    },
    tileDisabled: {
        borderColor: "#a19a8f",
    },
    tileArt: {
        overflow: "hidden",
        borderBottomWidth: 2.5,
        borderBottomColor: colors.ink,
    },
    tileArtFade: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#d9d6cf",
        opacity: 0.82,
    },
    tileCoin: {
        position: "absolute",
        top: 8,
        right: 8,
    },
    tileText: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 2,
    },
    tileTitle: {
        fontFamily: fonts.title,
        fontSize: 20,
        color: colors.ink,
    },
    tileBlurb: {
        fontFamily: fonts.body,
        fontSize: 14,
        lineHeight: 17,
        color: colors.inkSoft,
    },
    dimText: {
        color: "#a19a8f",
    },
    coinBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingLeft: 4,
        paddingRight: 9,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: "#ffffff",
        borderWidth: 2,
        borderColor: colors.ink,
    },
    coinBadgeDimmed: {
        borderColor: "#a19a8f",
    },
    coin: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.hay,
        borderWidth: 1.5,
        borderColor: colors.hayDeep,
    },
    coinDimmed: {
        backgroundColor: "#d9d6cf",
        borderColor: "#a19a8f",
    },
    coinInner: {
        borderWidth: 1.5,
        borderColor: "rgba(31, 28, 25, 0.35)",
    },
    coinText: {
        fontFamily: fonts.number,
        color: colors.ink,
    },
    rowLabel: {
        marginTop: 6,
        fontFamily: fonts.bodyBold,
        fontSize: 13,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: colors.inkSoft,
    },
    chips: {
        flexDirection: "row",
        gap: 8,
    },
    chip: {
        flex: 1,
        alignItems: "center",
        gap: 2,
        paddingVertical: 8,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 2.5,
        borderColor: colors.ink,
    },
    chipSelected: {
        borderWidth: 4,
        borderColor: colors.hay,
        backgroundColor: colors.hayLight,
    },
    chipLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 15,
        color: colors.ink,
    },
    actions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 6,
    },
    passButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 13,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: colors.ink,
    },
    passLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 19,
        color: colors.ink,
    },
    confirmButton: {
        flex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 13,
        backgroundColor: colors.ink,
        borderRadius: 14,
        // The gold underline from the mockup.
        borderBottomWidth: 4,
        borderBottomColor: colors.hay,
    },
    confirmDisabled: {
        opacity: 0.4,
    },
    confirmPressed: {
        transform: [{ translateY: 1 }],
    },
    confirmLabel: {
        flexShrink: 1,
        fontFamily: fonts.bodyBold,
        fontSize: 19,
        color: "#ffffff",
    },
});

export default GamePicker;
