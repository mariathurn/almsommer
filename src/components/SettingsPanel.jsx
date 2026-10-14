/* Settings over the title screen: switches for music and sound effects, and
the card deck (only Almsommer so far) with a way to look at all its cards.
In the style of the game panel (dotted paper, ink border, gold when on). The
sound choices are saved, so they survive closing the app. */

import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import Card from "./Card";
import { updateSoundSettings, useSoundSettings } from "../audio/sounds";
import { DEFAULT_DECK, cardDecks } from "../data/cardDecks";
import { colors, fonts, softShadow } from "../theme";

function Switch({ label, hint, value, onChange }) {
    return (
        <Pressable
            onPress={() => onChange(!value)}
            accessibilityRole="switch"
            accessibilityState={{ checked: value }}
            aria-checked={value}
            accessibilityLabel={label}
            style={styles.row}
        >
            <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowHint}>{hint}</Text>
            </View>
            <View style={[styles.track, value && styles.trackOn]}>
                <View style={[styles.knob, value && styles.knobOn]} />
            </View>
        </Pressable>
    );
}

// One deck to choose; the selected one gets the gold border.
function DeckOption({ deck, selected, onView }) {
    return (
        <View style={[styles.deck, selected && styles.deckSelected]}>
            <View style={styles.deckPreview}>
                {deck.preview.map((card, index) => (
                    <View
                        key={index}
                        style={[styles.deckCard, { marginLeft: index ? -26 : 0, transform: [{ rotate: `${(index - 1) * 8}deg` }] }]}
                    >
                        <Card card={{ id: `${deck.id}-${index}`, ...card }} height={66} />
                    </View>
                ))}
            </View>
            <View style={styles.deckText}>
                <Text style={styles.rowLabel}>{deck.name}</Text>
                <Text style={styles.rowHint} numberOfLines={2}>
                    {deck.description}
                </Text>
                <Pressable onPress={onView} accessibilityRole="button" accessibilityLabel={`View the ${deck.name} cards`}>
                    {({ hovered }) => <Text style={[styles.link, hovered && styles.linkHovered]}>View all cards ›</Text>}
                </Pressable>
            </View>
        </View>
    );
}

function SettingsPanel({ onClose, onViewDeck }) {
    const { music, effects } = useSoundSettings();

    return (
        <View style={styles.overlay}>
            <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close settings" />
            <View style={styles.panel}>
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Defs>
                        <Pattern id="settings-dots" width={14} height={14} patternUnits="userSpaceOnUse">
                            <Circle cx={7} cy={7} r={1.3} fill={colors.ink} opacity={0.09} />
                        </Pattern>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#settings-dots)" />
                </Svg>

                <Text style={styles.heading}>settings</Text>

                <Switch
                    label="Music"
                    hint="The meadow tune in the background"
                    value={music}
                    onChange={(on) => updateSoundSettings({ music: on })}
                />
                <View style={styles.divider} />
                <Switch
                    label="Sound effects"
                    hint="Shuffling, cards, tricks and the sheep"
                    value={effects}
                    onChange={(on) => updateSoundSettings({ effects: on })}
                />

                <Text style={styles.sectionLabel}>Card deck</Text>
                {cardDecks.map((deck) => (
                    <DeckOption key={deck.id} deck={deck} selected={deck.id === DEFAULT_DECK} onView={onViewDeck} />
                ))}

                <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                    style={({ pressed }) => [styles.done, pressed && styles.donePressed]}
                >
                    <Text style={styles.doneLabel}>Done</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 20,
    },
    scrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.scrim,
    },
    panel: {
        width: "100%",
        maxWidth: 380,
        padding: 20,
        gap: 12,
        backgroundColor: colors.paper,
        borderRadius: 22,
        borderWidth: 2.5,
        borderColor: colors.ink,
        overflow: "hidden",
        ...softShadow,
    },
    heading: {
        fontFamily: fonts.hand,
        fontSize: 44,
        lineHeight: 48,
        color: colors.ink,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 4,
    },
    rowText: {
        flex: 1,
        gap: 1,
    },
    rowLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 20,
        color: colors.ink,
    },
    rowHint: {
        fontFamily: fonts.body,
        fontSize: 14,
        color: colors.inkSoft,
    },
    sectionLabel: {
        marginTop: 6,
        fontFamily: fonts.bodyBold,
        fontSize: 13,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: colors.inkSoft,
    },
    deck: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 12,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: colors.ink,
    },
    deckSelected: {
        borderWidth: 4,
        borderColor: colors.hay,
    },
    deckPreview: {
        flexDirection: "row",
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    deckCard: {
        ...softShadow,
    },
    deckText: {
        flex: 1,
        gap: 2,
    },
    link: {
        marginTop: 4,
        fontFamily: fonts.bodyBold,
        fontSize: 16,
        color: colors.ink,
        textDecorationLine: "underline",
        textDecorationColor: colors.hay,
    },
    linkHovered: {
        color: colors.inkSoft,
    },
    divider: {
        height: 1.5,
        backgroundColor: colors.keyline,
    },
    track: {
        width: 58,
        height: 34,
        padding: 3,
        borderRadius: 17,
        borderWidth: 2.5,
        borderColor: colors.ink,
        backgroundColor: "#ffffff",
        justifyContent: "center",
    },
    trackOn: {
        backgroundColor: colors.hay,
    },
    knob: {
        width: 23,
        height: 23,
        borderRadius: 12,
        borderWidth: 2.5,
        borderColor: colors.ink,
        backgroundColor: colors.paper,
    },
    knobOn: {
        alignSelf: "flex-end",
        backgroundColor: "#ffffff",
    },
    done: {
        marginTop: 6,
        alignItems: "center",
        paddingVertical: 13,
        backgroundColor: colors.ink,
        borderRadius: 14,
        borderBottomWidth: 4,
        borderBottomColor: colors.hay,
    },
    donePressed: {
        transform: [{ translateY: 1 }],
    },
    doneLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 19,
        color: "#ffffff",
    },
});

export default SettingsPanel;
