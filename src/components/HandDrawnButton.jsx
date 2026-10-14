/* A button that looks drawn by hand, after the title screen sketch: a chalky
paper wash with uneven edges, framed by four sketched lines that wobble and
overshoot the corners, and brush lettering. The wobble is derived from the
label, so a button always looks the same. */

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "../theme";

const WASH = "#efeae0";
const LINE = "#f4f0e8";

// Small deterministic random numbers in [-1, 1] from a text seed.
function makeJitter(seed) {
    let state = [...seed].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return (state / 2 ** 32) * 2 - 1;
    };
}

// A slightly wavy line from (x1, y1) to (x2, y2).
function sketchLine(x1, y1, x2, y2, wobble, jitter) {
    const mx = (x1 + x2) / 2 + jitter() * wobble;
    const my = (y1 + y2) / 2 + jitter() * wobble;
    return `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
}

function getSketch(width, height, label) {
    const jitter = makeJitter(label);
    const j = (amount) => jitter() * amount;
    const inset = 6;
    const left = inset;
    const right = width - inset;
    const top = inset;
    const bottom = height - inset;

    // Uneven wash, a little inside the frame lines.
    const wash = [
        `M${left + 3 + j(3)} ${top + 4 + j(3)}`,
        `L${width * 0.35} ${top + 2 + j(3)}`,
        `L${right - 3 + j(3)} ${top + 5 + j(3)}`,
        `L${right - 2 + j(3)} ${height * 0.5}`,
        `L${right - 4 + j(3)} ${bottom - 3 + j(3)}`,
        `L${width * 0.6} ${bottom - 1 + j(3)}`,
        `L${left + 4 + j(3)} ${bottom - 4 + j(3)}`,
        `L${left + 2 + j(3)} ${height * 0.45}`,
        "Z",
    ].join(" ");

    // Four frame lines, each overshooting past the corners.
    const over = () => 4 + Math.abs(j(10));
    const lines = [
        sketchLine(left - over(), top + j(2), right + over(), top + j(3), 3, jitter),
        sketchLine(right + j(2), top - over(), right + j(3), bottom + over(), 3, jitter),
        sketchLine(right + over(), bottom + j(2), left - over(), bottom + j(3), 3, jitter),
        sketchLine(left + j(2), bottom + over(), left + j(3), top - over(), 3, jitter),
    ];

    return { wash, lines };
}

function HandDrawnButton({ label, onPress, size = "large", fontSize, accessibilityLabel }) {
    const [box, setBox] = useState(null);
    const sketch = box ? getSketch(box.width, box.height, label) : null;
    const textSize = fontSize ?? (size === "large" ? 54 : 32);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            style={({ pressed, hovered }) => [
                styles.button,
                hovered && styles.hovered,
                pressed && styles.pressed,
            ]}
        >
            <View onLayout={({ nativeEvent }) => setBox(nativeEvent.layout)} style={styles.inner}>
                {sketch ? (
                    <Svg width={box.width} height={box.height} style={styles.sketch} pointerEvents="none">
                        <Path d={sketch.wash} fill={WASH} opacity={0.88} />
                        {sketch.lines.map((d, index) => (
                            <Path
                                key={index}
                                d={d}
                                fill="none"
                                stroke={LINE}
                                strokeWidth={size === "large" ? 4 : 3}
                                strokeLinecap="round"
                            />
                        ))}
                    </Svg>
                ) : null}
                <Text
                    style={[
                        styles.label,
                        {
                            fontSize: textSize,
                            lineHeight: textSize * 1.15,
                            // Brush letters reach past their box, so leave extra room.
                            paddingHorizontal: textSize * 0.6 + 6,
                            paddingVertical: textSize * 0.12,
                        },
                    ]}
                >
                    {label}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        alignSelf: "center",
    },
    inner: {
        overflow: "visible",
    },
    sketch: {
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "visible",
    },
    hovered: {
        transform: [{ rotate: "-1.5deg" }, { scale: 1.04 }],
    },
    pressed: {
        transform: [{ rotate: "-1deg" }, { scale: 0.98 }],
    },
    label: {
        fontFamily: fonts.hand,
        color: colors.ink,
        textAlign: "center",
    },
});

export default HandDrawnButton;
