// Which achievements you have, and when you got them, kept across app starts:
// { "first-win": 1760790000000, ... }. The rules are in data/achievements.js.

import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { findNewAchievements } from "./achievements";

const ACHIEVEMENTS_KEY = "almsommer.achievements";
let unlocked = {};
const listeners = new Set();

function emit() {
    listeners.forEach((listener) => listener());
}

export function getUnlocked() {
    return unlocked;
}

// Checks a finished round (or just the savings, with round null) and unlocks
// whatever it earned. Returns the ids unlocked just now.
export function unlockAchievements({ round = null, savings }) {
    const fresh = findNewAchievements({ round, savings, unlocked });
    if (!fresh.length) return fresh;
    const now = Date.now();
    unlocked = { ...unlocked, ...Object.fromEntries(fresh.map((id) => [id, now])) };
    AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked)).catch(() => {});
    emit();
    return fresh;
}

// React hook: the unlocked achievements, re-rendering when one is added.
export function useUnlocked() {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getUnlocked
    );
}

// Achievements from the last time the app was open. Any unlocked before this
// has loaded are kept too.
AsyncStorage.getItem(ACHIEVEMENTS_KEY)
    .then((saved) => {
        if (!saved) return;
        const unlockedEarly = Object.keys(unlocked).length > 0;
        unlocked = { ...JSON.parse(saved), ...unlocked };
        // Something unlocked before loading saved only itself; save all again.
        if (unlockedEarly) AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked)).catch(() => {});
        emit();
    })
    .catch(() => {});
