/* Achievements: a dotted paper panel listing the achievements defined in
src/data/achievements.js. Until any are defined it says they're coming. */

import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import Card from "../components/Card";
import PaperButton from "../components/PaperButton";
import SceneBackground from "../components/SceneBackground";
import { achievements } from "../data/achievements";
import { colors, fonts, softShadow } from "../theme";

function Achievement({ item, unlocked }) {
    return (
        <View style={[styles.item, !unlocked && styles.itemLocked]}>
            {item.icon ? (
                <View style={!unlocked && styles.iconLocked}>
                    <Card card={{ id: item.id, ...item.icon }} height={70} />
                </View>
            ) : (
                <View style={styles.medal} />
            )}
            <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
        </View>
    );
}

function AchievementsScreen({ onBack, unlocked = [] }) {
    return (
        <View style={styles.shell}>
            <SceneBackground />

            <View style={styles.header}>
                <PaperButton label="‹ Menu" compact onPress={onBack} />
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
                        <Text style={styles.heading}>achievements</Text>
                        {achievements.length === 0 ? (
                            <Text style={styles.empty}>
                                No achievements yet. They will show up here once they're added.
                            </Text>
                        ) : (
                            achievements.map((item) => (
                                <Achievement key={item.id} item={item} unlocked={unlocked.includes(item.id)} />
                            ))
                        )}
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
    empty: {
        fontFamily: fonts.body,
        fontSize: 17,
        lineHeight: 22,
        color: colors.inkSoft,
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
    iconLocked: {
        opacity: 0.35,
    },
    medal: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.hay,
        borderWidth: 2.5,
        borderColor: colors.ink,
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
    itemDescription: {
        fontFamily: fonts.body,
        fontSize: 15,
        color: colors.inkSoft,
    },
});

export default AchievementsScreen;
