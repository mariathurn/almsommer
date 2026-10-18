/* The tip from the old shepherd during the guided game and practice
rounds: his portrait and a speech bubble, at the bottom over your hand (on
phones) or bottom left beside it (on the web), so the table stays clear.
`actions` are buttons under the text (e.g. at the end of the round). */

import { StyleSheet, Text, View } from "react-native";
import Portrait from "./Portrait";
import { PanelButton } from "./SettingsPanel";
import { useStage } from "./Stage";
import { portraits } from "../data/portraits";
import { t } from "../i18n";
import { colors, fonts, softShadow } from "../theme";

const coach = portraits.find((p) => p.id === "shepherd-bell");

// placement "top": under the banner instead (at the end of a round, when the
// result sits where the hand was).
function CoachBubble({ text, actions = [], placement = "bottom" }) {
    const { isPortrait } = useStage();
    if (!text) return null;

    return (
        <View
            style={[
                styles.slot,
                isPortrait ? styles.slotPhone : styles.slotWide,
                placement === "top" && (isPortrait ? styles.slotPhoneTop : styles.slotWideTop),
            ]}
            pointerEvents="box-none"
        >
            <View style={styles.row}>
                <View style={styles.ring}>
                    <Portrait portrait={coach} size={isPortrait ? 48 : 60} />
                </View>
                <View style={[styles.bubble, isPortrait && styles.bubblePhone]}>
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
        bottom: 16,
        width: 380,
    },
    slotPhoneTop: {
        bottom: undefined,
        top: 86,
    },
    slotWideTop: {
        bottom: undefined,
        top: 96,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
    },
    ring: {
        padding: 2,
        borderRadius: 999,
        backgroundColor: colors.ink,
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
    bubblePhone: {
        padding: 10,
    },
    label: {
        fontFamily: fonts.bodyBold,
        fontSize: 11,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: colors.hayDeep,
    },
    text: {
        fontFamily: fonts.body,
        fontSize: 16,
        lineHeight: 21,
        color: colors.ink,
    },
    textPhone: {
        fontSize: 15,
        lineHeight: 19,
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
