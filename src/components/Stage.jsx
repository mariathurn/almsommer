/* A fixed-size canvas the whole app is laid out on, scaled to fit the screen,
like a browser game. Layouts only have to work at two sizes:

- landscape (desktop and web): 1280 x 800, scaled to fit and centred; the
  painted background, dimmed, fills any space around it
- portrait (phones): 430 wide, scaled to the screen width; the height follows
  the phone, so there are no bars

Screens read the canvas size with useStage() instead of the window size. */

import { createContext, useContext, useState } from "react";
import { StyleSheet, View } from "react-native";
import SceneBackground from "./SceneBackground";

const LANDSCAPE = { width: 1280, height: 800 };
const PORTRAIT_WIDTH = 430;

const StageContext = createContext({ ...LANDSCAPE, isPortrait: false, scale: 1 });

export function useStage() {
    return useContext(StageContext);
}

function getStage(available) {
    const isPortrait = available.height > available.width;
    if (isPortrait) {
        const scale = available.width / PORTRAIT_WIDTH;
        return { width: PORTRAIT_WIDTH, height: available.height / scale, scale, isPortrait };
    }
    const scale = Math.min(available.width / LANDSCAPE.width, available.height / LANDSCAPE.height);
    return { ...LANDSCAPE, scale, isPortrait };
}

function Stage({ children }) {
    const [available, setAvailable] = useState(null);
    const stage = available ? getStage(available) : null;

    return (
        <View style={styles.window} onLayout={({ nativeEvent }) => setAvailable(nativeEvent.layout)}>
            <SceneBackground />
            <View style={styles.dim} pointerEvents="none" />
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
    },
    dim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(15, 18, 28, 0.55)",
    },
    canvas: {
        position: "absolute",
        overflow: "hidden",
    },
});

export default Stage;
