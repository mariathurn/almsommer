/* A round portrait: a head-and-shoulders crop of a card figure (see
data/portraits.js) on its card's panel colour and cloud texture, with an ink
outline. Used for the opponents, your profile and the portrait choices. */

import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { artSizes, cardTexture, suitColors } from "../data/cardDesign";
import { colors } from "../theme";

// Image size and offset so the head's centre lands in the circle's centre.
function getPortraitFrame({ file, centerX, centerY, span }, size) {
    const scale = size / span;
    const image = artSizes[file];
    return {
        width: image.width * scale,
        height: image.height * scale,
        left: size / 2 - centerX * scale,
        top: size / 2 - centerY * scale,
    };
}

function Portrait({ portrait, size, borderWidth = 4 }) {
    return (
        <View
            style={[
                styles.portrait,
                { width: size, height: size, borderRadius: size / 2, borderWidth, backgroundColor: suitColors[portrait.suit].panel },
            ]}
        >
            {/* The card's cloud texture over its panel colour, as on the cards. */}
            <Image source={cardTexture} contentFit="cover" style={[StyleSheet.absoluteFill, styles.texture]} />
            <Image source={portrait.source} contentFit="fill" style={[styles.image, getPortraitFrame(portrait, size)]} />
        </View>
    );
}

const styles = StyleSheet.create({
    portrait: {
        overflow: "hidden",
        borderColor: colors.ink,
    },
    texture: {
        opacity: 0.5,
    },
    image: {
        position: "absolute",
    },
});

export default Portrait;
