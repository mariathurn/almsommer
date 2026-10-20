/* The basic rules, a few pages to leaf through: shown on the very first
start (then on to the guided first game) and from the Practice page.
Each page has a title, a short text and a row of example cards. Texts that
name the cards have a version for the classic deck (see t() in i18n). Large
text and cards, so everyone can read them. */

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import Card from "../components/Card";
import { richText } from "../components/CoachBubble";
import { PanelButton } from "../components/SettingsPanel";
import SceneBackground from "../components/SceneBackground";
import { useStage } from "../components/Stage";
import { useCardDeck } from "../data/cardDecks";
import { t } from "../i18n";
import { CARD_RATIO, cardShadow, colors, fonts, softShadow } from "../theme";

const card = (id) => {
    const [suit, rank] = id.split("-");
    return { id, suit, rank };
};

// Example cards per page; `trump` cards get the gold trump frame. `stack`
// lists them from bottom to top when they overlap (otherwise left to right).
const pages = [
    { cards: ["acorn-O", "leaf-O", "heart-O", "bell-O"] },
    { cards: ["acorn-A", "leaf-A", "heart-A", "bell-A"] },
    {
        cards: ["acorn-O", "acorn-U", "acorn-A", "acorn-10", "acorn-K", "acorn-9"],
        stack: ["acorn-9", "acorn-K", "acorn-10", "acorn-A", "acorn-U", "acorn-O"],
    },
    { cards: ["acorn-O", "bell-O", "leaf-U", "heart-A", "heart-9"], trump: true },
    { cards: ["bell-10", "bell-A", "bell-K", "heart-9"] },
    { cards: ["leaf-K", "leaf-10", "leaf-9"] },
    // Kontra: a hand strong enough to think the caller will lose.
    { cards: ["acorn-O", "leaf-O", "bell-U", "heart-A"], trump: true },
    { cards: ["acorn-A", "leaf-A", "bell-A"] },
];

// Cards as large as possible in the row: side by side when they fit,
// otherwise overlapping like a hand (at least `SHOWN` of each card visible).
const SHOWN = 0.5;
function cardLayout(count, rowWidth, maxHeight) {
    const maxWidth = maxHeight * CARD_RATIO;
    const sideBySide = (rowWidth - 8 * (count - 1)) / count;
    if (sideBySide >= maxWidth * 0.8) {
        const width = Math.min(maxWidth, sideBySide);
        return { height: width / CARD_RATIO, overlap: -8 };
    }
    const width = Math.min(maxWidth, rowWidth / (1 + SHOWN * (count - 1)));
    const step = Math.min(width + 8, (rowWidth - width) / (count - 1));
    return { height: width / CARD_RATIO, overlap: width - step };
}

// first: shown on the first start (the last button starts the guided game).
// onDone(skipped): skipped is true when "Skip" was used.
function RulesScreen({ onDone, first = false }) {
    const { width, isPortrait } = useStage();
    // Re-render with the classic texts when the deck changes.
    useCardDeck();
    const [index, setIndex] = useState(0);
    const page = pages[index];
    const last = index === pages.length - 1;
    const panelWidth = Math.min(width - 32, 760);
    const { height: cardHeight, overlap } = cardLayout(page.cards.length, panelWidth - 44, isPortrait ? 170 : 210);
    const n = index + 1;

    return (
        <View style={styles.shell}>
            <SceneBackground />
            <View style={styles.slot}>
                <View style={[styles.panel, { width: panelWidth }]}>
                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Defs>
                            <Pattern id="rules-dots" width={14} height={14} patternUnits="userSpaceOnUse">
                                <Circle cx={7} cy={7} r={1.3} fill={colors.ink} opacity={0.09} />
                            </Pattern>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#rules-dots)" />
                    </Svg>

                    <View style={styles.top}>
                        <Text style={styles.kicker}>{t("rules.heading")}</Text>
                        {last ? null : (
                            <Pressable onPress={() => onDone(true)} accessibilityRole="button" accessibilityLabel={t("rules.skip")} hitSlop={8}>
                                <Text style={styles.skip}>{t("rules.skip")}</Text>
                            </Pressable>
                        )}
                    </View>
                    <Text style={styles.title}>{t(`rules.page${n}.title`)}</Text>

                    <View style={[styles.cards, { minHeight: cardHeight }]}>
                        {page.cards.map((id, i) => (
                            <View
                                key={id}
                                style={[styles.cardShadow, i > 0 && { marginLeft: -overlap }, page.stack && { zIndex: page.stack.indexOf(id) }]}
                            >
                                <Card card={card(id)} faceUp isTrump={page.trump} height={cardHeight} />
                            </View>
                        ))}
                    </View>

                    <Text style={[styles.text, !isPortrait && styles.textWide]}>{richText(t(`rules.page${n}.text`))}</Text>

                    <View style={styles.dots}>
                        {pages.map((_, i) => (
                            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
                        ))}
                    </View>

                    <View style={styles.buttons}>
                        {index > 0 ? (
                            <PanelButton label={t("rules.back")} variant="secondary" onPress={() => setIndex(index - 1)} style={styles.button} />
                        ) : null}
                        <PanelButton
                            label={last ? t(first ? "rules.start" : "rules.done") : t("rules.next")}
                            onPress={() => (last ? onDone(false) : setIndex(index + 1))}
                            style={styles.button}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        flex: 1,
        overflow: "hidden",
    },
    slot: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    panel: {
        padding: 22,
        gap: 14,
        backgroundColor: colors.paper,
        borderRadius: 22,
        borderWidth: 2.5,
        borderColor: colors.ink,
        overflow: "hidden",
        ...softShadow,
    },
    top: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    kicker: {
        fontFamily: fonts.bodyBold,
        fontSize: 16,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: colors.inkSoft,
    },
    skip: {
        fontFamily: fonts.bodyBold,
        fontSize: 18,
        color: colors.inkSoft,
        textDecorationLine: "underline",
    },
    title: {
        fontFamily: fonts.hand,
        fontSize: 40,
        lineHeight: 44,
        color: colors.ink,
    },
    cards: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    cardShadow: {
        ...cardShadow,
    },
    text: {
        fontFamily: fonts.body,
        fontSize: 22,
        lineHeight: 30,
        color: colors.ink,
    },
    textWide: {
        fontSize: 25,
        lineHeight: 34,
    },
    dots: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.keyline,
    },
    dotActive: {
        width: 22,
        backgroundColor: colors.ink,
    },
    buttons: {
        flexDirection: "row",
        gap: 10,
    },
    button: {
        flex: 1,
        marginTop: 0,
    },
});

export default RulesScreen;
