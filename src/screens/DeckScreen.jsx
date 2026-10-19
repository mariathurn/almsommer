/* Overview of the whole deck: one paper panel per suit, strongest suit first.
Tap a card to see it large together with its number and points.
deck: the deck to show (Almsommer or classic); the chosen one when not given. */

import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Card from "../components/Card";
import SceneBackground from "../components/SceneBackground";
import PaperButton from "../components/PaperButton";
import { useStage } from "../components/Stage";
import { cardMeta } from "../data/cardMeta";
import { cardPoints, getCardNumber, suitColors, suitOrder } from "../data/cardDesign";
import { t } from "../i18n";
import { cardLabel, rankName, suitName } from "../i18n/names";
import { CARD_RATIO, colors, fonts, paper, softShadow } from "../theme";

const rankOrder = ["9", "K", "10", "A", "U", "O"];
const suitsStrongestFirst = [...suitOrder].reverse();

const PADDING = 16;
const PANEL_PADDING = 14;
const GAP = 10;

function DeckScreen({ deck, onBack }) {
    const [contentWidth, setContentWidth] = useState(0);
    const [selectedCard, setSelectedCard] = useState(null);
    const { isPortrait } = useStage();
    // The enlarged card opens in a modal over the whole window, outside the stage.
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const windowIsPortrait = windowHeight > windowWidth;
    const columns = isPortrait ? 3 : rankOrder.length;

    const rowWidth = contentWidth - PANEL_PADDING * 2;
    const cardWidth = rowWidth > 0 ? (rowWidth - GAP * (columns - 1)) / columns : 0;
    const cardHeight = Math.min(cardWidth / CARD_RATIO, 300);
    const largeCardHeight = windowIsPortrait
        ? Math.min(windowHeight * 0.55, (windowWidth * 0.8) / CARD_RATIO)
        : Math.min(windowHeight * 0.8, 560);

    return (
        <View style={styles.shell}>
            <SceneBackground />

            <View style={styles.header}>
                <PaperButton label={t("common.backToMenu")} compact onPress={onBack} />
                <View style={styles.titleTag}>
                    <Text style={styles.title}>{t("deck.title")}</Text>
                </View>
                <Text style={styles.hint}>{t("deck.hint")}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View onLayout={({ nativeEvent }) => setContentWidth(nativeEvent.layout.width)}>
                    {cardHeight > 0
                        ? suitsStrongestFirst.map((suit) => (
                              <View key={suit} style={styles.section}>
                                  <View style={styles.sectionHeader}>
                                      <View style={[styles.swatch, { backgroundColor: suitColors[suit].frame }]} />
                                      <Text style={styles.sectionTitle}>{suitName(suit)}</Text>
                                  </View>
                                  <View style={styles.row}>
                                      {rankOrder.map((rank) => {
                                          const card = cardMeta.find((c) => c.suit === suit && c.rank === rank);
                                          return (
                                              <Pressable
                                                  key={card.id}
                                                  onPress={() => setSelectedCard(card)}
                                                  accessibilityRole="button"
                                                  accessibilityLabel={`${rankName(rank)}, ${suitName(suit)}`}
                                                  style={({ pressed, hovered }) => [
                                                      styles.cardSlot,
                                                      hovered && styles.cardHovered,
                                                      pressed && styles.cardPressed,
                                                  ]}
                                              >
                                                  <View style={styles.cardShadow}>
                                                      <Card card={card} deck={deck} height={cardHeight} />
                                                  </View>
                                                  <Text style={styles.cardCaption}>{rankName(rank)}</Text>
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
                        <View style={[styles.detail, windowIsPortrait && styles.detailStacked]}>
                            <View style={styles.cardShadow}>
                                <Card card={selectedCard} deck={deck} height={largeCardHeight} />
                            </View>
                            <View style={styles.detailPanel}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.swatch, { backgroundColor: suitColors[selectedCard.suit].frame }]} />
                                    <Text style={styles.detailSuit}>{suitName(selectedCard.suit)}</Text>
                                </View>
                                <Text style={styles.detailTitle}>
                                    {cardLabel(selectedCard.rank)}
                                </Text>
                                <Text style={styles.detailLine}>{rankName(selectedCard.rank)}</Text>
                                <View style={styles.detailStats}>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>{getCardNumber(selectedCard)}</Text>
                                        <Text style={styles.statLabel}>{t("deck.rank")}</Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>{cardPoints[selectedCard.rank]}</Text>
                                        <Text style={styles.statLabel}>{t("deck.points")}</Text>
                                    </View>
                                </View>
                                <Text style={styles.detailHint}>{t("deck.closeHint")}</Text>
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
        color: colors.paper,
        opacity: 0.85,
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
        flexWrap: "wrap",
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
    detailStacked: {
        flexDirection: "column",
        gap: 14,
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
