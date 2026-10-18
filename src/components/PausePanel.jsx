/* The game's pause menu, opened with the Menu button (or Esc on the web).
The other players wait while it is open. Music and sound effects can be
switched here; "Leave game" goes straight back to the start menu. */

import { useState } from "react";
import DevPanel from "./DevPanel";
import { PanelButton, PaperPanel, SoundSwitches } from "./SettingsPanel";
import { t } from "../i18n";

// onDevDeal: in development builds, a "Developer" button opens the
// developer menu (test hands, coins, achievements).
function PausePanel({ onResume, onLeave, onDevDeal = null }) {
    const [showDev, setShowDev] = useState(false);

    if (showDev) {
        return <DevPanel onDeal={onDevDeal} onClose={() => setShowDev(false)} />;
    }

    return (
        <PaperPanel heading={t("pause.heading")} onClose={onResume} closeLabel={t("pause.resume")}>
            <SoundSwitches />
            <PanelButton label={t("pause.resume")} onPress={onResume} />
            <PanelButton label={t("pause.leave")} variant="secondary" onPress={onLeave} />
            {__DEV__ && onDevDeal ? <PanelButton label="Developer" variant="secondary" onPress={() => setShowDev(true)} /> : null}
        </PaperPanel>
    );
}

export default PausePanel;
