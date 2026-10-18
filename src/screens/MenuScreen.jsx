/* Title screen, after the "Almsommer" sketches: the painted Alm at dusk, the
brush-lettered title, shepherds that slide in from the sides, and buttons on
torn scraps of paper. Your profile (portrait, name, savings) sits at the top
left and opens the profile panel. Landscape shows all four shepherds;
portrait (phones) shows a random pair, blue and orange or red and green. */

import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import ProfileBadge from "../components/ProfileBadge";
import ProfilePanel from "../components/ProfilePanel";
import SceneBackground from "../components/SceneBackground";
import SettingsPanel from "../components/SettingsPanel";
import { TornButton } from "../components/TornPaper";
import { useStage } from "../components/Stage";
import useHotkey from "../hooks/useHotkey";
import { sounds } from "../audio/sounds";
import { t } from "../i18n";
import { TITLE_RATIO, menuShepherds, titleLettering } from "../data/uiArt";
import { fillParent } from "../theme";

// Landscape: the inner figure of each pair overlaps the outer one by this
// share of its width.
const PAIR_OFFSET = 0.62;
const SLIDE_DURATION = 1100;
// Pressing Play: the shepherds walk back out to their sides while the title
// and buttons fade, then the game starts.
const EXIT_DURATION = 650;
const useNativeDriver = Platform.OS !== "web";
const portraitPairs = [
    ["blue", "orange"],
    ["red", "green"],
];

function getLandscapeFigures(width, height) {
    const { blue, red, green, orange } = menuShepherds;
    const leftPairWidth = blue.ratio + red.ratio * PAIR_OFFSET;
    const rightPairWidth = orange.ratio + green.ratio * PAIR_OFFSET;
    // Capped, so on wide windows the figures keep their size (and stay clear of
    // the title) and the extra width becomes space between them.
    const figureHeight = Math.min(height * 0.8, (width * 0.45) / Math.max(leftPairWidth, rightPairWidth));
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

// One shepherd sliding in from its side of the screen with an ease-out, and
// back out (ease-in) when `leaving` turns true.
function SlidingFigure({ figure, stageWidth, leaving = false }) {
    const shepherd = menuShepherds[figure.key];
    const figureWidth = figure.height * shepherd.ratio;
    const start = figure.side === "left" ? -(figure.left + figureWidth) : stageWidth - figure.left;
    const offset = useRef(new Animated.Value(start)).current;

    useEffect(() => {
        Animated.timing(offset, {
            toValue: 0,
            duration: SLIDE_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver,
        }).start();
    }, [offset]);

    useEffect(() => {
        if (!leaving) return;
        offset.stopAnimation();
        Animated.timing(offset, {
            toValue: start,
            duration: EXIT_DURATION,
            easing: Easing.in(Easing.cubic),
            useNativeDriver,
        }).start();
    }, [leaving]); // eslint-disable-line react-hooks/exhaustive-deps

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

function MenuScreen({ onPlay, onOpenPractice, onOpenAchievements, onOpenDeck }) {
    const { width, height, isPortrait } = useStage();
    const [pair] = useState(() => portraitPairs[Math.floor(Math.random() * portraitPairs.length)]);
    // The open panel, if any: "settings" or "profile".
    const [panel, setPanel] = useState(null);
    // Esc closes a panel (on other screens it goes back to the menu).
    useHotkey("Escape", () => setPanel(null), Boolean(panel));

    // Play: shepherds out, title and buttons fade, then the game.
    const [leaving, setLeaving] = useState(false);
    const fade = useRef(new Animated.Value(1)).current;
    const play = () => {
        if (leaving) return;
        setLeaving(true);
        sounds.sheep();
        Animated.timing(fade, { toValue: 0, duration: EXIT_DURATION * 0.7, easing: Easing.in(Easing.quad), useNativeDriver }).start();
        setTimeout(onPlay, EXIT_DURATION);
    };
    useHotkey("p", play, !panel && !leaving);

    const figures = isPortrait ? getPortraitFigures(width, height, pair) : getLandscapeFigures(width, height);
    const titleWidth = isPortrait ? width * 0.9 : Math.min(width * 0.56, 760);

    return (
        <View style={styles.shell}>
            <SceneBackground />

            {figures.map((figure) => (
                <SlidingFigure key={`${isPortrait}-${figure.key}`} figure={figure} stageWidth={width} leaving={leaving} />
            ))}

            <Animated.View
                style={[styles.centre, isPortrait && styles.centrePortrait, { opacity: fade }]}
                pointerEvents={leaving ? "none" : "box-none"}
            >
                <Image
                    source={titleLettering}
                    contentFit="contain"
                    accessibilityLabel="Almsommer"
                    style={{
                        width: titleWidth,
                        height: titleWidth / TITLE_RATIO,
                        // Portrait: buttons sit over the lower half, between the figures.
                        marginBottom: isPortrait ? height * 0.28 : height * 0.07,
                    }}
                />
                <View style={[styles.buttons, { gap: Math.max(height * (isPortrait ? 0.02 : 0.03), 14) }]}>
                    <TornButton label={t("menu.play")} accessibilityLabel={t("menu.playLabel")} fontSize={58} paddingHorizontal={60} paddingVertical={8} onPress={play} />
                    <TornButton label={t("menu.practice")} accessibilityLabel={t("menu.practiceLabel")} onPress={onOpenPractice} />
                    <TornButton label={t("menu.achievements")} accessibilityLabel={t("menu.achievementsLabel")} onPress={onOpenAchievements} />
                    <TornButton label={t("menu.settings")} accessibilityLabel={t("menu.settingsLabel")} paddingHorizontal={34} onPress={() => setPanel("settings")} />
                </View>
            </Animated.View>

            <Animated.View
                style={[styles.profile, isPortrait && styles.profilePortrait, { opacity: fade }]}
                pointerEvents={leaving ? "none" : "box-none"}
            >
                <ProfileBadge compact={isPortrait} onPress={() => setPanel("profile")} />
            </Animated.View>

            {panel === "settings" ? (
                <SettingsPanel
                    onClose={() => setPanel(null)}
                    onViewDeck={() => {
                        setPanel(null);
                        onOpenDeck();
                    }}
                />
            ) : null}
            {panel === "profile" ? <ProfilePanel onClose={() => setPanel(null)} /> : null}
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
        ...fillParent,
        alignItems: "center",
        paddingTop: "4%",
    },
    centrePortrait: {
        paddingTop: "23%",
    },
    buttons: {
        alignItems: "center",
    },
    profile: {
        position: "absolute",
        top: 22,
        left: 26,
    },
    profilePortrait: {
        top: 16,
        left: 16,
    },
});

export default MenuScreen;
