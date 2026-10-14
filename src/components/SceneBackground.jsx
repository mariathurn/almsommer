/* The painted Alm at dusk behind every screen, filling it edge to edge. */

import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { sceneBackground } from "../data/uiArt";

function SceneBackground() {
    return <Image source={sceneBackground} style={StyleSheet.absoluteFill} contentFit="cover" pointerEvents="none" />;
}

export default SceneBackground;
