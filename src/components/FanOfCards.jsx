/* A layout component for a player's cards fanned out in a fan
Handles rotation and spacing for each player's hand.
Face-up hands are tappable. On your turn the cards you may play lift and the
others fade, so "follow suit" needs no pop-up. Playable cards can also be
dragged onto the table: letting go over it plays the card, anywhere else the
card springs back into the hand. */

import { useEffect, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, View } from "react-native";
import Card from "./Card";
import { canPlayCard, isTrumpForGame, sortHandForGame } from "../ai/schafkopfAI";
import { t } from "../i18n";
import { CARD_RATIO, fanWidth } from "../theme";

// How far a card rises, as a share of its height: playable cards sit a little
// higher, hovering (or pressing) lifts them further, and while a game is
// hovered in the picker its trumps rise to stand out.
const PLAYABLE_RISE = 0.04;
const HOVER_RISE = 0.25;
const PREVIEW_RISE = 0.1;
const RISE_DURATION = 320;
// Re-sorting glides cards to their new place; the trump corner fades in and out.
const MOVE_DURATION = 380;
const FADE_DURATION = 300;
// A press becomes a drag once the pointer moves this far (pixels).
const DRAG_THRESHOLD = 6;
// A dragged card grows a little, and a little more while it is over the table.
const DRAG_SCALE = 1.05;
const DROP_SCALE = 1.12;

const useNativeDriver = Platform.OS !== "web";
const ease = Easing.out(Easing.cubic);

