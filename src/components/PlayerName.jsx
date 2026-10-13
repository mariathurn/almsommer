/* Paper name tag: player name, their role in this game, and an optional
hay-gold badge (the caller's game, or "Friend" once the partner is revealed). */

import { StyleSheet, Text, View } from "react-native";
import { getGameType } from "../data/gameTypes";
import { colors, fonts, paper } from "../theme";

function PlayerName({
    name,
    gameType = null,
    status = null,
    showFriendBadge = false,
    isCurrentTurn = false,
    style,
}) {
    const badgeLabel = showFriendBadge ? "Friend" : getGameType(gameType)?.label ?? gameType;

    return (
        <View style={[styles.tag, isCurrentTurn && styles.tagActive, style]}>
            <Text style={styles.name} numberOfLines={1}>
                {name}
            </Text>
            {status ? (
                <Text style={styles.status} numberOfLines={1}>
                    {status}
                </Text>
            ) : null}
            {badgeLabel ? <Text style={styles.badge}>{badgeLabel}</Text> : null}
        </View>
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
