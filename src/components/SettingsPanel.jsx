/* Settings over the title screen: switches for music and sound effects, and
the card deck (Almsommer or classic) with a way to look at all its cards.
In the style of the game panel (dotted paper, ink border, gold when on). The
sound choices are saved, so they survive closing the app.
The paper panel, the sound switches and the buttons are shared with the
pause panel in the game. */

import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import Card from "./Card";
import appConfig from "../../app.json";
import { updateSoundSettings, useSoundSettings } from "../audio/sounds";
import { cardDecks, setCardDeck, useCardDeck } from "../data/cardDecks";
import { languages, setLanguage, t, useLanguage } from "../i18n";
import { cardShadow, colors, fillParent, fonts, softShadow } from "../theme";

const PRIVACY_URL = "https://almsommer.mariathurn.de/privacy.html";
// Feedback opens a new email to this address, with the version in the subject.
const FEEDBACK_EMAIL = "almsommer@fastmail.com";
const VERSION = appConfig.expo.version;

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

// One deck to choose; the selected one gets the gold border. Without onView
// there is no link to the whole deck. compact: a small tile with only the
// cards and the name (welcome screen).
function DeckOption({ deck, selected, onSelect, onView, compact }) {
    const name = t(`deck.${deck.id}.name`);
    return (
        <Pressable
            onPress={onSelect}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={name}
            style={[styles.deck, compact && styles.deckCompact, selected && styles.deckSelected]}
        >
            <View style={styles.deckPreview}>
                {deck.preview.map((card, index) => (
                    <View
                        key={index}
                        style={[styles.deckCard, { marginLeft: index ? -26 : 0, transform: [{ rotate: `${(index - 1) * 8}deg` }] }]}
                    >
                        <Card card={{ id: `${deck.id}-${index}`, ...card }} deck={deck.id} height={66} />
                    </View>
                ))}
            </View>
            <View style={styles.deckText}>
                <Text style={[styles.rowLabel, compact && styles.deckNameCompact]}>{name}</Text>
                {compact ? null : (
                    <Text style={styles.rowHint} numberOfLines={2}>
                        {t(`deck.${deck.id}.description`)}
                    </Text>
                )}
                {onView ? (
                    <Pressable onPress={onView} accessibilityRole="button" accessibilityLabel={t("settings.viewCardsLabel", { deck: name })}>
                        {({ hovered }) => <Text style={[styles.link, hovered && styles.linkHovered]}>{t("settings.viewCards")}</Text>}
                    </Pressable>
                ) : null}
            </View>
        </Pressable>
    );
}

// All decks to choose from; onView(deckId) opens a deck's cards. compact:
// small tiles side by side.
export function DeckChoice({ onView, compact = false }) {
    const chosen = useCardDeck();
    return (
        <View style={[styles.decks, compact && styles.decksCompact]} accessibilityRole="radiogroup">
            {cardDecks.map((deck) => (
                <DeckOption
                    key={deck.id}
                    deck={deck}
                    compact={compact}
                    selected={deck.id === chosen}
                    onSelect={() => setCardDeck(deck.id)}
                    onView={onView ? () => onView(deck.id) : null}
                />
            ))}
        </View>
    );
}

// Dotted paper panel over a darkened screen, with a hand-lettered heading.
// Tapping beside it calls onClose. maxWidth widens it for two columns.
export function PaperPanel({ heading, onClose, closeLabel, maxWidth, children }) {
    return (
        <View style={styles.overlay}>
            <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={closeLabel} />
            <View style={[styles.panel, maxWidth ? { maxWidth } : null]}>
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Defs>
                        <Pattern id="settings-dots" width={14} height={14} patternUnits="userSpaceOnUse">
                            <Circle cx={7} cy={7} r={1.3} fill={colors.ink} opacity={0.09} />
                        </Pattern>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#settings-dots)" />
                </Svg>

                <Text style={styles.heading}>{heading}</Text>
                {children}
            </View>
        </View>
    );
}

