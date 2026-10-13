/* Overview of the whole deck: one row per suit, strongest suit first.
Tap a card to see it large together with its number and points. */

import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Card from "../components/Card";
import { cardMeta } from "../data/cardMeta";
import { cardPoints, getCardNumber, rankDesign, suitColors, suitNames, suitOrder } from "../data/cardDesign";
import { CARD_RATIO, colors } from "../theme";

const rankOrder = ["9", "K", "10", "A", "U", "O"];
const rankNames = { "9": "Hat", K: "Staff", "10": "Grain", A: "Sheep", U: "Dog", O: "Shepherd" };
const suitsStrongestFirst = [...suitOrder].reverse();

const PADDING = 16;
const GAP = 10;

function DeckScreen({ onBack }) {
    const [contentWidth, setContentWidth] = useState(0);
    const [selectedCard, setSelectedCard] = useState(null);
    const { height: windowHeight } = useWindowDimensions();

    const cardWidth = contentWidth ? (contentWidth - GAP * (rankOrder.length - 1)) / rankOrder.length : 0;
    const cardHeight = Math.min(cardWidth / CARD_RATIO, 300);
    const largeCardHeight = Math.min(windowHeight * 0.8, 560);

    return (
        <View style={styles.shell}>
            <View style={styles.header}>
                <Pressable
                    onPress={onBack}
                    accessibilityRole="button"
                    style={({ pressed, hovered }) => [styles.backButton, (pressed || hovered) && styles.backButtonActive]}
                >
                    <Text style={styles.backText}>‹ Menu</Text>
                </Pressable>
                <Text style={styles.title}>Card Deck</Text>
                <Text style={styles.hint}>Tap a card to enlarge it</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View onLayout={({ nativeEvent }) => setContentWidth(nativeEvent.layout.width)}>
                    {cardHeight > 0
                        ? suitsStrongestFirst.map((suit) => (
                              <View key={suit} style={styles.section}>
                                  <View style={styles.sectionHeader}>
                                      <View style={[styles.swatch, { backgroundColor: suitColors[suit].frame }]} />
                                      <Text style={styles.sectionTitle}>{suitNames[suit]}</Text>
                                  </View>
                                  <View style={styles.row}>
                                      {rankOrder.map((rank) => {
                                          const card = cardMeta.find((c) => c.suit === suit && c.rank === rank);
                                          return (
                                              <Pressable
                                                  key={card.id}
                                                  onPress={() => setSelectedCard(card)}
                                                  accessibilityRole="button"
                                                  accessibilityLabel={`${rankNames[rank]}, ${suitNames[suit]}`}
                                                  style={({ pressed }) => pressed && styles.cardPressed}
                                              >
                                                  <Card card={card} height={cardHeight} />
                                                  <Text style={styles.cardCaption}>{rankNames[rank]}</Text>
                                              </Pressable>
                                          );
                                      })}
                                  </View>
                              </View>
                          ))
                        : null}
                </View>
            </ScrollView>

            <Modal
                visible={Boolean(selectedCard)}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedCard(null)}
            >
                <Pressable style={styles.backdrop} onPress={() => setSelectedCard(null)}>
                    {selectedCard ? (
                        <View style={styles.detail}>
                            <Card card={selectedCard} height={largeCardHeight} />
                            <View style={styles.detailText}>
                                <Text style={styles.detailSuit}>{suitNames[selectedCard.suit]}</Text>
                                <Text style={styles.detailTitle}>
                                    {rankDesign[selectedCard.rank]?.label ?? rankNames[selectedCard.rank]}
                                </Text>
                                <Text style={styles.detailLine}>{rankNames[selectedCard.rank]}</Text>
                                <Text style={styles.detailLine}>Number {getCardNumber(selectedCard)}</Text>
                                <Text style={styles.detailLine}>{cardPoints[selectedCard.rank]} points</Text>
                                <Text style={styles.detailHint}>Tap anywhere to close</Text>
                            </View>
                        </View>
                    ) : null}
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        flex: 1,
        borderWidth: 3,
        borderColor: colors.goldSoft,
        backgroundColor: colors.table,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: PADDING,
        paddingVertical: 10,
    },
    backButton: {
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: colors.button,
    },
    backButtonActive: {
        backgroundColor: "#b9d9ee",
    },
    backText: {
        fontSize: 14,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 0.7,
        color: "black",
    },
    title: {
        fontSize: 22,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        fontWeight: "bold",
        color: "white",
    },
    hint: {
        marginLeft: "auto",
        fontSize: 12,
        color: colors.textMuted,
    },
    content: {
        paddingHorizontal: PADDING,
        paddingBottom: PADDING,
    },
    section: {
        marginBottom: 18,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    swatch: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: "#1f1c19",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "900",
        letterSpacing: 2.5,
        textTransform: "uppercase",
        color: colors.goldText,
    },
    row: {
        flexDirection: "row",
        gap: GAP,
    },
    cardPressed: {
        opacity: 0.8,
    },
    cardCaption: {
        marginTop: 4,
        textAlign: "center",
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: colors.textMuted,
    },
    backdrop: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    detail: {
        flexDirection: "row",
        alignItems: "center",
        gap: 28,
    },
    detailText: {
        gap: 6,
    },
    detailSuit: {
        fontSize: 13,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: colors.gold,
    },
    detailTitle: {
        fontSize: 34,
        fontWeight: "bold",
        letterSpacing: 2,
        color: "white",
    },
    detailLine: {
        fontSize: 16,
        color: colors.text,
    },
    detailHint: {
        marginTop: 16,
        fontSize: 12,
        color: colors.textMuted,
    },
});

export default DeckScreen;
