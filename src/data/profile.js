// Your profile: name, portrait and what you have won so far, kept across app
// starts. Shown at the top of the start menu, edited in the profile panel,
// and your name and savings are used at the table.

import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_KEY = "almsommer.profile";
// Savings were kept on their own before the profile existed.
const OLD_SAVINGS_KEY = "almsommer.savings";

// Portraits you can choose from (ids from data/portraits.js).
export const portraitChoices = ["shepherd-acorn", "shepherd-heart", "shepherd-leaf", "shepherd-bell", "sheep-heart"];

const defaults = {
    // Chosen on the welcome screen before the first game.
    name: "",
    portrait: "shepherd-acorn",
    // Coins won and lost over all rounds.
    savings: 0,
    gamesPlayed: 0,
    // The most coins won in a single round.
    bestGame: 0,
};

let profile = defaults;
const listeners = new Set();

function emit() {
    listeners.forEach((listener) => listener());
}

function save() {
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
    emit();
}

export function getProfile() {
    return profile;
}

// Name and portrait, from the profile panel.
export function updateProfile({ name, portrait }) {
    const trimmed = name?.trim();
    profile = {
        ...profile,
        ...(trimmed ? { name: trimmed } : null),
        ...(portraitChoices.includes(portrait) ? { portrait } : null),
    };
    save();
}

// A finished round: its win (or loss, when negative) for you.
export function recordRound(delta) {
    profile = {
        ...profile,
        savings: profile.savings + delta,
        gamesPlayed: profile.gamesPlayed + 1,
        bestGame: Math.max(profile.bestGame, delta),
    };
    save();
}

// Developer menu: change the savings directly, or start over.
export function devAddSavings(amount) {
    profile = { ...profile, savings: profile.savings + amount };
    save();
}
export function devResetStats() {
    profile = { ...profile, savings: 0, gamesPlayed: 0, bestGame: 0 };
    save();
}

// React hook: the current profile, re-rendering when it changes.
export function useProfile() {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getProfile
    );
}

// The profile from the last time the app was open. Rounds recorded before
// it has loaded are added on top.
Promise.all([AsyncStorage.getItem(PROFILE_KEY), AsyncStorage.getItem(OLD_SAVINGS_KEY)])
    .then(([saved, oldSavings]) => {
        const stored = saved ? JSON.parse(saved) : { savings: Number(oldSavings) || 0 };
        const played = profile.gamesPlayed;
        profile = {
            ...defaults,
            ...stored,
            savings: (stored.savings ?? 0) + profile.savings,
            gamesPlayed: (stored.gamesPlayed ?? 0) + played,
            bestGame: Math.max(stored.bestGame ?? 0, profile.bestGame),
        };
        emit();
    })
    .catch(() => {});

// "1,240", "−80": a balance, so no plus sign.
export function formatSavings(value) {
    const digits = String(Math.abs(Math.round(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return value < 0 ? `−${digits}` : digits;
}
