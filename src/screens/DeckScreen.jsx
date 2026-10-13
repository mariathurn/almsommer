/* Overview of the whole deck: one paper panel per suit, strongest suit first.
Tap a card to see it large together with its number and points. */

import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Card from "../components/Card";
import MeadowBackground from "../components/MeadowBackground";
import PaperButton from "../components/PaperButton";
import { cardMeta } from "../data/cardMeta";
import { cardPoints, getCardNumber, rankDesign, suitColors, suitNames, suitOrder } from "../data/cardDesign";
import { CARD_RATIO, colors, fonts, paper, softShadow } from "../theme";

const rankOrder = ["9", "K", "10", "A", "U", "O"];
const rankNames = { "9": "Hat", K: "Staff", "10": "Grain", A: "Sheep", U: "Dog", O: "Shepherd" };
const suitsStrongestFirst = [...suitOrder].reverse();

const PADDING = 16;
const PANEL_PADDING = 14;
const GAP = 10;

function DeckScreen({ onBack }) {
    const [contentWidth, setContentWidth] = useState(0);
    const [selectedCard, setSelectedCard] = useState(null);
    const { height: windowHeight } = useWindowDimensions();

    const rowWidth = contentWidth - PANEL_PADDING * 2;
    const cardWidth = rowWidth > 0 ? (rowWidth - GAP * (rankOrder.length - 1)) / rankOrder.length : 0;
    const cardHeight = Math.min(cardWidth / CARD_RATIO, 300);
    const largeCardHeight = Math.min(windowHeight * 0.8, 560);

    return (
        <View style={styles.shell}>
            <MeadowBackground />

            <View style={styles.header}>
                <PaperButton label="‹ Menu" compact onPress={onBack} />
                <View style={styles.titleTag}>
                    <Text style={styles.title}>The Deck</Text>
                </View>
                <Text style={styles.hint}>Tap a card to look closer</Text>
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
                                                  style={({ pressed, hovered }) => [
                                                      styles.cardSlot,
                                                      hovered && styles.cardHovered,
                                                      pressed && styles.cardPressed,
                                                  ]}
                                              >
                                                  <View style={styles.cardShadow}>
                                                      <Card card={card} height={cardHeight} />
                                                  </View>
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
                            <View style={styles.cardShadow}>
                                <Card card={selectedCard} height={largeCardHeight} />
                            </View>
                            <View style={styles.detailPanel}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.swatch, { backgroundColor: suitColors[selectedCard.suit].frame }]} />
                                    <Text style={styles.detailSuit}>{suitNames[selectedCard.suit]}</Text>
                                </View>
                                <Text style={styles.detailTitle}>
                                    {rankDesign[selectedCard.rank]?.label ?? rankNames[selectedCard.rank]}
                                </Text>
                                <Text style={styles.detailLine}>{rankNames[selectedCard.rank]}</Text>
                                <View style={styles.detailStats}>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>{getCardNumber(selectedCard)}</Text>
                                        <Text style={styles.statLabel}>Rank</Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>{cardPoints[selectedCard.rank]}</Text>
                                        <Text style={styles.statLabel}>Points</Text>
                                    </View>
                                </View>
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
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: PADDING,
        paddingVertical: 10,
    },
    titleTag: {
        ...paper,
        paddingVertical: 4,
        paddingHorizontal: 16,
    },
    title: {
        fontFamily: fonts.title,
        fontSize: 22,
        color: colors.ink,
    },
    hint: {
        marginLeft: "auto",
        fontFamily: fonts.bodyMedium,
        fontSize: 14,
        color: colors.ink,
        opacity: 0.75,
    },
    content: {
        paddingHorizontal: PADDING,
        paddingBottom: PADDING,
    },
    section: {
        ...paper,
        borderRadius: 16,
        padding: PANEL_PADDING,
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
    },
    swatch: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: colors.ink,
    },
    sectionTitle: {
        fontFamily: fonts.title,
        fontSize: 20,
        color: colors.ink,
    },
    row: {
        flexDirection: "row",
        gap: GAP,
    },
    cardSlot: {
        alignItems: "center",
    },
    cardHovered: {
        transform: [{ translateY: -3 }],
    },
    cardPressed: {
        opacity: 0.85,
    },
    cardShadow: {
        ...softShadow,
    },
    cardCaption: {
        marginTop: 5,
        fontFamily: fonts.bodyMedium,
        fontSize: 14,
        color: colors.inkSoft,
    },
    backdrop: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.scrim,
    },
    detail: {
        flexDirection: "row",
        alignItems: "center",
        gap: 24,
    },
    detailPanel: {
        ...paper,
        borderRadius: 18,
        padding: 22,
        gap: 4,
        minWidth: 220,
    },
    detailSuit: {
        fontFamily: fonts.bodyBold,
        fontSize: 16,
        color: colors.ink,
    },
    detailTitle: {
        fontFamily: fonts.titleBlack,
        fontSize: 34,
        color: colors.ink,
    },
    detailLine: {
        fontFamily: fonts.body,
        fontSize: 17,
        color: colors.inkSoft,
    },
    detailStats: {
        flexDirection: "row",
        gap: 22,
        marginTop: 12,
    },
    stat: {
        alignItems: "center",
    },
    statValue: {
        fontFamily: fonts.number,
        fontSize: 30,
        color: colors.ink,
    },
    statLabel: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.inkSoft,
    },
    detailHint: {
        marginTop: 14,
        fontFamily: fonts.body,
        fontSize: 13,
        color: colors.inkSoft,
    },
});

export default DeckScreen;
