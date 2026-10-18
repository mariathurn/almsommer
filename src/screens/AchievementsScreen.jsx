/* Achievements: a dotted paper panel listing every achievement from
src/data/achievements.js with its trophy, gold once earned (with the date),
pale while still locked. The heading counts how many you have. */

import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import PaperButton from "../components/PaperButton";
import SceneBackground from "../components/SceneBackground";
import Trophy from "../components/Trophy";
import { achievements } from "../data/achievements";
import { useUnlocked } from "../data/achievementStore";
import { getLanguage, t } from "../i18n";
import { colors, fonts, softShadow } from "../theme";

function Achievement({ id, unlockedAt }) {
    const unlocked = Boolean(unlockedAt);
    const date = unlocked
        ? new Date(unlockedAt).toLocaleDateString(getLanguage() === "de" ? "de-DE" : "en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : null;

    return (
        <View
            style={[styles.item, !unlocked && styles.itemLocked]}
            accessibilityLabel={`${t(`achievement.${id}.title`)}: ${t(`achievement.${id}.description`)}${
                unlocked ? "" : ` (${t("achievements.locked")})`
            }`}
        >
            <Trophy size={52} unlocked={unlocked} />
            <View style={styles.itemText}>
                <Text style={[styles.itemTitle, !unlocked && styles.textLocked]}>{t(`achievement.${id}.title`)}</Text>
                <Text style={styles.itemDescription}>{t(`achievement.${id}.description`)}</Text>
                {date ? <Text style={styles.itemDate}>{t("achievements.unlockedOn", { date })}</Text> : null}
            </View>
        </View>
    );
}

function AchievementsScreen({ onBack }) {
    const unlocked = useUnlocked();
    const earned = achievements.filter((item) => unlocked[item.id]).length;
    // Earned ones first, newest on top; then the locked ones in list order.
    const sorted = [...achievements].sort((a, b) => (unlocked[b.id] ?? 0) - (unlocked[a.id] ?? 0));

    return (
        <View style={styles.shell}>
            <SceneBackground />

            <View style={styles.header}>
                <PaperButton label={t("common.backToMenu")} compact onPress={onBack} />
            </View>

            <View style={styles.panelSlot}>
                <View style={styles.panel}>
                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Defs>
                            <Pattern id="achievements-dots" width={14} height={14} patternUnits="userSpaceOnUse">
                                <Circle cx={7} cy={7} r={1.3} fill={colors.ink} opacity={0.09} />
                            </Pattern>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#achievements-dots)" />
                    </Svg>
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.headingRow}>
                            <Text style={styles.heading}>{t("achievements.title")}</Text>
                            <Text style={styles.count}>
                                {t("achievements.count", { earned, total: achievements.length })}
                            </Text>
                        </View>
                        {sorted.map((item) => (
                            <Achievement key={item.id} id={item.id} unlockedAt={unlocked[item.id]} />
                        ))}
                    </ScrollView>
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
    header: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    panelSlot: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 20,
        alignItems: "center",
    },
    panel: {
        flex: 1,
        width: "100%",
        maxWidth: 640,
        backgroundColor: colors.paper,
        borderRadius: 22,
        borderWidth: 2.5,
        borderColor: colors.ink,
        overflow: "hidden",
        ...softShadow,
    },
    content: {
        padding: 20,
        gap: 12,
    },
    heading: {
        fontFamily: fonts.hand,
        fontSize: 44,
        lineHeight: 48,
        color: colors.ink,
    },
    headingRow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
    },
    count: {
        fontFamily: fonts.number,
        fontSize: 18,
        color: colors.ink,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 12,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: colors.hay,
    },
    itemLocked: {
        borderColor: colors.keyline,
    },
    itemText: {
        flex: 1,
        gap: 2,
    },
    itemTitle: {
        fontFamily: fonts.bodyBold,
        fontSize: 18,
        color: colors.ink,
    },
    textLocked: {
        color: colors.inkSoft,
    },
    itemDate: {
        marginTop: 2,
        fontFamily: fonts.bodyBold,
        fontSize: 13,
        color: colors.hayDeep,
    },
    itemDescription: {
        fontFamily: fonts.body,
        fontSize: 15,
        color: colors.inkSoft,
    },
});

export default AchievementsScreen;
