/* The marriage swap on the table: the card you give and the card you get.
Accepting an offer: pick the card to give from your hand, then tap the
offered trump to swap. Offering one: lay your trump on the field, wait for
an answer, then tap the card you got to play on. */

import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { t } from "../i18n";
import { cardName } from "../i18n/names";
import { cardShadow, colors, fonts } from "../theme";

const ROW_GAP = 16;
const ARROW_WIDTH = 28;

function Slot({ caption, cardHeight, children }) {
    return (
        <View style={styles.slot}>
            <Text style={styles.caption}>{caption}</Text>
            <View style={{ height: cardHeight, justifyContent: "center" }}>{children}</View>
        </View>
    );
}

// An empty place on the swap field, waiting for a card.
function EmptySlot({ width, height }) {
    return (
        <View style={[styles.empty, { width, height }]}>
            <Text style={styles.emptyText}>?</Text>
        </View>
    );
}

// given: the card you give (null: empty slot). received: the card you get
// (null: empty slot, e.g. while the others decide). Once both are there,
// tapping the received card calls onConfirm. hint / waitingHint: the line
// under the cards when it can be tapped / before that.
function MarriageExchange({ blanket, given, received, onConfirm, hint = t("marriage.exchangeConfirm"), waitingHint = t("marriage.exchangePick") }) {
    const cardHeight = blanket.width * 0.7;
    const cardWidth = cardHeight * (500 / 784);
    const ready = Boolean(given && received && onConfirm);
    const rowWidth = cardWidth * 2 + ROW_GAP * 2 + ARROW_WIDTH;

    return (
        <View
            style={[styles.wrap, { left: blanket.centerX - rowWidth / 2, top: blanket.centerY - cardHeight * 0.68, width: rowWidth }]}
            pointerEvents="box-none"
        >
            <View style={styles.row} pointerEvents="box-none">
                <Slot caption={t("marriage.exchangeGive")} cardHeight={cardHeight}>
                    {given ? (
                        <View style={styles.shadow}>
                            <Card card={given} height={cardHeight} />
                        </View>
                    ) : (
                        <EmptySlot width={cardWidth} height={cardHeight} />
                    )}
                </Slot>
                <Text style={styles.arrow}>⇄</Text>
                <Slot caption={t("marriage.exchangeGet")} cardHeight={cardHeight}>
                    {received ? (
                        <Pressable
                            onPress={onConfirm}
                            disabled={!ready}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !ready }}
                            accessibilityLabel={
                                ready
                                    ? t("marriage.exchangeConfirmLabel", { give: cardName(given), get: cardName(received) })
                                    : cardName(received)
                            }
                            style={({ hovered, pressed }) => [
                                styles.shadow,
                                ready && styles.newCardReady,
                                ready && (hovered || pressed) && styles.newCardHovered,
                            ]}
                        >
                            <Card card={received} height={cardHeight} />
                        </Pressable>
                    ) : (
                        <EmptySlot width={cardWidth} height={cardHeight} />
                    )}
                </Slot>
            </View>
            <Text style={[styles.hint, !ready && styles.hintMuted]}>{ready ? hint : waitingHint}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: "absolute",
        alignItems: "center",
        gap: 16,
        zIndex: 6,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: ROW_GAP,
    },
    slot: {
        alignItems: "center",
        gap: 10,
    },
    caption: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        overflow: "hidden",
        backgroundColor: colors.ink,
        fontFamily: fonts.bodyBold,
        fontSize: 12,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: "#ffffff",
    },
    shadow: {
        borderRadius: 12,
        ...cardShadow,
    },
    empty: {
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        borderRadius: 12,
        borderWidth: 2.5,
        borderStyle: "dashed",
        borderColor: colors.ink,
        backgroundColor: "rgba(247, 243, 233, 0.6)",
    },
    emptyText: {
        fontFamily: fonts.hand,
        fontSize: 48,
        textAlign: "center",
        color: colors.ink,
    },
    arrow: {
        width: ARROW_WIDTH,
        textAlign: "center",
        alignSelf: "center",
        marginTop: 26,
        fontFamily: fonts.bodyBold,
        fontSize: 28,
        color: colors.ink,
    },
    // The new card glows gold once there is a card to give for it.
    newCardReady: {
        borderRadius: 14,
        borderWidth: 4,
        borderColor: colors.hay,
        transform: [{ translateY: -4 }],
    },
    newCardHovered: {
        transform: [{ translateY: -8 }, { scale: 1.03 }],
    },
    hint: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        overflow: "hidden",
        backgroundColor: colors.ink,
        fontFamily: fonts.bodyBold,
        fontSize: 15,
        color: "#ffffff",
    },
    hintMuted: {
        backgroundColor: "rgba(20, 18, 16, 0.7)",
    },
});

export default MarriageExchange;
