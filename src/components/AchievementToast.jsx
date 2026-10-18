/* A note that slides in below the banner when a round earned achievements
(at the right in landscape, clear of the player at the top):
the trophy, "Achievement unlocked" and their names. It goes away by itself
after a few seconds and doesn't block the table. */

import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { useStage } from "./Stage";
import Trophy from "./Trophy";
import { t } from "../i18n";
import { colors, fonts, softShadow } from "../theme";

const SHOW_FOR = 4500;
const useNativeDriver = Platform.OS !== "web";

function AchievementToast({ ids, onDone }) {
    const { isPortrait } = useStage();
    const progress = useRef(new Animated.Value(0)).current;
    const visible = ids.length > 0;

    useEffect(() => {
        if (!visible) return undefined;
        progress.setValue(0);
        const show = Animated.timing(progress, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(1.4)), useNativeDriver });
        const hide = Animated.timing(progress, { toValue: 0, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver });
        show.start();
        const timer = setTimeout(() => hide.start(({ finished }) => finished && onDone()), SHOW_FOR);
        return () => clearTimeout(timer);
    }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!visible) return null;

    return (
        <View style={[styles.slot, !isPortrait && styles.slotRight]} pointerEvents="none">
            <Animated.View
                accessibilityLiveRegion="polite"
                style={[
                    styles.toast,
                    {
                        opacity: progress,
                        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
                    },
                ]}
            >
                <Trophy size={44} />
                <View style={styles.text}>
                    <Text style={styles.label}>{t("achievements.toast")}</Text>
                    {ids.map((id) => (
                        <Text key={id} style={styles.title} numberOfLines={1}>
                            {t(`achievement.${id}.title`)}
                        </Text>
                    ))}
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    slot: {
        position: "absolute",
        top: 84,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 30,
    },
    slotRight: {
        alignItems: "flex-end",
        paddingRight: 20,
    },
    toast: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingLeft: 12,
        paddingRight: 20,
        backgroundColor: colors.paper,
        borderRadius: 16,
        borderWidth: 2.5,
        borderColor: colors.ink,
        ...softShadow,
    },
    text: {
        gap: 1,
    },
    label: {
        fontFamily: fonts.bodyBold,
        fontSize: 12,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: colors.inkSoft,
    },
    title: {
        fontFamily: fonts.hand,
        fontSize: 26,
        lineHeight: 30,
        color: colors.ink,
    },
});

export default AchievementToast;
