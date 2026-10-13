import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors } from "../theme";

const gameOptions = ["Sau Spiel", "Solo", "Wenz", "Pass"];
const aceOptions = [
    { label: "Ace of Hearts", value: "heart" },
    { label: "Ace of Bells", value: "bell" },
    { label: "Ace of Acorns", value: "acorn" },
    { label: "Ace of Grass", value: "leaf" },
];

function HeaderButton({ label, onPress, compact }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed, hovered }) => [
                styles.button,
                compact && styles.buttonCompact,
                (pressed || hovered) && styles.buttonActive,
            ]}
        >
            <Text style={[styles.buttonText, compact && styles.textCompact]} numberOfLines={1}>
                {label}
            </Text>
        </Pressable>
    );
}

// Touch-friendly replacement for the web dropdowns: a modal list of options.
function OptionPicker({ title, visible, options, selected, onSelect, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <View style={styles.menu} accessibilityRole="menu" accessibilityLabel={title}>
                    <Text style={styles.menuTitle}>{title}</Text>
                    {options.map(({ label, value }) => (
                        <Pressable
                            key={value}
                            onPress={() => onSelect(value)}
                            style={({ pressed, hovered }) => [
                                styles.option,
                                (pressed || hovered) && styles.optionHover,
                                selected === value && styles.optionActive,
                            ]}
                        >
                            <Text style={[styles.optionText, selected === value && styles.optionTextActive]}>
                                {label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </Pressable>
        </Modal>
    );
}

function GameHeader({
    currentTurn,
    trickWinner,
    onDeal,
    selectedGame,
    onSelectGame,
    calledAce,
    onSelectCalledAce,
    playerHand = [],
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCalledAceOpen, setIsCalledAceOpen] = useState(false);
    const { width } = useWindowDimensions();
    const compact = width < 900;

    const availableAceOptions = useMemo(
        () =>
            aceOptions.filter(
                ({ value }) =>
                    !playerHand.some(
                        (card) => card.rank === "A" && card.suit === value
                    )
            ),
        [playerHand]
    );

    useEffect(() => {
        if (selectedGame === "Sau Spiel" && !calledAce && availableAceOptions.length > 0) {
            onSelectCalledAce?.(availableAceOptions[0].value);
        }

        if (selectedGame !== "Sau Spiel") {
            setIsCalledAceOpen(false);
        }
    }, [selectedGame, calledAce, availableAceOptions, onSelectCalledAce]);

    const handleSelectGame = (game) => {
        onSelectGame?.(game);
        setIsMenuOpen(false);

        if (game !== "Sau Spiel") {
            onSelectCalledAce?.(null);
        }
    };

    const calledAceLabel = calledAce
        ? aceOptions.find((opt) => opt.value === calledAce)?.label
        : "Select Ace";

    return (
        <View style={[styles.header, compact && styles.headerCompact]}>
            <View>
                {compact ? null : <Text style={styles.subtitle}>Bavarian Card Game</Text>}
                <Text style={[styles.title, compact && styles.titleCompact]}>Schafkopf</Text>
            </View>

            <View style={styles.controls}>
                {trickWinner ? (
                    <Text style={[styles.pill, compact && styles.textCompact]}>Trick: {trickWinner}</Text>
                ) : null}

                <Text style={[styles.pill, compact && styles.textCompact]}>Turn: {currentTurn}</Text>

                <HeaderButton
                    compact={compact}
                    label={`Game: ${selectedGame || "Pass"}`}
                    onPress={() => setIsMenuOpen(true)}
                />

                {selectedGame === "Sau Spiel" ? (
                    <HeaderButton
                        compact={compact}
                        label={`Call: ${calledAceLabel}`}
                        onPress={() => setIsCalledAceOpen(true)}
                    />
                ) : null}

                <HeaderButton compact={compact} label="Deal" onPress={onDeal} />
            </View>

            <OptionPicker
                title="Choose game"
                visible={isMenuOpen}
                options={gameOptions.map((game) => ({ label: game, value: game }))}
                selected={selectedGame}
                onSelect={handleSelectGame}
                onClose={() => setIsMenuOpen(false)}
            />

            <OptionPicker
                title="Choose called ace"
                visible={isCalledAceOpen}
                options={availableAceOptions}
                selected={calledAce}
                onSelect={(value) => {
                    onSelectCalledAce?.(value);
                    setIsCalledAceOpen(false);
                }}
                onClose={() => setIsCalledAceOpen(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 12,
    },
    headerCompact: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    subtitle: {
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 3,
        color: colors.gold,
    },
    title: {
        fontSize: 28,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        fontWeight: "bold",
        color: "white",
    },
    titleCompact: {
        fontSize: 18,
    },
    controls: {
        flexShrink: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 8,
    },
    pill: {
        borderRadius: 999,
        overflow: "hidden",
        paddingVertical: 4,
        paddingHorizontal: 12,
        fontSize: 14,
        fontWeight: "600",
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderWidth: 1,
        borderColor: colors.goldSoft,
        color: colors.goldText,
    },
    button: {
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
        backgroundColor: colors.button,
    },
    buttonCompact: {
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    buttonActive: {
        backgroundColor: "#b9d9ee",
    },
    buttonText: {
        fontSize: 14,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 0.7,
        color: "black",
    },
    textCompact: {
        fontSize: 12,
    },
    backdrop: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    menu: {
        minWidth: 220,
        gap: 4,
        padding: 8,
        borderRadius: 12,
        backgroundColor: colors.menu,
        borderWidth: 1,
        borderColor: colors.goldSoft,
    },
    menuTitle: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 12,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: colors.gold,
    },
    option: {
        borderWidth: 1,
        borderColor: "transparent",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
    },
    optionHover: {
        backgroundColor: "rgba(251, 191, 36, 0.15)",
        borderColor: "rgba(251, 191, 36, 0.5)",
    },
    optionActive: {
        backgroundColor: "rgba(251, 191, 36, 0.18)",
        borderColor: "rgba(251, 191, 36, 0.9)",
    },
    optionText: {
        fontSize: 15,
        color: "white",
    },
    optionTextActive: {
        color: colors.goldText,
    },
});

export default GameHeader;
