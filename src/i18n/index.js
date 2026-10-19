// Interface language: English or German, switched in the settings and kept
// across app starts. On the first start it follows the device language.
//
// t("key", { name: "Resi" }) looks a text up in the current language's
// dictionary (en.js, de.js). Entries are plain strings with {placeholders},
// or functions for phrases that need grammar (articles, plurals, word order).
// App re-renders the whole tree when the language changes, so t() can be
// called anywhere during rendering.

import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import de from "./de";
import en from "./en";

const LANGUAGE_KEY = "almsommer.language";
const dictionaries = { en, de };
export const languages = [
    { id: "en", name: "English" },
    { id: "de", name: "Deutsch" },
];

function deviceLanguage() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith("de") ? "de" : "en";
    } catch {
        return "en";
    }
}

let language = deviceLanguage();
const listeners = new Set();

// On the web, tell the browser (screen readers, translation) the page's language.
function markPage() {
    if (typeof document !== "undefined") document.documentElement.lang = language;
}
markPage();

export function getLanguage() {
    return language;
}

export function setLanguage(next) {
    if (!dictionaries[next] || next === language) return;
    language = next;
    markPage();
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch(() => {});
    listeners.forEach((listener) => listener());
}

// React hook: the current language, re-rendering when it changes.
export function useLanguage() {
    return useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getLanguage
    );
}

// The language chosen last time, if any.
AsyncStorage.getItem(LANGUAGE_KEY)
    .then((saved) => {
        if (saved && dictionaries[saved] && saved !== language) {
            language = saved;
            markPage();
            listeners.forEach((listener) => listener());
        }
    })
    .catch(() => {});

// A text in the current language. Falls back to English, then to the key,
// so a missing translation shows up instead of breaking the screen.
export function t(key, params = {}) {
    const entry = dictionaries[language][key] ?? en[key];
    if (entry === undefined) return key;
    if (typeof entry === "function") return entry(params);
    return entry.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}
