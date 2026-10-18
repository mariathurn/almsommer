/* Developer menu, opened from the pause menu in development builds only
(__DEV__, never in a release). Deals fixed hands to test rare situations
like a marriage or a Tout, and changes coins and achievements. Not
translated: it's for us, not for players. */

import { StyleSheet, Text, View } from "react-native";
import { PanelButton, PaperPanel, panelStyles } from "./SettingsPanel";
import { achievements } from "../data/achievements";
import { devResetAchievements, devUnlockAll } from "../data/achievementStore";
import { devScenarios } from "../data/devScenarios";
import { devAddSavings, devResetStats } from "../data/profile";
import { colors, fonts } from "../theme";

const scenarioLabels = {
    "marriage-asked": "Marriage: an opponent offers you one",
    "marriage-offer": "Marriage: you hold one trump",
    "sheep-game": "Sheep Game hand",
    "solo-tout": "Solo Tout hand",
    "dog-tout": "Dog Game Tout hand",
};

function DevPanel({ onDeal, onClose }) {
    return (
        <PaperPanel heading="developer" onClose={onClose} closeLabel="Close developer menu" maxWidth={460}>
            <Text style={panelStyles.sectionLabel}>Deal a test hand</Text>
            <View style={styles.list}>
                {devScenarios.map((scenario) => (
                    <PanelButton
                        key={scenario.id}
                        label={scenarioLabels[scenario.id] ?? scenario.id}
                        variant="secondary"
                        onPress={() => onDeal(scenario)}
                        style={styles.button}
                    />
                ))}
            </View>

            <Text style={panelStyles.sectionLabel}>Coins and achievements</Text>
            <View style={styles.row}>
                <PanelButton label="+100" variant="secondary" onPress={() => devAddSavings(100)} style={styles.half} />
                <PanelButton label="+1,000" variant="secondary" onPress={() => devAddSavings(1000)} style={styles.half} />
            </View>
            <View style={styles.row}>
                <PanelButton label="Reset stats" variant="secondary" onPress={devResetStats} style={styles.half} />
                <PanelButton
                    label="Unlock all"
                    variant="secondary"
                    onPress={() => devUnlockAll(achievements.map((a) => a.id))}
                    style={styles.half}
                />
            </View>
            <PanelButton label="Lock all achievements" variant="secondary" onPress={devResetAchievements} style={styles.button} />
            <Text style={styles.note}>Changes are saved like real progress.</Text>

            <PanelButton label="Done" onPress={onClose} />
        </PaperPanel>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: 6,
    },
    row: {
        flexDirection: "row",
        gap: 8,
    },
    button: {
        paddingVertical: 8,
    },
    half: {
        flex: 1,
        paddingVertical: 8,
    },
    note: {
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.inkSoft,
    },
});

export default DevPanel;
