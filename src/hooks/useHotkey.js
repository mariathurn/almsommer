import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Keyboard shortcut on the web (no-op on phones). `key` is matched against
// KeyboardEvent.key, case-insensitive ("Escape", "p", "d"). Ignored while a
// modifier key is held or while typing in a text field.
function useHotkey(key, handler, enabled = true) {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        if (Platform.OS !== "web" || !enabled) return undefined;
        const onKeyDown = (event) => {
            if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
            const tag = event.target?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) return;
            if (event.key.toLowerCase() !== key.toLowerCase()) return;
            event.preventDefault();
            handlerRef.current(event);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [key, enabled]);
}

export default useHotkey;
