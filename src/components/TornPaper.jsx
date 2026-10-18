/* A scrap of paper with torn top and bottom edges, behind its children: the
start menu's buttons and your name tag. The tear comes from `seed`, so each
scrap keeps its own shape across renders. TornButton is a pressable scrap
with a hand-lettered label. */

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "../theme";

// Small deterministic random numbers (mulberry32), from a string seed.
function random(seed) {
    let state = [...seed].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 2654435761), 1779033703);
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Outline of a torn scrap: ragged top and bottom, nearly straight sides.
function getTornPath(width, height, seed, depth) {
    const next = random(seed);
    const step = 7;
    const points = [];
    for (let x = 0; x <= width; x += step) points.push([Math.min(x, width), next() * depth]);
    points.push([width, next() * depth]);
    points.push([width - next() * 1.5, height / 2]);
    for (let x = width; x >= 0; x -= step) points.push([Math.max(x, 0), height - next() * depth]);
    points.push([0, height - next() * depth]);
    points.push([next() * 1.5, height / 2]);
    return `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")} Z`;
}

export function TornPaper({ seed, depth = 4, style, children }) {
    const [size, setSize] = useState(null);
    return (
        <View style={style} onLayout={({ nativeEvent }) => setSize(nativeEvent.layout)}>
            {size ? (
                <Svg width={size.width} height={size.height + 4} style={styles.paper} pointerEvents="none">
                    {/* A soft shadow under the scrap, then the paper itself. */}
                    <Path
                        d={getTornPath(size.width, size.height, seed, depth)}
                        fill={colors.ink}
                        opacity={0.28}
                        transform="translate(1.5 3)"
                    />
                    <Path d={getTornPath(size.width, size.height, seed, depth)} fill={colors.paper} />
                </Svg>
            ) : null}
            {children}
        </View>
    );
}

// A menu button on a torn scrap; it tilts a little on hover and press.
export function TornButton({ label, accessibilityLabel, onPress, fontSize = 30, paddingHorizontal = 22, paddingVertical = 6 }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            style={({ pressed, hovered }) => [hovered && styles.hovered, pressed && styles.pressed]}
        >
            <TornPaper seed={label} depth={fontSize * 0.12} style={{ paddingHorizontal, paddingVertical }}>
                <Text style={[styles.label, { fontSize, lineHeight: fontSize * 1.25 }]}>{label}</Text>
            </TornPaper>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    paper: {
        position: "absolute",
        top: 0,
        left: 0,
    },
    label: {
        fontFamily: fonts.hand,
        color: colors.ink,
        textAlign: "center",
    },
    hovered: {
        transform: [{ rotate: "-1.5deg" }, { scale: 1.04 }],
    },
    pressed: {
        transform: [{ rotate: "-1deg" }, { scale: 0.97 }],
    },
});
