/* Start screen: title, a fan of showcase cards, and the Play / Card Deck buttons. */

import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Card from "../components/Card";
import { colors } from "../theme";

const showcase = [
    { id: "acorn-O", suit: "acorn", rank: "O" },
    { id: "bell-9", suit: "bell", rank: "9" },
    { id: "leaf-U", suit: "leaf", rank: "U" },
    { id: "heart-A", suit: "heart", rank: "A" },
];

function MenuButton({ label, onPress, primary = false }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed, hovered }) => [
                styles.button,
                primary && styles.buttonPrimary,
                (pressed || hovered) && styles.buttonActive,
            ]}
        >
            <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{label}</Text>
        </Pressable>
    );
}

function MenuScreen({ onPlay, onOpenDeck }) {
    const { height } = useWindowDimensions();
    const cardHeight = Math.min(height * 0.55, 340);
    const middle = (showcase.length - 1) / 2;

    return (
        <View style={styles.shell}>
            <View style={styles.intro}>
                <Text style={styles.subtitle}>Bavarian Card Game</Text>
                <Text style={styles.title}>Schafkopf</Text>

                <View style={styles.buttons}>
                    <MenuButton label="Play" onPress={onPlay} primary />
                    <MenuButton label="Card Deck" onPress={onOpenDeck} />
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
        borderWidth: 3,
        borderColor: colors.goldSoft,
        backgroundColor: colors.table,
        overflow: "hidden",
        padding: 16,
    },
    intro: {
        gap: 4,
    },
    subtitle: {
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 3,
        color: colors.gold,
    },
    title: {
        fontSize: 44,
        letterSpacing: 2,
        textTransform: "uppercase",
        fontWeight: "bold",
        color: "white",
    },
    buttons: {
        marginTop: 24,
        gap: 12,
        alignItems: "stretch",
    },
    button: {
        minWidth: 200,
        alignItems: "center",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 2,
        borderColor: colors.goldSoft,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
    },
    buttonPrimary: {
        backgroundColor: colors.gold,
        borderColor: colors.gold,
    },
    buttonActive: {
        opacity: 0.85,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 1.5,
        color: colors.goldText,
    },
    buttonTextPrimary: {
        color: colors.page,
    },
    fan: {
        alignItems: "center",
        justifyContent: "center",
    },
    fanCard: {
        position: "absolute",
        transformOrigin: "50% 100%",
    },
});

export default MenuScreen;
