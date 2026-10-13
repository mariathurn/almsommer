/* A layout component for a player's cards fanned out in a fan
Handles rotation and spacing for each player's hand.
Face-up hands are tappable; face-down hands are display only. */

import { Pressable, StyleSheet, View } from "react-native";
import Card from "./Card";
import { canPlayCard } from "../ai/schafkopfAI";
import { CARD_RATIO, fanWidth } from "../theme";

function FanOfCards({
    cards,
    cardHeight,
    faceUp = false,
    onPlayCard,
    isCurrentTurn = false,
    playedCards = [],
    spacing = 0.45,
    rotationStep = 4,
}) {
    if (!cards.length) return null;

    const cardWidth = cardHeight * CARD_RATIO;
    const width = fanWidth(cards.length, cardHeight, spacing);
    const middle = (cards.length - 1) / 2;
    const lift = cardHeight * 0.14;

    return (
        <View style={{ width, height: cardHeight }}>
            {cards.map((card, index) => {
                const offset = index - middle;
                const placement = {
                    left: index * cardWidth * spacing,
                    transform: [
                        { translateY: offset * offset * cardHeight * 0.012 },
                        { rotate: `${offset * rotationStep}deg` },
                    ],
                };

                if (!faceUp) {
                    return (
                        <View key={card.id} style={[styles.card, placement]}>
                            <Card card={card} faceUp={false} height={cardHeight} />
                        </View>
                    );
                }

                const isLegal = canPlayCard(card, cards, playedCards);
                const isDisabled = !isCurrentTurn || !isLegal;

                return (
                    <Pressable
                        key={card.id}
                        onPress={() => onPlayCard?.(index)}
                        disabled={isDisabled}
                        accessibilityRole="button"
                        accessibilityHint={!isLegal ? "Must follow suit" : undefined}
                        style={({ pressed, hovered }) => [
                            styles.card,
                            placement,
                            isCurrentTurn && !isLegal && styles.illegal,
                            !isDisabled && (pressed || hovered) && {
                                top: -lift,
                            },
                        ]}
                    >
                        <Card card={card} faceUp height={cardHeight} />
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        position: "absolute",
        top: 0,
        transformOrigin: "50% 100%",
    },
    illegal: {
        opacity: 0.45,
    },
});

export default FanOfCards;
