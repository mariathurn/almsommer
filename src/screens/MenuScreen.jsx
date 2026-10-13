/* Start screen: the meadow, a paper panel with the title and the Play /
Card Deck buttons, and a fan of showcase cards. */

import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Card from "../components/Card";
import MeadowBackground from "../components/MeadowBackground";
import PaperButton from "../components/PaperButton";
import { colors, fonts, paper, softShadow } from "../theme";

const showcase = [
    { id: "acorn-O", suit: "acorn", rank: "O" },
    { id: "bell-9", suit: "bell", rank: "9" },
    { id: "leaf-U", suit: "leaf", rank: "U" },
    { id: "heart-A", suit: "heart", rank: "A" },
];

function MenuScreen({ onPlay, onOpenDeck }) {
    const { width, height } = useWindowDimensions();
    const compact = width < 900;
    const cardHeight = Math.min(height * 0.55, 340);
    const middle = (showcase.length - 1) / 2;

    return (
        <View style={styles.shell}>
            <MeadowBackground />

            <View style={[styles.panel, compact && styles.panelCompact]}>
                <Text style={styles.kicker}>A trick-taking card game</Text>
                <Text style={[styles.title, compact && styles.titleCompact]}>Almsommer</Text>
                <Text style={styles.tagline}>
                    The annual Shepard's games are taking place. A mix of collaborative and solo challenges await!
                </Text>

                <View style={styles.buttons}>
                    <PaperButton label="Play" primary onPress={onPlay} />
                    <PaperButton label="Card Deck" onPress={onOpenDeck} />
                </View>
            </View>

            <View
                style={[styles.fan, { width: cardHeight * 1.4, height: cardHeight * 1.1 }]}
                pointerEvents="none"
            >
                {showcase.map((card, index) => {
                    const offset = index - middle;
                    return (
                        <View
                            key={card.id}
                            style={[
                                styles.fanCard,
                                {
                                    transform: [
                                        { translateX: offset * cardHeight * 0.22 },
                                        { translateY: Math.abs(offset) * cardHeight * 0.05 },
                                        { rotate: `${offset * 9}deg` },
                                    ],
                                },
                            ]}
                        >
                            <Card card={card} height={cardHeight} />
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        overflow: "hidden",
        padding: 16,
    },
    panel: {
        ...paper,
        borderRadius: 20,
        paddingVertical: 26,
        paddingHorizontal: 30,
        maxWidth: 400,
        gap: 4,
    },
    panelCompact: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        maxWidth: 330,
    },
    kicker: {
        fontFamily: fonts.bodyBold,
        fontSize: 13,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: colors.inkSoft,
    },
    title: {
        fontFamily: fonts.titleBlack,
        fontSize: 42,
        color: colors.ink,
    },
    titleCompact: {
        fontSize: 30,
    },
    tagline: {
        fontFamily: fonts.body,
        fontSize: 16,
        lineHeight: 21,
        color: colors.inkSoft,
    },
    buttons: {
        marginTop: 18,
        gap: 10,
    },
    fan: {
        alignItems: "center",
        justifyContent: "center",
    },
    fanCard: {
        position: "absolute",
        transformOrigin: "50% 100%",
        ...softShadow,
    },
});

export default MenuScreen;
