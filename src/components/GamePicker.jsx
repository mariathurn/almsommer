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
import Svg, { Circle, Defs, Line, Pattern, Rect } from "react-native-svg";
import { SuitIcon } from "./IllustratedCard";
import { TOUT_GAMES, canCallAce, withTout } from "../ai/schafkopfAI";
import { rankDesign, suitColors } from "../data/cardDesign";
import { gameTypes } from "../data/gameTypes";
import { t } from "../i18n";
import { gameName, getUnavailableReason, suitName } from "../i18n/names";
import { colors, fillParent, fonts, softShadow } from "../theme";

// Picture strip for each tile: a card illustration, its panel colour, and
// which part of the picture to show.
const tileArt = {
    "Sau Spiel": { rank: "A", suit: "leaf", position: { top: "12%", left: "50%" } },
    Solo: { rank: "O", suit: "acorn", position: "top" },
    Wenz: { rank: "U", suit: "heart", position: { top: "20%", left: "50%" } },
    Marriage: { rank: "9", suit: "bell", position: "center" },
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

function GameTile({ game, width, artHeight, selected, reason, onSelect, onHover, compact = false }) {
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
            accessibilityLabel={t("picker.tileLabel", { game: gameName(game.value), coins: game.coins })}
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
            <View style={[styles.tileText, compact && styles.tileTextCompact]}>
                <Text style={[styles.tileTitle, disabled && styles.dimText]} numberOfLines={1}>
                    {gameName(game.value)}
                </Text>
                <Text style={[styles.tileBlurb, compact && styles.tileBlurbCompact, disabled && styles.dimText]} numberOfLines={2}>
                    {reason ?? t(`game.blurb.${game.value}`)}
                </Text>
            </View>
        </Pressable>
    );
}

// compact (phones): symbol and name side by side, so the row is lower.
function SuitChip({ suit, selected, disabled, onPress, compact = false }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={suitName(suit)}
            style={({ hovered }) => [
                styles.chip,
                compact && styles.chipCompact,
                selected && styles.chipSelected,
                hovered && !selected && !disabled && styles.tileHovered,
                disabled && styles.tileDisabled,
            ]}
        >
            <Svg width={compact ? 18 : 24} height={compact ? 18 : 24} viewBox="0 0 40 40" style={disabled && styles.dimIcon}>
                <SuitIcon suit={suit} x={20} y={20} size={36} />
            </Svg>
            <Text style={[styles.chipLabel, disabled && styles.dimText]}>{suitName(suit)}</Text>
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

// A Solo or Dog Game can be announced as a Tout: every trick for double the value.
// "Tout · ×2: take every trick …" as one running text, bold up to the colon.
function ToutToggle({ on, locked, onPress, compact = false }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={locked}
            accessibilityRole="switch"
            accessibilityState={{ checked: on, disabled: locked }}
            accessibilityLabel={`${t("picker.tout")}: ${t("picker.toutHint")}`}
            style={({ hovered }) => [
                styles.toutToggle,
                compact && styles.toutToggleCompact,
                on && styles.chipSelected,
                hovered && !on && styles.tileHovered,
            ]}
        >
            <View style={[styles.toutBox, on && styles.toutBoxOn]}>{on ? <Text style={styles.toutCheck}>✓</Text> : null}</View>
            <View style={styles.toutText}>
                <Text style={styles.toutHint}>
                    <Text style={styles.toutLabel}>{t("picker.tout")} · ×2: </Text>
                    {t("picker.toutHint")}
                </Text>
            </View>
        </Pressable>
    );
}

// Round button with an X, top right: closes the panel (the "choose game"
// button on the table opens it again).
function CloseButton({ onPress }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            hitSlop={8}
            style={({ hovered, pressed }) => [styles.closeButton, (hovered || pressed) && styles.tileHovered]}
        >
            <Svg width={14} height={14} viewBox="0 0 14 14">
                <Line x1={2} y1={2} x2={12} y2={12} stroke={colors.ink} strokeWidth={2.6} strokeLinecap="round" />
                <Line x1={12} y1={2} x2={2} y2={12} stroke={colors.ink} strokeWidth={2.6} strokeLinecap="round" />
            </Svg>
        </Pressable>
    );
}

