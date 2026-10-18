/* The game's pause menu, opened with the Menu button (or Esc on the web).
The other players wait while it is open. Music and sound effects can be
switched here; leaving in the middle of a round asks first, because the
round is lost. */

import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { PanelButton, PaperPanel, SoundSwitches } from "./SettingsPanel";
import { t } from "../i18n";
import { colors, fonts } from "../theme";

function PausePanel({ onResume, onLeave, isRoundInProgress }) {
    const [confirmingLeave, setConfirmingLeave] = useState(false);

    if (confirmingLeave) {
        return (
            <PaperPanel heading={t("pause.leaveHeading")} onClose={() => setConfirmingLeave(false)} closeLabel={t("pause.stay")}>
                <Text style={styles.message}>{t("pause.leaveText")}</Text>
                <PanelButton label={t("pause.stay")} onPress={() => setConfirmingLeave(false)} />
                <PanelButton label={t("pause.leave")} variant="secondary" onPress={onLeave} />
            </PaperPanel>
        );
    }

    return (
        <PaperPanel heading={t("pause.heading")} onClose={onResume} closeLabel={t("pause.resume")}>
            <SoundSwitches />
            <PanelButton label={t("pause.resume")} onPress={onResume} />
            <PanelButton
                label={t("pause.leave")}
                variant="secondary"
                onPress={() => (isRoundInProgress ? setConfirmingLeave(true) : onLeave())}
            />
        </PaperPanel>
    );
}

const styles = StyleSheet.create({
    message: {
        fontFamily: fonts.body,
        fontSize: 18,
        lineHeight: 24,
        color: colors.ink,
    },
});

export default PausePanel;
