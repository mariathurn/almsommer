/* The middle area that shows the current trick / played cards
Easy to style and isolate from the rest of the table */

import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { colors } from "../theme";

function TableCenter({ board, playedCards, trickWinner, gameResult }) {
    const cardHeight = board.size * 0.6;
    const step = cardHeight * 0.06;

    return (
        <View
            pointerEvents="none"
            style={[
                styles.board,
                {
                    width: board.size,
                    height: board.size,
                    left: board.centerX - board.size / 2,
                    top: board.centerY - board.size / 2,
                },
            ]}
        >
            {playedCards.length > 0 ? (
                playedCards.map(({ player, card }, index) => (
                    <View
                        key={`${player}-${index}`}
                        style={[
                            styles.playedCard,
                            {
                                transform: [
                                    { translateX: index * step },
                                    { translateY: index * step },
                                    { rotate: `${index * 15}deg` },
                                ],
                            },
                        ]}
                    >
                        <Card card={card} faceUp height={cardHeight} />
                    </View>
                ))
            ) : gameResult ? (
                <View style={styles.result}>
                    <Text style={styles.announcement}>{gameResult.message}</Text>
                    <Text style={styles.announcement}>{gameResult.points}</Text>
                </View>
            ) : (
                <Text style={styles.announcement}>
                    {trickWinner ? `${trickWinner} wins the trick!` : "Play!"}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    board: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: colors.gold,
        borderRadius: 9999,
        backgroundColor: colors.table,
        padding: 12,
    },
    playedCard: {
        position: "absolute",
    },
    result: {
        alignItems: "center",
        gap: 8,
    },
    announcement: {
        textAlign: "center",
        fontSize: 12,
        fontWeight: "900",
        lineHeight: 20,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: colors.textMuted,
    },
});

export default TableCenter;