// One card in your hand. Position, lift and trump decoration are animated:
// `slot` is its place in the fan, and the trump version of the card is
// cross-faded over the plain one.
function HandCard({
    card,
    cardHeight,
    slot,
    slotCount,
    spacing,
    rotationStep,
    isPlayable,
    isFaded,
    isTrump,
    isHighlighted,
    isSelected = false,
    trumpGame = null,
    accessibilityHint,
    onPress,
    isOverTable,
    onDropPlay,
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const drag = useRef(new Animated.ValueXY()).current;
    const dragScale = useRef(new Animated.Value(1)).current;
    const overTable = useRef(false);
    // Set when a press turns into a drag, so letting go doesn't also count as a tap.
    const wasDragged = useRef(false);
    const [showTrumpLayer, setShowTrumpLayer] = useState(isTrump);
    const rise = useRef(new Animated.Value(0)).current;
    const position = useRef(new Animated.Value(slot)).current;
    const trumpOpacity = useRef(new Animated.Value(isTrump ? 1 : 0)).current;

    let target = 0;
    if (isPlayable) target = isHovered || isSelected ? HOVER_RISE : PLAYABLE_RISE;
    if (isHighlighted) target = Math.max(target, PREVIEW_RISE);

    useEffect(() => {
        Animated.timing(rise, { toValue: -target * cardHeight, duration: RISE_DURATION, easing: ease, useNativeDriver }).start();
    }, [target, cardHeight, rise]);

    useEffect(() => {
        Animated.timing(position, { toValue: slot, duration: MOVE_DURATION, easing: ease, useNativeDriver }).start();
    }, [slot, position]);

    useEffect(() => {
        if (isTrump) setShowTrumpLayer(true);
        Animated.timing(trumpOpacity, { toValue: isTrump ? 1 : 0, duration: FADE_DURATION, easing: ease, useNativeDriver }).start(
            ({ finished }) => {
                if (finished && !isTrump) setShowTrumpLayer(false);
            }
        );
    }, [isTrump, trumpOpacity]);

    // The pan responder is created once, so it reads the latest props from here.
    const latest = useRef({});
    latest.current = { isPlayable, isOverTable, onDropPlay };
    const panResponder = useRef(
        PanResponder.create({
            // Taps and hovers stay with the Pressable; only a real move becomes a drag.
            onMoveShouldSetPanResponderCapture: (_, gesture) =>
                Boolean(latest.current.isPlayable && latest.current.onDropPlay) &&
                Math.hypot(gesture.dx, gesture.dy) > DRAG_THRESHOLD,
            onPanResponderGrant: () => {
                wasDragged.current = true;
                overTable.current = false;
                setIsDragging(true);
                Animated.timing(dragScale, { toValue: DRAG_SCALE, duration: 120, easing: ease, useNativeDriver }).start();
            },
            onPanResponderMove: (_, gesture) => {
                drag.setValue({ x: gesture.dx, y: gesture.dy });
                const isOver = Boolean(latest.current.isOverTable?.(gesture.moveX, gesture.moveY));
                if (isOver !== overTable.current) {
                    overTable.current = isOver;
                    Animated.timing(dragScale, {
                        toValue: isOver ? DROP_SCALE : DRAG_SCALE,
                        duration: 120,
                        easing: ease,
                        useNativeDriver,
                    }).start();
                }
            },
            onPanResponderRelease: (_, gesture) => {
                const isOver = Boolean(latest.current.isOverTable?.(gesture.moveX, gesture.moveY));
                if (isOver) latest.current.onDropPlay?.();
                // A played card leaves the hand; any other card glides back.
                endDrag();
            },
            onPanResponderTerminate: () => endDrag(),
            onPanResponderTerminationRequest: () => false,
        })
    ).current;

    function endDrag() {
        overTable.current = false;
        setIsHovered(false);
        Animated.parallel([
            Animated.spring(drag, { toValue: { x: 0, y: 0 }, friction: 7, tension: 70, useNativeDriver }),
            Animated.timing(dragScale, { toValue: 1, duration: 200, easing: ease, useNativeDriver }),
        ]).start(() => setIsDragging(false));
    }

    // Fan geometry as a function of the (animated) slot: shift, arc and tilt.
    const cardWidth = cardHeight * CARD_RATIO;
    const middle = (slotCount - 1) / 2;
    const slots = Array.from({ length: Math.max(slotCount, 2) }, (_, i) => i);
    const translateX = Animated.multiply(position, cardWidth * spacing);
    const arc = position.interpolate({
        inputRange: slots,
        outputRange: slots.map((i) => (i - middle) * (i - middle) * cardHeight * 0.012),
    });
    const rotate = position.interpolate({
        inputRange: [0, Math.max(slotCount - 1, 1)],
        outputRange: [`${-middle * rotationStep}deg`, `${(Math.max(slotCount - 1, 1) - middle) * rotationStep}deg`],
    });

    return (
        <Animated.View
            style={[
                styles.card,
                isDragging && styles.dragging,
                {
                    transform: [
                        { translateX: drag.x },
                        { translateY: drag.y },
                        { translateX },
                        { translateY: arc },
                        { rotate },
                        { scale: dragScale },
                    ],
                },
            ]}
            pointerEvents="box-none"
            {...panResponder.panHandlers}
        >
            <Pressable
                onPress={() => {
                    if (!wasDragged.current) onPress();
                }}
                onHoverIn={() => setIsHovered(true)}
                onHoverOut={() => setIsHovered(false)}
                onPressIn={() => {
                    wasDragged.current = false;
                    setIsHovered(true);
                }}
                onPressOut={() => setIsHovered(false)}
                disabled={!isPlayable}
                accessibilityRole="button"
                accessibilityHint={accessibilityHint}
            >
                <Animated.View style={{ transform: [{ translateY: rise }] }}>
                    <Card card={card} faceUp gameName={trumpGame} height={cardHeight} />
                    {showTrumpLayer ? (
                        <Animated.View style={[StyleSheet.absoluteFill, { opacity: trumpOpacity }]} pointerEvents="none">
                            <Card card={card} faceUp isTrump gameName={trumpGame} height={cardHeight} />
                        </Animated.View>
                    ) : null}
                    {/* Cards you may not play stay solid but are greyed a little. */}
                    {isFaded ? (
                        <View
                            pointerEvents="none"
                            style={[StyleSheet.absoluteFill, styles.dim, { borderRadius: cardHeight * 0.045 }]}
                        />
                    ) : null}
                </Animated.View>
            </Pressable>
        </Animated.View>
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
    highlightTrumps = false,
    confirmTap = false,
    calledAce = null,
    isOverTable = null,
    // A card picked outside of play (the marriage swap): it stays raised.
    selectedCardId = null,
    // Only these cards may be picked (the others are greyed); null: the rules decide.
    selectableIds = null,
}) {
    // Phones: the first tap raises a card, a second tap on it plays it.
    const [selectedId, setSelectedId] = useState(null);
    useEffect(() => {
        if (!isCurrentTurn) setSelectedId(null);
    }, [isCurrentTurn]);

    if (!cards.length) return null;

    // Trumps are sorted to the left (strongest first), by the hovered or chosen
    // game, and by the Sheep Game order right after the deal. Only a hovered or
    // chosen game decorates them. Taps still report the card's index in `cards`.
    const shown = sortHandForGame(cards, trumpGame ?? "Sau Spiel");

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

                const isLegal = selectableIds
                    ? selectableIds.includes(card.id)
                    : canPlayCard(card, cards, playedCards, trumpGame ?? undefined, calledAce);
                const handIndex = cards.indexOf(card);
                const isPlayable = isCurrentTurn && isLegal;

                const isTrump = Boolean(trumpGame) && isTrumpForGame(card, trumpGame);

                return (
                    <HandCard
                        key={card.id}
                        card={card}
                        cardHeight={cardHeight}
                        slot={index}
                        slotCount={shown.length}
                        spacing={spacing}
                        rotationStep={rotationStep}
                        isPlayable={isPlayable}
                        isFaded={isCurrentTurn && !isLegal}
                        isTrump={isTrump}
                        isHighlighted={highlightTrumps && isTrump}
                        isSelected={(confirmTap && selectedId === card.id) || selectedCardId === card.id}
                        trumpGame={trumpGame}
                        accessibilityHint={!isLegal ? t("hand.mustFollow") : undefined}
                        onPress={() => {
                            if (confirmTap && selectedId !== card.id) {
                                setSelectedId(card.id);
                                return;
                            }
                            setSelectedId(null);
                            onPlayCard?.(handIndex);
                        }}
                        isOverTable={isOverTable}
                        onDropPlay={
                            isOverTable
                                ? () => {
                                      setSelectedId(null);
                                      onPlayCard?.(handIndex);
                                  }
                                : null
                        }
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
        // Web: dragging a card must not select text on the page.
        userSelect: "none",
    },
    // The dragged card is drawn above the rest of the hand.
    dragging: {
        zIndex: 10,
    },
    dim: {
        backgroundColor: "rgba(40, 36, 32, 0.32)",
    },
});

export default FanOfCards;
