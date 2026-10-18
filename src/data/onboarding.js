// What a new player has already seen, kept across app starts: the rules
// shown on the very first start, and the guided first game.

import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "almsommer.onboarding";
// loaded: false until the saved state is read, so the first start isn't
// mistaken for a returning player (or the other way round).
let state = { loaded: false, rulesSeen: false, tutorialDone: false };
const listeners = new Set();

function emit() {
    listeners.forEach((listener) => listener());
}

function save(change) {
    state = { ...state, ...change };
    const { loaded, ...stored } = state;
    AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(stored)).catch(() => {});
    emit();
}

export const markRulesSeen = () => save({ rulesSeen: true });
export const markTutorialDone = () => save({ tutorialDone: true });

export function getOnboarding() {
    return state;
}

export function useOnboarding() {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getOnboarding
    );
}

AsyncStorage.getItem(ONBOARDING_KEY)
    .then((saved) => {
        state = { ...state, ...(saved ? JSON.parse(saved) : null), loaded: true };
        emit();
    })
    .catch(() => {
        state = { ...state, loaded: true };
        emit();
    });
