/* The last trick, to look at again: an eye button right of the banner
(greyed out until the first trick is taken) and a panel with the four
cards, who played which, and who took it. */

import { StyleSheet, Text, View, Pressable } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import Card from "./Card";
import { PanelButton, PaperPanel } from "./SettingsPanel";
import { getTrickPoints } from "../ai/scoring";
import { t } from "../i18n";
import { colors, fonts, paper } from "../theme";

// size: the button's height (phones: the hamburger's size).
export function LastTrickButton({ onPress, disabled = false, size = 40 }) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            accessibilityLabel={t("lastTrick.show")}
            hitSlop={8}
            style={({ hovered, pressed }) => [
                styles.eye,
                { width: size, height: size },
                disabled && styles.eyeDisabled,
                !disabled && (hovered || pressed) && styles.eyeActive,
            ]}
        >
            <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
                <Path
                    d="M2 12 C5 6.5 8.5 4.5 12 4.5 C15.5 4.5 19 6.5 22 12 C19 17.5 15.5 19.5 12 19.5 C8.5 19.5 5 17.5 2 12 Z"
                    fill="#ffffff"
                    stroke={colors.ink}
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <Circle cx={12} cy={12} r={3.6} fill={colors.ink} />
            </Svg>
        </Pressable>
    );
}

// trick: { cards: [{ player, card }], winner }; playerName: seat -> name.
export function LastTrickPanel({ trick, playerName, trumpGame, onClose }) {
    const points = getTrickPoints(trick.cards);

    return (
        <PaperPanel heading={t("lastTrick.heading")} onClose={onClose} closeLabel={t("common.close")} maxWidth={520}>
            <View style={styles.cards}>
                {trick.cards.map(({ player, card }) => {
                    const won = player === trick.winner;
                    return (
                        <View key={player} style={styles.slot}>
                            <View style={[styles.cardFrame, won && styles.cardFrameWon]}>
                                <Card card={card} faceUp gameName={trumpGame} height={112} />
                            </View>
                            <Text style={[styles.name, won && styles.nameWon]} numberOfLines={1}>
                                {playerName(player)}
                            </Text>
                        </View>
                    );
                })}
            </View>
            <Text style={styles.summary}>{t("lastTrick.summary", { name: playerName(trick.winner), points })}</Text>
            <PanelButton label={t("common.close")} onPress={onClose} />
        </PaperPanel>
    );
}

const styles = StyleSheet.create({
    eye: {
        ...paper,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    eyeDisabled: {
        opacity: 0.4,
    },
    eyeActive: {
        transform: [{ scale: 1.08 }],
    },
    cards: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    slot: {
        alignItems: "center",
        gap: 6,
    },
    // The card that took the trick gets a gold frame.
    cardFrame: {
        padding: 3,
        borderRadius: 10,
    },
    cardFrameWon: {
        backgroundColor: colors.hay,
    },
    name: {
        maxWidth: 80,
        fontFamily: fonts.body,
        fontSize: 15,
        color: colors.inkSoft,
    },
    nameWon: {
        fontFamily: fonts.bodyBold,
        color: colors.ink,
    },
    summary: {
        fontFamily: fonts.bodyBold,
        fontSize: 17,
        textAlign: "center",
        color: colors.ink,
    },
});
