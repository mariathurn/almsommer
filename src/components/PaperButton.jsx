/* Linen-paper button with a thin keyline. "primary" fills it with hay gold. */

import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, paper } from "../theme";

function PaperButton({ label, onPress, primary = false, compact = false, style, accessibilityLabel }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed, hovered }) => [
                styles.button,
                compact && styles.compact,
                primary && styles.primary,
                hovered && styles.hovered,
                pressed && styles.pressed,
                style,
            ]}
        >
            <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        ...paper,
        borderRadius: 12,
        paddingVertical: 9,
        paddingHorizontal: 18,
        alignItems: "center",
    },
    compact: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    primary: {
        backgroundColor: colors.hay,
        borderColor: colors.hayDeep,
    },
    hovered: {
        borderColor: colors.hay,
    },
    pressed: {
        transform: [{ translateY: 1 }],
        shadowOpacity: 0.1,
        elevation: 1,
    },
    label: {
        fontFamily: fonts.bodyBold,
        fontSize: 16,
        letterSpacing: 0.6,
        color: colors.ink,
    },
    labelCompact: {
        fontSize: 14,
    },
});

export default PaperButton;
