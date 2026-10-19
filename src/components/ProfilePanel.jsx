/* "your shepherd": your profile, opened from the badge at the top of the start
menu. Choose a portrait and a name, and see what you have won so far. In the
look of the settings panel; two columns on wide screens, one on phones.
Back drops the changes, Done keeps them.
With `welcome`, it's the very first step of a new player (before the rules):
the language and the card deck instead of stats, an empty name that must be
filled in, and only a Continue button. */

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CoinIcon } from "./Coin";
import Portrait from "./Portrait";
import { DeckChoice, LanguageChoice, PanelButton, PaperPanel, panelStyles } from "./SettingsPanel";
import { useStage } from "./Stage";
import { portraits } from "../data/portraits";
import { formatSavings, portraitChoices, updateProfile, useProfile } from "../data/profile";
import { t } from "../i18n";
import { colors, fonts } from "../theme";

const NAME_LENGTH = 16;

function StatRow({ label, children }) {
    return (
        <View style={styles.stat}>
            <Text style={panelStyles.rowLabel}>{label}</Text>
            <View style={styles.statValue}>{children}</View>
        </View>
    );
}

function ProfilePanel({ onClose, welcome = false }) {
    const { isPortrait } = useStage();
    const profile = useProfile();
    const [name, setName] = useState(welcome ? "" : profile.name);
    const [portraitId, setPortraitId] = useState(profile.portrait);
    const portrait = portraits.find((p) => p.id === portraitId);
    const named = name.trim().length > 0;

    const done = () => {
        if (welcome && !named) return;
        updateProfile({ name, portrait: portraitId });
        onClose();
    };

    return (
        <PaperPanel
            heading={t(welcome ? "profile.welcomeHeading" : "profile.heading")}
            // The welcome can't be dismissed, only finished.
            onClose={welcome ? () => {} : onClose}
            closeLabel={t("profile.close")}
            maxWidth={isPortrait ? 380 : 720}
        >
            {welcome ? <Text style={[panelStyles.rowHint, styles.welcomeText]}>{t("profile.welcomeText")}</Text> : null}
            <View style={[styles.columns, isPortrait && styles.columnsStacked]}>
                {/* Portrait and the choices */}
                <View style={[styles.portraitColumn, !isPortrait && styles.portraitColumnWide]}>
                    <View style={styles.bigRing}>
                        <Portrait portrait={portrait} size={isPortrait ? (welcome ? 80 : 110) : 150} />
                    </View>
                    <Text style={panelStyles.sectionLabel}>{t("profile.choosePortrait")}</Text>
                    <View style={styles.choices}>
                        {portraitChoices.map((id, index) => {
                            const choice = portraits.find((p) => p.id === id);
                            const selected = id === portraitId;
                            return (
                                <Pressable
                                    key={id}
                                    onPress={() => setPortraitId(id)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: selected }}
                                    accessibilityLabel={t("profile.portrait", { number: index + 1 })}
                                    style={[styles.choiceRing, selected && styles.choiceRingSelected]}
                                >
                                    <Portrait portrait={choice} size={isPortrait ? 46 : 54} borderWidth={3} />
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {!isPortrait ? <View style={styles.columnDivider} /> : null}

                {/* Name and what you have won */}
                <View style={styles.detailsColumn}>
                    {welcome ? (
                        <>
                            <LanguageChoice />
                            <View style={panelStyles.divider} />
                        </>
                    ) : null}
                    <Text style={panelStyles.sectionLabel}>{t("profile.name")}</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder={t("profile.namePlaceholder")}
                        placeholderTextColor={colors.inkSoft}
                        autoFocus={welcome}
                        maxLength={NAME_LENGTH}
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={done}
                        accessibilityLabel={t("profile.name")}
                        style={styles.nameInput}
                    />
                    {welcome ? null : <Text style={panelStyles.rowHint}>{t("profile.nameHint")}</Text>}

                    {welcome ? (
                        <>
                            <Text style={panelStyles.sectionLabel}>{t("profile.chooseDeck")}</Text>
                            <DeckChoice compact />
                        </>
                    ) : null}

                    {welcome ? null : (
                        <View style={styles.stats}>
                            <StatRow label={t("profile.savedOverall")}>
                                <CoinIcon size={20} />
                                <Text style={styles.statNumber}>{formatSavings(profile.savings)}</Text>
                            </StatRow>
                            <View style={panelStyles.divider} />
                            <StatRow label={t("profile.bestGame")}>
                                <Text style={styles.statNumber}>{formatSavings(profile.bestGame)}</Text>
                            </StatRow>
                            <View style={panelStyles.divider} />
                            <StatRow label={t("profile.gamesPlayed")}>
                                <Text style={styles.statNumber}>{profile.gamesPlayed}</Text>
                            </StatRow>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.buttons}>
                {welcome ? (
                    <PanelButton label={t("profile.welcomeContinue")} onPress={done} disabled={!named} style={styles.button} />
                ) : (
                    <>
                        <PanelButton label={t("common.back")} variant="secondary" onPress={onClose} style={styles.button} />
                        <PanelButton label={t("common.done")} onPress={done} style={styles.button} />
                    </>
                )}
            </View>
        </PaperPanel>
    );
}

const styles = StyleSheet.create({
    welcomeText: {
        textAlign: "center",
        marginBottom: 10,
    },
    columns: {
        flexDirection: "row",
        gap: 20,
    },
    columnsStacked: {
        flexDirection: "column",
        gap: 14,
    },
    portraitColumn: {
        alignItems: "center",
        gap: 10,
    },
    portraitColumnWide: {
        width: 230,
        paddingTop: 4,
    },
    columnDivider: {
        width: 1.5,
        backgroundColor: colors.keyline,
    },
    detailsColumn: {
        flex: 1,
        gap: 6,
    },
    // Gold ring around your chosen portrait.
    bigRing: {
        padding: 6,
        borderRadius: 999,
        backgroundColor: colors.hay,
    },
    choices: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
    },
    choiceRing: {
        padding: 3,
        borderRadius: 999,
    },
    choiceRingSelected: {
        backgroundColor: colors.hay,
    },
    nameInput: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontFamily: fonts.bodyBold,
        fontSize: 22,
        color: colors.ink,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 2.5,
        borderColor: colors.ink,
        outlineStyle: "none",
    },
    stats: {
        marginTop: 10,
        gap: 8,
    },
    stat: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 2,
    },
    statValue: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statNumber: {
        fontFamily: fonts.number,
        fontSize: 20,
        color: colors.ink,
    },
    buttons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        marginTop: 0,
    },
});

export default ProfilePanel;
