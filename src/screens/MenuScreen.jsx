/* Title screen, after the "Almsommer" sketches: the painted Alm at dusk, the
brush-lettered title, shepherds that slide in from the sides, and hand-drawn
buttons. Landscape shows all four shepherds; portrait (phones) shows a random
pair, blue and orange or red and green. */

import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import HandDrawnButton from "../components/HandDrawnButton";
import SceneBackground from "../components/SceneBackground";
import { useStage } from "../components/Stage";
import { TITLE_RATIO, menuShepherds, titleLettering } from "../data/uiArt";

// Landscape: the inner figure of each pair overlaps the outer one by this
// share of its width.
const PAIR_OFFSET = 0.62;
const SLIDE_DURATION = 1100;
const portraitPairs = [
    ["blue", "orange"],
    ["red", "green"],
];

function getLandscapeFigures(width, height) {
    const { blue, red, green, orange } = menuShepherds;
    const leftPairWidth = blue.ratio + red.ratio * PAIR_OFFSET;
    const rightPairWidth = orange.ratio + green.ratio * PAIR_OFFSET;
    const figureHeight = Math.min(height * 1.15, (width * 0.45) / Math.max(leftPairWidth, rightPairWidth));
    const w = (figure) => figureHeight * figure.ratio;
    return [
        { key: "blue", side: "left", left: -w(blue) * 0.05 },
        { key: "red", side: "left", left: w(blue) * 0.95 - w(red) * (1 - PAIR_OFFSET) },
        { key: "green", side: "right", left: width - w(orange) * 0.97 - w(green) * PAIR_OFFSET },
        { key: "orange", side: "right", left: width - w(orange) * 0.97 },
    ].map((f) => ({ ...f, height: figureHeight, bottom: -figureHeight * 0.16 }));
}

// Portrait: two figures from below the title down to the bottom edge, each
// partly off its side of the screen; the right one is drawn first so the left
// one stands in front.
function getPortraitFigures(width, height, [leftKey, rightKey]) {
    const figureHeight = height * 0.74;
    const leftWidth = figureHeight * menuShepherds[leftKey].ratio;
    const rightWidth = figureHeight * menuShepherds[rightKey].ratio;
    return [
        { key: rightKey, side: "right", left: width - rightWidth * 0.86 },
        { key: leftKey, side: "left", left: -leftWidth * 0.16 },
    ].map((f) => ({ ...f, height: figureHeight, bottom: -figureHeight * 0.06 }));
}

// One shepherd sliding in from its side of the screen with an ease-out.
function SlidingFigure({ figure, stageWidth }) {
    const shepherd = menuShepherds[figure.key];
    const figureWidth = figure.height * shepherd.ratio;
    const start = figure.side === "left" ? -(figure.left + figureWidth) : stageWidth - figure.left;
    const offset = useRef(new Animated.Value(start)).current;

    useEffect(() => {
        Animated.timing(offset, {
            toValue: 0,
            duration: SLIDE_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== "web",
        }).start();
    }, [offset]);

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.figure,
                {
                    width: figureWidth,
                    height: figure.height,
                    left: figure.left,
                    bottom: figure.bottom,
                    transform: [{ translateX: offset }],
                },
            ]}
        >
            <Image source={shepherd.source} contentFit="contain" style={StyleSheet.absoluteFill} />
        </Animated.View>
    );
}

function MenuScreen({ onPlay, onOpenDeck }) {
    const { width, height, isPortrait } = useStage();
    const [pair] = useState(() => portraitPairs[Math.floor(Math.random() * portraitPairs.length)]);

    const figures = isPortrait ? getPortraitFigures(width, height, pair) : getLandscapeFigures(width, height);
    const titleWidth = isPortrait ? width * 0.9 : Math.min(width * 0.56, 760);
    const playSize = isPortrait ? 84 : Math.max(Math.min(height * 0.09, 70), 34);

    return (
        <View style={styles.shell}>
            <SceneBackground />

            {figures.map((figure) => (
                <SlidingFigure key={`${isPortrait}-${figure.key}`} figure={figure} stageWidth={width} />
            ))}

            <View style={[styles.centre, isPortrait && styles.centrePortrait]} pointerEvents="box-none">
                <Image
                    source={titleLettering}
                    contentFit="contain"
                    accessibilityLabel="Almsommer"
                    style={{
                        width: titleWidth,
                        height: titleWidth / TITLE_RATIO,
                        // Portrait: buttons sit over the lower half, between the figures.
                        marginBottom: isPortrait ? height * 0.27 : height * 0.07,
                    }}
                />
                <View style={[styles.buttons, { gap: Math.max(height * (isPortrait ? 0.03 : 0.05), 26) }]}>
                    <HandDrawnButton label="play" fontSize={playSize} onPress={onPlay} accessibilityLabel="Play" />
                    <HandDrawnButton
                        label="card deck"
                        fontSize={playSize * (isPortrait ? 0.5 : 0.58)}
                        onPress={onOpenDeck}
                        accessibilityLabel="Card Deck"
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        flex: 1,
        overflow: "hidden",
    },
    figure: {
        position: "absolute",
    },
    centre: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        paddingTop: "4%",
    },
    centrePortrait: {
        paddingTop: "8%",
    },
    buttons: {
        alignItems: "center",
    },
});

export default MenuScreen;
