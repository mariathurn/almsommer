/* A gold halo that shines once behind its children, used to light up the card that
won the trick and the winner's name tag at the same moment. */

import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { colors } from "../theme";

const useNativeDriver = Platform.OS !== "web";

function WinnerGlow({ active, radius = 12, spread = 6, scaleTo = 1, children, style }) {
    const glow = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!active) {
            glow.setValue(0);
            return undefined;
        }
        // Shine once: flare up, then fade out.
        const pulse = Animated.sequence([
            Animated.timing(glow, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver }),
            Animated.timing(glow, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        ]);
        pulse.start();
        return () => pulse.stop();
    }, [active, glow]);

    const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] });

    return (
        <Animated.View style={[style, { transform: [{ scale }] }]}>
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.halo,
                    { top: -spread, left: -spread, right: -spread, bottom: -spread, borderRadius: radius + spread, opacity: glow },
                ]}
            />
            {/* Explicit stacking: the halo must stay behind the content on the web too. */}
            <View style={styles.content}>{children}</View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    content: {
        zIndex: 1,
    },
    halo: {
        position: "absolute",
        zIndex: 0,
        backgroundColor: colors.hay,
        shadowColor: colors.hay,
        shadowOpacity: 1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
    },
});

export default WinnerGlow;
