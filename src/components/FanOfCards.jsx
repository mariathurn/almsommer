/* A layout component for a player's cards fanned out in a fan
Handles rotation and spacing for each player's hand.
Face-up hands are tappable. On your turn the cards you may play lift and the
others fade, so "follow suit" needs no pop-up. */

import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from "react-native";
import Card from "./Card";
import { canPlayCard, isTrumpForGame, sortHandForGame } from "../ai/schafkopfAI";
import { CARD_RATIO, fanWidth } from "../theme";

// How far a card rises, as a share of its height: playable cards sit a little
// higher, and hovering (or pressing) lifts them a bit further.
const PLAYABLE_RISE = 0.04;
const HOVER_RISE = 0.15;
const RISE_DURATION = 320;

// One tappable card in your hand. Its lift is animated with a slow ease.
function HandCard({ card, cardHeight, placement, isPlayable, isFaded, isTrump, accessibilityHint, onPress }) {
    const [isHovered, setIsHovered] = useState(false);
    const rise = useRef(new Animated.Value(0)).current;
    const target = isPlayable ? (isHovered ? HOVER_RISE : PLAYABLE_RISE) : 0;

    useEffect(() => {
        Animated.timing(rise, {
            toValue: -target * cardHeight,
            duration: RISE_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== "web",
        }).start();
    }, [target, cardHeight, rise]);

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            onPressIn={() => setIsHovered(true)}
            onPressOut={() => setIsHovered(false)}
            disabled={!isPlayable}
            accessibilityRole="button"
            accessibilityHint={accessibilityHint}
            style={[styles.card, placement, isFaded && styles.illegal]}
        >
            <Animated.View style={{ transform: [{ translateY: rise }] }}>
                <Card card={card} faceUp isTrump={isTrump} height={cardHeight} />
            </Animated.View>
        </Pressable>
    );
}

function FanOfCards({
    cards,
    cardHeight,
    faceUp = false,
    onPlayCard,
    isCurrentTurn = false,
    playedCards = [],
    spacing = 0.45,
    rotationStep = 4,
    trumpGame = null,
}) {
    if (!cards.length) return null;

    // With a game hovered or chosen, trumps are sorted to the left (strongest
    // first) and decorated. Taps still report the card's index in `cards`.
    const shown = trumpGame ? sortHandForGame(cards, trumpGame) : cards;

    const cardWidth = cardHeight * CARD_RATIO;
    const width = fanWidth(cards.length, cardHeight, spacing);
    const middle = (cards.length - 1) / 2;

    return (
        <View style={{ width, height: cardHeight }}>
            {shown.map((card, index) => {
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

                const isLegal = canPlayCard(card, cards, playedCards, trumpGame ?? undefined);
                const handIndex = cards.indexOf(card);
                const isPlayable = isCurrentTurn && isLegal;

                return (
                    <HandCard
                        key={card.id}
                        card={card}
                        cardHeight={cardHeight}
                        placement={placement}
                        isPlayable={isPlayable}
                        isFaded={isCurrentTurn && !isLegal}
                        isTrump={Boolean(trumpGame) && isTrumpForGame(card, trumpGame)}
                        accessibilityHint={!isLegal ? "Must follow suit" : undefined}
                        onPress={() => onPlayCard?.(handIndex)}
                    />
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
        opacity: 0.5,
    },
});

export default FanOfCards;