// Music and sound effects, saved across app starts.
export function SoundSwitches() {
    const { music, effects } = useSoundSettings();
    return (
        <>
            <Switch
                label={t("settings.music")}
                hint={t("settings.musicHint")}
                value={music}
                onChange={(on) => updateSoundSettings({ music: on })}
            />
            <View style={styles.divider} />
            <Switch
                label={t("settings.effects")}
                hint={t("settings.effectsHint")}
                value={effects}
                onChange={(on) => updateSoundSettings({ effects: on })}
            />
        </>
    );
}

// The panel's buttons: "primary" is ink with a gold edge, "secondary" is
// outlined paper. A disabled button is faded and can't be pressed.
export function PanelButton({ label, onPress, variant = "primary", disabled = false, style }) {
    const primary = variant === "primary";
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            style={({ pressed }) => [
                primary ? styles.done : styles.secondary,
                pressed && styles.donePressed,
                disabled && { opacity: 0.4 },
                style,
            ]}
        >
            <Text style={[styles.doneLabel, !primary && styles.secondaryLabel]}>{label}</Text>
        </Pressable>
    );
}

// English or German, as two halves of one switch; the gold half is chosen.
// Also on the welcome screen.
export function LanguageChoice() {
    const language = useLanguage();
    return (
        <View style={styles.row}>
            <Text style={[styles.rowLabel, styles.rowText]}>{t("settings.language")}</Text>
            <View style={styles.segments} accessibilityRole="radiogroup">
                {languages.map(({ id, name }) => {
                    const selected = id === language;
                    return (
                        <Pressable
                            key={id}
                            onPress={() => setLanguage(id)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            accessibilityLabel={name}
                            style={[styles.segment, selected && styles.segmentSelected]}
                        >
                            <Text style={styles.segmentLabel}>{name}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

function SettingsPanel({ onClose, onViewDeck }) {
    return (
        <PaperPanel heading={t("settings.heading")} onClose={onClose} closeLabel={t("settings.close")}>
            <SoundSwitches />
            <View style={styles.divider} />
            <LanguageChoice />

            <Text style={styles.sectionLabel}>{t("settings.cardDeck")}</Text>
            <DeckChoice onView={onViewDeck} />

            <PanelButton
                label={t("settings.feedback")}
                variant="secondary"
                onPress={() =>
                    Linking.openURL(
                        `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(t("settings.feedbackSubject", { version: VERSION }))}`
                    ).catch(() => {})
                }
            />
            <PanelButton label={t("common.done")} onPress={onClose} style={styles.doneAfterFeedback} />
            <Pressable
                onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
                accessibilityRole="link"
                accessibilityLabel={t("settings.privacy")}
                hitSlop={8}
            >
                <Text style={[styles.rowHint, styles.privacyLink]}>{t("settings.privacy")}</Text>
            </Pressable>
            <Text style={[styles.rowHint, styles.version]}>{t("settings.version", { version: VERSION })}</Text>
        </PaperPanel>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...fillParent,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 20,
    },
    scrim: {
        ...fillParent,
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
    doneAfterFeedback: {
        marginTop: 0,
    },
    version: {
        textAlign: "center",
        marginTop: -6,
    },
    privacyLink: {
        textAlign: "center",
        textDecorationLine: "underline",
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
    decks: {
        gap: 10,
    },
    decksCompact: {
        flexDirection: "row",
    },
    deckCompact: {
        flex: 1,
        flexDirection: "column",
        gap: 6,
        padding: 8,
    },
    deckNameCompact: {
        textAlign: "center",
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
        ...cardShadow,
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
    segments: {
        flexDirection: "row",
        borderRadius: 12,
        borderWidth: 2.5,
        borderColor: colors.ink,
        overflow: "hidden",
        backgroundColor: "#ffffff",
    },
    segment: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    segmentSelected: {
        backgroundColor: colors.hay,
    },
    segmentLabel: {
        fontFamily: fonts.bodyBold,
        fontSize: 16,
        color: colors.ink,
    },
    secondary: {
        alignItems: "center",
        paddingVertical: 11,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: colors.ink,
    },
    secondaryLabel: {
        color: colors.ink,
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

// Text and divider styles, for other panels in the same look.
export const panelStyles = styles;

export default SettingsPanel;
