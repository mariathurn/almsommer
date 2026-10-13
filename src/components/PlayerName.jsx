import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

function PlayerName({
    name,
    gameType = null,
    status = "Non-Player",
    showFriendBadge = false,
    isCurrentTurn = false,
    style,
}) {
    const showGameTypeOrFriend = gameType || showFriendBadge;
    const badgeLabel = showFriendBadge ? "Friend" : gameType;

    return (
        <View style={[styles.row, style]}>
            <Text style={[styles.name, isCurrentTurn && styles.nameActive]} numberOfLines={1}>
                {name}
            </Text>
            <Text style={styles.divider}>|</Text>
            <Text style={styles.pill}>{status}</Text>
            {showGameTypeOrFriend ? (
                <>
                    <Text style={styles.divider}>|</Text>
                    <Text style={[styles.pill, styles.badge]}>{badgeLabel}</Text>
                </>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 5,
    },
    name: {
        fontSize: 13,
        fontWeight: "900",
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.text,
    },
    nameActive: {
        color: colors.goldText,
    },
    divider: {
        color: colors.goldSoft,
        fontSize: 11,
        fontWeight: "700",
    },
    pill: {
        paddingVertical: 2,
        paddingHorizontal: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(251, 191, 36, 0.75)",
        backgroundColor: colors.pill,
        overflow: "hidden",
        fontSize: 10,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        fontWeight: "700",
        color: colors.text,
    },
    badge: {
        backgroundColor: colors.badge,
        borderColor: colors.badgeBorder,
        color: colors.badgeText,
    },
});

export default PlayerName;