// declined: games tried and turned down this round, e.g. { Marriage: "Nobody accepted your marriage" }.
// toutOnly: games that only a Tout can still announce (someone announced something stronger).
// allowedSheep / canPass: the guided first game only lets you call one sheep, and not pass.
function GamePicker({
    width,
    maxHeight,
    hand,
    onPick,
    onPass,
    onPreview,
    onClose,
    declined = null,
    toutOnly = [],
    allowedSheep = null,
    canPass = true,
}) {
    const [selected, setSelected] = useState(null);
    const [hovered, setHovered] = useState(null);
    const [soloSuit, setSoloSuit] = useState("heart");
    const [sheepSuit, setSheepSuit] = useState(null);
    const [toutChosen, setToutChosen] = useState(false);

    const games = gameTypes.filter((game) => game.announceable !== false);
    const callable = sheepSuits.filter((suit) => canCallAce(suit, hand) && (!allowedSheep || allowedSheep.includes(suit)));

    // A game turned down this round (e.g. a marriage nobody accepted) can't stay selected.
    useEffect(() => {
        if (selected && declined?.[selected]) setSelected(null);
    }, [declined, selected]);

    // Fresh choice after every deal.
    useEffect(() => {
        setSelected(null);
        setSheepSuit(null);
        setToutChosen(false);
    }, [hand.length]);

    // Tout: offered for Solo and Dog Game, forced on when nothing less would do.
    const canTout = TOUT_GAMES.includes(selected);
    const toutLocked = canTout && toutOnly.includes(selected);
    const tout = canTout && (toutChosen || toutLocked);

    // Show the hovered game's trumps in your hand, otherwise the selected one's.
    const withSuit = (value) => {
        const game = value === "Solo" ? `Solo:${soloSuit}` : value;
        return value === selected && tout ? withTout(game) : game;
    };
    const preview = hovered ?? selected;
    useEffect(() => {
        onPreview(preview ? withSuit(preview) : null);
    }, [preview, soloSuit, tout]); // eslint-disable-line react-hooks/exhaustive-deps

    const isPortrait = width < 560;
    // Phones: everything a little lower, so the panel fits without scrolling.
    const compact = isPortrait;
    const columns = isPortrait ? 2 : 4;
    const gap = 10;
    // Inner width: minus the panel's border (2 x 2.5) and padding (2 x 18).
    const tileWidth = Math.floor((width - 5 - 2 * 18 - gap * (columns - 1)) / columns);
    // Short screens (small phones): no subtitle, shorter picture strips.
    // The full panel with the Solo row open is about 655 high.
    const tight = maxHeight < 660;
    const artHeight = compact ? 46 : tight ? 64 : 72;

    const selectedGame = games.find((g) => g.value === selected);
    const needsSheep = selected === "Sau Spiel";
    const canConfirm = Boolean(selected) && (!needsSheep || Boolean(sheepSuit));
    const confirmLabel = !selectedGame
        ? t("picker.chooseGame")
        : needsSheep
            ? sheepSuit
                ? t("picker.callSheep", { suit: sheepSuit })
                : t("picker.chooseSheep")
            : t("picker.play", { game: selected, tout });
    const confirmSuit = selected === "Solo" ? soloSuit : needsSheep ? sheepSuit : null;

    const confirm = () => {
        if (!canConfirm) return;
        onPick(withSuit(selected), needsSheep ? sheepSuit : null);
    };

    return (
        <View style={[styles.panel, { width, maxHeight }]}>
            <DottedPaper />
            <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
                <View style={styles.headingRow}>
                    <Text style={[styles.heading, (tight || compact) && styles.headingTight]}>{t("picker.heading")}</Text>
                    {onClose ? <CloseButton onPress={onClose} /> : null}
                </View>
                {tight || compact ? null : <Text style={styles.subheading}>{t("picker.subheading")}</Text>}

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
                            compact={compact}
                        />
                    ))}
                </View>

                {selected === "Solo" ? (
                    <>
                        <Text style={styles.rowLabel}>{t("picker.soloRow")}</Text>
                        <View style={styles.chips}>
                            {soloSuits.map((suit) => (
                                <SuitChip
                                    key={suit}
                                    suit={suit}
                                    selected={soloSuit === suit}
                                    onPress={() => setSoloSuit(suit)}
                                    compact={compact}
                                />
                            ))}
                        </View>
                    </>
                ) : null}

                {canTout ? (
                    <ToutToggle on={tout} locked={toutLocked} onPress={() => setToutChosen((on) => !on)} compact={compact} />
                ) : null}

                {needsSheep ? (
                    <>
                        <Text style={styles.rowLabel}>{t("picker.sheepRow")}</Text>
                        <View style={styles.chips}>
                            {sheepSuits.map((suit) => (
                                <SuitChip
                                    key={suit}
                                    suit={suit}
                                    selected={sheepSuit === suit}
                                    disabled={!callable.includes(suit)}
                                    onPress={() => setSheepSuit(suit)}
                                    compact={compact}
                                />
                            ))}
                        </View>
                    </>
                ) : null}

                <View style={styles.actions}>
                    {canPass ? (
                        <Pressable
                            onPress={onPass}
                            accessibilityRole="button"
                            accessibilityLabel={t("picker.pass")}
                            style={({ hovered: h, pressed }) => [
                                styles.passButton,
                                compact && styles.buttonCompact,
                                (h || pressed) && styles.tileHovered,
                            ]}
                        >
                            <Text style={styles.passLabel}>{t("picker.pass")}</Text>
                        </Pressable>
                    ) : null}
                    <Pressable
                        onPress={confirm}
                        disabled={!canConfirm}
                        accessibilityRole="button"
                        accessibilityLabel={confirmLabel}
                        style={({ pressed }) => [
                            styles.confirmButton,
                            compact && styles.buttonCompact,
                            !canConfirm && styles.confirmDisabled,
                            pressed && styles.confirmPressed,
                        ]}
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
    contentCompact: {
        padding: 14,
        gap: 8,
    },
    heading: {
        fontFamily: fonts.hand,
        fontSize: 40,
        lineHeight: 44,
        color: colors.ink,
    },
    headingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        borderWidth: 2.5,
        borderColor: colors.ink,
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
        ...fillParent,
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
    tileTextCompact: {
        paddingVertical: 6,
        gap: 1,
    },
    tileBlurbCompact: {
        fontSize: 13,
        lineHeight: 16,
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
    // The suit symbol of a suit that can't be chosen, faded like its name.
    dimIcon: {
        opacity: 0.35,
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
    chipCompact: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 5,
        paddingVertical: 7,
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
    toutToggle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 2.5,
        borderColor: colors.ink,
    },
    toutToggleCompact: {
        paddingVertical: 6,
    },
    toutBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2.5,
        borderColor: colors.ink,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
    },
    toutBoxOn: {
        backgroundColor: colors.ink,
    },
    toutCheck: {
        fontFamily: fonts.bodyBold,
        fontSize: 15,
        lineHeight: 18,
        color: "#ffffff",
    },
    toutText: {
        flex: 1,
        gap: 1,
    },
    toutHint: {
        fontFamily: fonts.body,
        fontSize: 14,
        lineHeight: 18,
        color: colors.inkSoft,
    },
    toutLabel: {
        fontFamily: fonts.bodyBold,
        color: colors.ink,
    },
    buttonCompact: {
        paddingVertical: 10,
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
