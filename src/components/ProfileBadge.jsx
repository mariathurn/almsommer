/* Your profile at the top left of the start menu: your portrait and a torn
paper tag with your name and savings. Tapping it opens the profile panel. */

import { Pressable, StyleSheet, Text, View } from "react-native";
import { CoinIcon } from "./Coin";
import Portrait from "./Portrait";
import { TornPaper } from "./TornPaper";
import { portraits } from "../data/portraits";
import { formatSavings, useProfile } from "../data/profile";
import { t } from "../i18n";
import { colors, fonts } from "../theme";

// compact: smaller, and the savings without the word "saved" (phones).
function ProfileBadge({ onPress, compact = false }) {
    const { name, portrait: portraitId, savings } = useProfile();
    const portrait = portraits.find((p) => p.id === portraitId);
    const size = compact ? 58 : 72;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={t("profile.badgeLabel", { name, amount: formatSavings(savings) })}
            style={({ hovered, pressed }) => [styles.badge, hovered && styles.hovered, pressed && styles.pressed]}
        >
            <View style={styles.ring}>
                <Portrait portrait={portrait} size={size} />
            </View>
            <TornPaper seed={`badge-${name}`} depth={3} style={[styles.tag, compact && styles.tagCompact]}>
                <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
                    {name}
                </Text>
                <View style={styles.savings}>
                    <CoinIcon size={compact ? 13 : 15} />
                    <Text style={[styles.savingsText, compact && styles.savingsTextCompact]}>
                        {compact ? formatSavings(savings) : t("profile.saved", { amount: formatSavings(savings) })}
                    </Text>
                </View>
            </TornPaper>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    hovered: {
        transform: [{ scale: 1.03 }],
    },
    pressed: {
        transform: [{ scale: 0.98 }],
    },
    // A thin dark ring around the portrait.
    ring: {
        padding: 2,
        borderRadius: 999,
        backgroundColor: colors.ink,
    },
    tag: {
        minWidth: 140,
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 8,
    },
    tagCompact: {
        minWidth: 110,
        paddingHorizontal: 12,
        paddingTop: 4,
        paddingBottom: 6,
    },
    name: {
        fontFamily: fonts.hand,
        fontSize: 26,
        lineHeight: 30,
        color: colors.ink,
    },
    nameCompact: {
        fontSize: 22,
        lineHeight: 26,
    },
    savings: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    savingsText: {
        fontFamily: fonts.hand,
        fontSize: 17,
        color: colors.ink,
    },
    savingsTextCompact: {
        fontSize: 15,
    },
});

export default ProfileBadge;
