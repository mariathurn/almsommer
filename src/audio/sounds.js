// Music and sound effects. Players are created once and reused; effects
// restart from the beginning each time they play.
//
// Files live in src/assets/audio. Effects are M4A (AAC), converted from the
// OGG originals, since iPhones and Safari can't play OGG.

import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Asset } from "expo-asset";

const sources = {
    meadow: require("../assets/audio/music/meadow.mp3"),
    sheep: require("../assets/audio/sfx/sheep.mp3"),
    shuffle: require("../assets/audio/sfx/card-shuffle.m4a"),
    shove: require("../assets/audio/sfx/card-shove-1.m4a"),
    place1: require("../assets/audio/sfx/card-place-1.m4a"),
    place2: require("../assets/audio/sfx/card-place-2.m4a"),
    place3: require("../assets/audio/sfx/card-place-3.m4a"),
    place4: require("../assets/audio/sfx/card-place-4.m4a"),
};

const MUSIC_VOLUME = 0.35;
const EFFECT_VOLUME = 0.9;
// The shuffle sound plays faster than recorded (3 s → about 1.9 s).
const SHUFFLE_RATE = 1.6;

const players = {};

// --- Settings: music and sound effects can be switched off separately. ------

const SETTINGS_KEY = "almsommer.sound";
let settings = { music: true, effects: true };
const listeners = new Set();
// Pauses or resumes whatever plays the music (set by startAmbience).
let musicControl = null;

function emit() {
    listeners.forEach((listener) => listener());
}

export function getSoundSettings() {
    return settings;
}

export function updateSoundSettings(change) {
    settings = { ...settings, ...change };
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
    if ("music" in change) musicControl?.(settings.music);
    emit();
}

// React hook: the current settings, re-rendering when they change.
export function useSoundSettings() {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getSoundSettings
    );
}

// Saved choices from the last time the app was open.
const settingsLoaded = AsyncStorage.getItem(SETTINGS_KEY)
    .then((saved) => {
        if (!saved) return;
        settings = { ...settings, ...JSON.parse(saved) };
        emit();
    })
    .catch(() => {});

function getPlayer(name) {
    if (!players[name]) {
        const player = createAudioPlayer(sources[name]);
        player.volume = name === "meadow" ? MUSIC_VOLUME : EFFECT_VOLUME;
        if (name === "meadow") player.loop = true;
        players[name] = player;
    }
    return players[name];
}

// Browsers only allow sound once the page has had a tap, click or key press.
function webSoundAllowed() {
    return Platform.OS !== "web" || navigator.userActivation?.hasBeenActive !== false;
}

function play(name, configure) {
    if (!settings.effects || !webSoundAllowed()) return;
    try {
        const player = getPlayer(name);
        configure?.(player);
        player.seekTo(0);
        player.play();
    } catch {
        // Sound is a nicety; never let it break the game.
    }
}

export const sounds = {
    placeCard: () => play(`place${1 + Math.floor(Math.random() * 4)}`),
    collectTrick: () => play("shove"),
    shuffle: () => play("shuffle", (player) => player.setPlaybackRate(SHUFFLE_RATE, "high")),
    // On "play" in the title screen.
    sheep: () => play("sheep"),
};

// Starts the looping meadow music as soon as the app opens. Browsers block sound until the first tap, click or key press:
// on the web this tries straight away and, if blocked, starts with the first
// interaction anywhere (also on the title screen).
// Respects the music setting, also when it is changed later.
export function startAmbience() {
    if (Platform.OS !== "web") {
        setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
        musicControl = (on) => {
            try {
                const meadow = getPlayer("meadow");
                if (on) meadow.play();
                else meadow.pause();
            } catch {
                // ignore
            }
        };
        settingsLoaded.then(() => musicControl?.(settings.music));
        return () => {
            musicControl?.(false);
            musicControl = null;
        };
    }

    // Plain audio elements on the web, so a blocked attempt can be caught.
    const uri = (source) => Asset.fromModule(source).uri;
    const meadow = new window.Audio(uri(sources.meadow));
    meadow.volume = MUSIC_VOLUME;
    meadow.loop = true;

    let started = false;
    let trying = false;
    const events = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
    const stopListening = () => events.forEach((type) => window.removeEventListener(type, tryStart, true));

    // One click fires several of these events; only one attempt runs at a time.
    function tryStart() {
        if (started || trying || !settings.music) return;
        trying = true;
        meadow
            .play()
            .then(() => {
                started = true;
                stopListening();
            })
            .catch(() => {
                // Not allowed yet: wait for the next interaction.
            })
            .finally(() => {
                trying = false;
            });
    }

    events.forEach((type) => window.addEventListener(type, tryStart, true));
    settingsLoaded.then(tryStart);

    // Switching music on happens with a click, so the browser allows it.
    musicControl = (on) => {
        if (on) {
            started = false;
            tryStart();
        } else {
            meadow.pause();
        }
    };

    return () => {
        stopListening();
        meadow.pause();
        musicControl = null;
    };
}
