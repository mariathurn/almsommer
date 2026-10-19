/* The tip from the old shepherd during the guided game and practice
rounds: his portrait and a speech bubble, at the bottom over your hand (on
phones) or top left under the Menu button (on the web, where the large text
would cover your cards; bottom left while the game panel is open at the top),
so the table stays clear.
`actions` are buttons under the text (e.g. at the end of the round). */

import { StyleSheet, Text, View } from "react-native";
import Portrait from "./Portrait";
import { PanelButton } from "./SettingsPanel";
import { useStage } from "./Stage";
import { portraits } from "../data/portraits";
import { t } from "../i18n";
import { colors, fonts, softShadow } from "../theme";

const coach = portraits.find((p) => p.id === "shepherd-bell");

// placement "top": on phones under the banner instead (at the end of a round,
// when the result sits where the hand was). wideBottom: on the web at the
// bottom left instead (the game panel is open).
function CoachBubble({ text, actions = [], placement = "bottom", wideBottom = false }) {
    const { isPortrait, width } = useStage();
    if (!text) return null;

    return (
        <View
            style={[
                styles.slot,
                // On the web it ends left of the player at the top (centred).
                isPortrait ? styles.slotPhone : [styles.slotWide, { width: Math.min(520, width / 2 - 145) }],
                placement === "top" && isPortrait && styles.slotPhoneTop,
                !isPortrait && (wideBottom ? styles.slotWideBottom : styles.slotWideTop),
            ]}
            pointerEvents="box-none"
        >
            <View style={[styles.row, !isPortrait && !wideBottom && styles.rowWide]}>
                <View style={styles.ring}>
                    <Portrait portrait={coach} size={isPortrait ? 48 : 68} />
                </View>
                <View style={[styles.bubble, isPortrait ? styles.bubblePhone : !wideBottom && styles.bubbleWide]}>
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
    slotWideBottom: {
        bottom: 16,
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
