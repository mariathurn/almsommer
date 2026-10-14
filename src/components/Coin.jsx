/* The gold coin used for balances, and a dark pill with your balance. */

import { StyleSheet, Text, View } from "react-native";
import { formatCoins } from "./PlayerName";
import { colors, fonts } from "../theme";

export function CoinIcon({ size = 18 }) {
    return (
        <View style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}>
            <View style={[styles.coinInner, { width: size * 0.62, height: size * 0.62, borderRadius: size }]} />
        </View>
    );
}

// Your session balance, top right of the table.
export function CoinBalance({ value, compact = false }) {
    return (
        <View style={[styles.balance, compact && styles.balanceCompact]} accessibilityLabel={`${value} coins this session`}>
            <CoinIcon size={compact ? 20 : 24} />
            <Text style={[styles.balanceText, compact && styles.balanceTextCompact]}>{formatCoins(value)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    coin: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.hay,
        borderWidth: 1.5,
        borderColor: colors.hayDeep,
    },
    coinInner: {
        borderWidth: 1.5,
        borderColor: "rgba(31, 28, 25, 0.35)",
    },
    balance: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "flex-end",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: colors.ink,
    },
    balanceCompact: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 6,
        borderRadius: 14,
    },
    balanceText: {
        fontFamily: fonts.number,
        fontSize: 20,
        color: "#ffffff",
    },
    balanceTextCompact: {
        fontSize: 16,
    },
});
