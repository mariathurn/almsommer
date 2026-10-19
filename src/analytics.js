// Anonymous usage events for the web version, sent to Umami (loaded in
// public/index.html, only on almsommer.mariathurn.de). The apps send nothing.
// Events never contain the player's name or anything else personal.

import { Platform } from "react-native";

export function track(event, data) {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
        // The Umami website is shared with mariathurn.de, so the prefix tells the events apart.
        window.umami?.track(`almsommer-${event}`, data);
    } catch {
        // Analytics must never break the game.
    }
}
