/* A short tour of the game screen in the guided game: one part of the screen
at a time stays bright in a gold frame, everything else is dimmed, and the
coach explains it. The bright part can be tapped (try the last-trick eye).

Parts take part by wrapping themselves in <TourTarget id="…">. The overlay
measures the target in the window and converts it to the stage's coordinates
(the stage is scaled to the screen), relative to `rootRef`, the view it is
drawn in. */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import CoachBubble from "./CoachBubble";
import { useStage } from "./Stage";
import { colors } from "../theme";

const TourContext = createContext(null);

export function TourProvider({ children }) {
    const targets = useRef({});
    return <TourContext.Provider value={targets}>{children}</TourContext.Provider>;
}

export function TourTarget({ id, style, children }) {
    const targets = useContext(TourContext);
    return (
        <View
            ref={(node) => {
                if (targets) targets.current[id] = node;
            }}
            collapsable={false}
            style={style}
        >
            {children}
        </View>
    );
}

const DIM = "rgba(12, 10, 8, 0.72)";
const PAD = 8;

// steps: [{ target, text, placement }]; step: index of the current one.
export function TourOverlay({ rootRef, steps, step, nextLabel, doneLabel, onNext }) {
    const targets = useContext(TourContext);
    const { scale } = useStage();
    const [rect, setRect] = useState(null);
    const current = steps[step];

    useEffect(() => {
        setRect(null);
        const node = targets?.current[current.target];
        const root = rootRef.current;
        if (!node || !root) return;
        // Measured after the frame, so the target has its final place.
        const frame = requestAnimationFrame(() =>
            root.measureInWindow((rootX, rootY) =>
                node.measureInWindow((x, y, width, height) =>
                    setRect({
                        x: (x - rootX) / scale - PAD,
                        y: (y - rootY) / scale - PAD,
                        width: width / scale + PAD * 2,
                        height: height / scale + PAD * 2,
                    })
                )
            )
        );
        return () => cancelAnimationFrame(frame);
    }, [current.target, scale]); // eslint-disable-line react-hooks/exhaustive-deps

    const last = step === steps.length - 1;
    return (
        <>
            {/* The dimmed parts block the table while the tour runs; the
            bright part in the frame stays usable. */}
            <View style={[StyleSheet.absoluteFill, styles.layer]} pointerEvents="box-none">
                {rect ? (
                    <>
                        <Pressable accessible={false} style={[styles.dim, { left: 0, right: 0, top: 0, height: Math.max(rect.y, 0) }]} />
                        <Pressable accessible={false} style={[styles.dim, { left: 0, right: 0, top: rect.y + rect.height, bottom: 0 }]} />
                        <Pressable accessible={false} style={[styles.dim, { left: 0, width: Math.max(rect.x, 0), top: rect.y, height: rect.height }]} />
                        <Pressable accessible={false} style={[styles.dim, { left: rect.x + rect.width, right: 0, top: rect.y, height: rect.height }]} />
                        <View pointerEvents="none" style={[styles.frame, { left: rect.x, top: rect.y, width: rect.width, height: rect.height }]} />
                    </>
                ) : (
                    <Pressable accessible={false} style={[StyleSheet.absoluteFill, styles.dim]} />
                )}
            </View>
            <CoachBubble
                text={current.text}
                placement={current.placement}
                actions={[{ label: last ? doneLabel : nextLabel, onPress: onNext, primary: true }]}
            />
        </>
    );
}

const styles = StyleSheet.create({
    layer: {
        zIndex: 11,
    },
    dim: {
        position: "absolute",
        backgroundColor: DIM,
    },
    frame: {
        position: "absolute",
        borderRadius: 14,
        borderWidth: 3,
        borderColor: colors.hay,
    },
});
