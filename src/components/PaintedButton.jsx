/* A button drawn by hand as an image (play, achievements, settings on the
title screen). It tilts and grows a little on hover or press. */

import { Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";

function PaintedButton({ art, height, label, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed, hovered }) => [
                { width: height * art.ratio, height },
                hovered && styles.hovered,
                pressed && styles.pressed,
            ]}
        >
            <Image source={art.source} contentFit="contain" style={StyleSheet.absoluteFill} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    hovered: {
        transform: [{ rotate: "-1.5deg" }, { scale: 1.04 }],
    },
    pressed: {
        transform: [{ rotate: "-1deg" }, { scale: 0.97 }],
    },
});

export default PaintedButton;
