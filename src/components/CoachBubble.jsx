/* The tip from the old shepherd during the guided game and practice
rounds: his portrait and a speech bubble, under the banner (on phones and
narrow windows, over the other players) or top left under the Menu button
(on the web), so it covers neither your cards nor the table. The game panel
waits until the tip before it has been read.
`actions` are buttons under the text (e.g. at the end of the round). */

import { StyleSheet, Text, View } from "react-native";
import Portrait from "./Portrait";
import { PanelButton } from "./SettingsPanel";
import { useStage } from "./Stage";
import { portraits } from "../data/portraits";
import { t } from "../i18n";
import { colors, fonts, softShadow } from "../theme";

const coach = portraits.find((p) => p.id === "shepherd-bell");

// placement "bottom": on phones over your hand instead (tour steps that
// explain the top of the screen).
function CoachBubble({ text, actions = [], placement = "top" }) {
    const { isPortrait, width } = useStage();
    if (!text) return null;

    return (
        <View
            style={[
                styles.slot,
                // On the web it ends left of the player at the top (centred).
                isPortrait ? styles.slotPhone : [styles.slotWide, { width: Math.min(520, width / 2 - 145) }],
                placement !== "bottom" && isPortrait && styles.slotPhoneTop,
                !isPortrait && styles.slotWideTop,
            ]}
            pointerEvents="box-none"
        >
            <View style={[styles.row, !isPortrait && styles.rowWide]}>
                <View style={styles.ring}>
                    <Portrait portrait={coach} size={isPortrait ? 62 : 84} borderWidth={2} />
                </View>
                <View style={[styles.bubble, isPortrait ? styles.bubblePhone : styles.bubbleWide]}>
                    <Text style={styles.label}>{t("tutorial.coach")}</Text>
                    <Text style={[styles.text, isPortrait && styles.textPhone]}>{text}</Text>
                    {actions.length ? (
                        <View style={styles.actions}>
                            {actions.map(({ label, onPress, primary }) => (
                                <PanelButton
                                    key={label}
                                    label={label}
                                    onPress={onPress}
                                    variant={primary ? "primary" : "secondary"}
                                    style={styles.action}
                                />
                            ))}
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    slot: {
        position: "absolute",
        zIndex: 12,
    },
    slotPhone: {
        left: 8,
        right: 8,
        bottom: 8,
    },
    slotWide: {
        left: 16,
    },
    slotWideTop: {
        top: 84,
    },
    slotPhoneTop: {
        bottom: undefined,
        top: 86,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
    },
    rowWide: {
        alignItems: "flex-start",
    },
    ring: {
        borderRadius: 999,
    },
    bubble: {
        flex: 1,
        gap: 4,
        padding: 12,
        backgroundColor: colors.paper,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        borderWidth: 2.5,
        borderColor: colors.ink,
        ...softShadow,
    },
    // The pointed corner towards the portrait, which sits top left here.
    bubbleWide: {
        borderBottomLeftRadius: 16,
        borderTopLeftRadius: 4,
    },
    bubblePhone: {
        padding: 10,
    },
    label: {
        fontFamily: fonts.bodyBold,
        fontSize: 13,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: colors.hayDeep,
    },
    // Large, so everyone can read the tips comfortably.
    text: {
        fontFamily: fonts.body,
        fontSize: 21,
        lineHeight: 28,
        color: colors.ink,
    },
    textPhone: {
        fontSize: 17,
        lineHeight: 23,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    action: {
        flex: 1,
        marginTop: 0,
        paddingVertical: 9,
    },
});

export default CoachBubble;
