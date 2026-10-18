/* Paper name tag: player name, their role in this game, and an optional
hay-gold badge (the caller's game, or "Friend" once the partner is revealed). */

import { StyleSheet, Text, View } from "react-native";
import WinnerGlow from "./WinnerGlow";
import { t } from "../i18n";
import { gameName, statusName } from "../i18n/names";
import { colors, fonts, paper } from "../theme";

// Session balance: "+15", "−10" (with a real minus sign) or "0".
export function formatCoins(value) {
    if (value > 0) return `+${value}`;
    if (value < 0) return `\u2212${Math.abs(value)}`;
    return "0";
}

function PlayerName({
    name,
    gameType = null,
    status = null,
    showFriendBadge = false,
    isCurrentTurn = false,
    isTrickWinner = false,
    score = null,
    style,
}) {
    const badgeLabel = showFriendBadge ? statusName("Friend") : gameType ? gameName(gameType) : null;

    return (
        <WinnerGlow active={isTrickWinner} radius={10} spread={4} scaleTo={1.08}>
            <View style={[styles.tag, isCurrentTurn && styles.tagActive, isTrickWinner && styles.tagWinner, style]}>
                <Text style={styles.name} numberOfLines={1}>
                    {name}
                </Text>
                {status ? (
                    <Text style={styles.status} numberOfLines={1}>
                        {statusName(status)}
                    </Text>
                ) : null}
                {badgeLabel ? <Text style={styles.badge}>{badgeLabel}</Text> : null}
                {score === null ? null : (
                    <Text
                        style={[styles.score, score > 0 && styles.scoreUp, score < 0 && styles.scoreDown]}
                        accessibilityLabel={t("coins.session", { count: score })}
                    >
                        {formatCoins(score)}
                    </Text>
                )}
            </View>
        </WinnerGlow>
    );
}

const styles = StyleSheet.create({
    tag: {
        ...paper,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        paddingVertical: 3,
        paddingHorizontal: 10,
    },
    score: {
        overflow: "hidden",
        borderRadius: 999,
        minWidth: 26,
        paddingHorizontal: 7,
        paddingVertical: 1,
        textAlign: "center",
        backgroundColor: colors.paperDeep,
        borderWidth: 1,
        borderColor: colors.keyline,
        fontFamily: fonts.number,
        fontSize: 12,
        color: colors.inkSoft,
    },
    scoreUp: {
        backgroundColor: "#e3eed7",
        borderColor: colors.weide,
        color: "#3d5a2a",
    },
    scoreDown: {
        backgroundColor: "#f6dfe0",
        borderColor: colors.alpenrose,
        color: "#8a2e37",
    },
    tagWinner: {
        backgroundColor: colors.hayLight,
        borderColor: colors.hayDeep,
        borderWidth: 2,
    },
    tagActive: {
        borderColor: colors.hay,
        borderWidth: 2,
    },
    name: {
        fontFamily: fonts.title,
        fontSize: 15,
        color: colors.ink,
    },
    status: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.inkSoft,
    },
    badge: {
        overflow: "hidden",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 1,
        backgroundColor: colors.hayLight,
        borderWidth: 1,
        borderColor: colors.hay,
        fontFamily: fonts.bodyBold,
        fontSize: 12,
        color: colors.ink,
    },
});

export default PlayerName;
