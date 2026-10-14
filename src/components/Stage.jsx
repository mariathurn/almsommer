/* The canvas the whole app is laid out on, scaled to the screen like a
browser game. One side is fixed and the other flexes within limits, so the
window is filled without the layout drifting:

- landscape (desktop and web): 800 high, 1100 to 1700 wide
- portrait (phones): 430 wide, 640 to 1000 high

Outside those limits (very wide or almost square windows) the canvas is
centred with black bars. Screens read the canvas size with useStage()
instead of the window size. */

import { createContext, useContext, useState } from "react";
import { StyleSheet, View } from "react-native";

const LANDSCAPE_HEIGHT = 800;
const LANDSCAPE_WIDTH = { min: 1100, max: 1700 };
const PORTRAIT_WIDTH = 430;
const PORTRAIT_HEIGHT = { min: 640, max: 1000 };

const StageContext = createContext({ width: 1280, height: LANDSCAPE_HEIGHT, isPortrait: false, scale: 1 });

export function useStage() {
    return useContext(StageContext);
}

const clamp = (value, { min, max }) => Math.min(Math.max(value, min), max);

// Fixed side scales to the window; the other side takes what is left, within
// its limits. Then scale down if the clamped canvas doesn't fit.
function getStage(available) {
    const isPortrait = available.height > available.width;
    if (isPortrait) {
        const height = clamp((available.height * PORTRAIT_WIDTH) / available.width, PORTRAIT_HEIGHT);
        const scale = Math.min(available.width / PORTRAIT_WIDTH, available.height / height);
        return { width: PORTRAIT_WIDTH, height, scale, isPortrait };
    }
    const width = clamp((available.width * LANDSCAPE_HEIGHT) / available.height, LANDSCAPE_WIDTH);
    const scale = Math.min(available.width / width, available.height / LANDSCAPE_HEIGHT);
    return { width, height: LANDSCAPE_HEIGHT, scale, isPortrait };
}

function Stage({ children }) {
    const [available, setAvailable] = useState(null);
    const stage = available ? getStage(available) : null;

    return (
        <View style={styles.window} onLayout={({ nativeEvent }) => setAvailable(nativeEvent.layout)}>
            {stage ? (
                <StageContext.Provider value={stage}>
                    <View
                        style={[
                            styles.canvas,
                            {
                                width: stage.width,
                                height: stage.height,
                                left: (available.width - stage.width) / 2,
                                top: (available.height - stage.height) / 2,
                                transform: [{ scale: stage.scale }],
                            },
                        ]}
                    >
                        {children}
                    </View>
                </StageContext.Provider>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    window: {
        flex: 1,
        overflow: "hidden",
        backgroundColor: "#000000",
    },
    canvas: {
        position: "absolute",
        overflow: "hidden",
    },
});

export default Stage;
