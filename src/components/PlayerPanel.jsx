/* PlayerPanel

Owns one seat at the table. South is your fanned hand, with your dark name
tag (role, game and coins) at the bottom of the screen. Opponents are
portrait profiles (see OpponentProfile). */

import { StyleSheet, Text, View } from "react-native";
import FanOfCards from "./FanOfCards";
import OpponentProfile, { CoinBox, DarkNameTag } from "./OpponentProfile";
import { TourTarget } from "./Tour";
import { gameName, statusName } from "../i18n/names";
import { CARD_RATIO, PROFILE_SCALE, fanWidth } from "../theme";

const SOUTH_SPACING = 0.55;
const SOUTH_ROTATION_STEP = 5;
// Phones: room kept between a card's number box and the screen edge.
const PHONE_EDGE = 8;

// Web: the fan centred, overlapping more when needed, with a margin for the
// tilt of the outer cards.
function getWideFan(count, width, edge, cardHeight) {
    const cardWidth = cardHeight * CARD_RATIO;
    const spacing =
        count > 1 ? Math.min(SOUTH_SPACING, (width - 2 * edge - 24 - cardWidth) / ((count - 1) * cardWidth)) : SOUTH_SPACING;
    const fanLength = count ? fanWidth(count, cardHeight, spacing) : 0;
    return { spacing, left: (width - fanLength) / 2 };
}

// Phones: the hand is wider than the screen, so the outer cards run off its
// edges. Each card's number box (top left, 24-132 x 20-188 of 500 x 784) stays
// on screen though: the leftmost card tilts its box outwards, the rightmost
// one inwards, so the fan sits a little to the right.
function getPhoneFan(count, width, cardHeight) {
    const cardWidth = cardHeight * CARD_RATIO;
    if (count < 2) return { spacing: SOUTH_SPACING, left: (width - cardWidth) / 2 };
    const tilt = (((count - 1) / 2) * SOUTH_ROTATION_STEP * Math.PI) / 180;
    // How far the box's outer corner reaches from the card's centre (cards turn
    // about their bottom middle).
    const leftReach = (0.5 - 24 / 500) * cardWidth * Math.cos(tilt) + (1 - 20 / 784) * cardHeight * Math.sin(tilt);
    const rightReach = -(0.5 - 132 / 500) * cardWidth * Math.cos(tilt) + (1 - 20 / 784) * cardHeight * Math.sin(tilt);
    const firstCentre = PHONE_EDGE + leftReach;
    const lastCentre = width - PHONE_EDGE - Math.max(rightReach, 0);
    const spacing = Math.min(SOUTH_SPACING, (lastCentre - firstCentre) / ((count - 1) * cardWidth));
    // With room to spare (few cards), centre the fan between those limits.
    const spare = lastCentre - firstCentre - spacing * (count - 1) * cardWidth;
    return { spacing, left: firstCentre + spare / 2 - cardWidth / 2 };
}

// Portrait: the three opponents share the top row, one column each, at
// slightly different heights.
const portraitColumn = { west: 0, north: 1, east: 2 };
const portraitDrop = { west: 34, north: 0, east: 20 };

function getOpponentPlacement(seat, layout) {
    const { edge, blanket } = layout;
    if (layout.portrait) {
        const columnWidth = layout.width / 3;
        return { left: portraitColumn[seat] * columnWidth, width: columnWidth, top: edge, alignItems: "center" };
    }
    // Side profiles are centred on the blanket's middle (profile ≈ 175 high).
    const lift = { transform: [{ translateY: -88 }] };

    switch (seat) {
        case "north":
            return {
                left: 0,
                right: 0,
                top: edge,
                alignItems: "center",
                justifyContent: "center",
            };
        case "west":
            return { left: edge + 6, top: blanket.centerY, alignItems: "center", ...lift };
        case "east":
        default:
            return { right: edge + 6, top: blanket.centerY, alignItems: "center", ...lift };
    }
}

function PlayerPanel({
    seat,
    layout,
    name,
    cards,
    isCurrentTurn,
    onPlayCard,
    playedCards = [],
    gameType = null,
    status = null,
    showFriendBadge = false,
    trumpGame = null,
    highlightTrumps = false,
    calledAce = null,
    isTrickWinner = false,
    score = 0,
    isOverTable = null,
    // Choosing a card instead of playing it (the marriage swap): one tap, or
    // dragging it onto the table, picks it; the picked card stays raised.
    selectMode = false,
    selectedCardId = null,
    selectableIds = null,
    isHighlighted = false,
    // "Kontra" or "Retour", if this player said it.
    call = null,
}) {
    // Larger profiles and tags in the web (landscape) view.
    const scale = layout.portrait ? 1 : PROFILE_SCALE;
    // Your own tag looks like the opponents' and sits at the bottom, with your
    // role and game ("Caller · Sheep Game") and your coins.
    const badge = showFriendBadge ? statusName("Friend") : gameType ? gameName(gameType) : null;
    const tag = (
        <DarkNameTag
            name={name}
            status={[statusName(status), badge, call].filter(Boolean).join(" · ") || null}
            isCurrentTurn={isCurrentTurn}
            isTrickWinner={isTrickWinner}
            scale={scale}
        >
            {/* Phones show your coins only here; the web view also in the banner row. */}
            {layout.portrait ? (
                <TourTarget id="coins">
                    <CoinBox coins={score} scale={scale} />
                </TourTarget>
            ) : (
                <CoinBox coins={score} scale={scale} />
            )}
        </DarkNameTag>
    );

    // Opponents: portrait profiles. On phones they stand in a staggered row at
    // the top; in landscape at the top and on both sides of the blanket.
    if (seat !== "south") {
        return (
            <View
                style={[
                    styles.seat,
                    getOpponentPlacement(seat, layout),
                    layout.portrait && { top: layout.edge + portraitDrop[seat] },
                ]}
                pointerEvents="none"
            >
                <OpponentProfile
                    size={70 * scale}
                    tagSide={!layout.portrait && seat === "north" ? "right" : "below"}
                    seat={seat}
                    name={name}
                    status={status}
                    coins={score}
                    isCurrentTurn={isCurrentTurn}
                    isTrickWinner={isTrickWinner}
                    isHighlighted={isHighlighted}
                    call={call}
                />
            </View>
        );
    }

    const { spacing, left } = layout.portrait
        ? getPhoneFan(cards.length, layout.width, layout.southCardHeight)
        : getWideFan(cards.length, layout.width, layout.edge, layout.southCardHeight);

    return (
        <>
            <View style={[styles.fan, { left, top: layout.southFanTop }]} pointerEvents="box-none">
                <FanOfCards
                    cards={cards}
                    cardHeight={layout.southCardHeight}
                    faceUp
                    onPlayCard={onPlayCard}
                    isCurrentTurn={isCurrentTurn}
                    playedCards={playedCards}
                    spacing={spacing}
                    rotationStep={SOUTH_ROTATION_STEP}
                    trumpGame={trumpGame}
                    highlightTrumps={highlightTrumps}
                    calledAce={calledAce}
                    confirmTap={!selectMode && Boolean(layout.portrait)}
                    isOverTable={isOverTable}
                    selectedCardId={selectedCardId}
                    selectableIds={selectableIds}
                />
            </View>
            <View
                style={[
                    styles.label,
                    styles.labelBottom,
                ]}
                pointerEvents="none"
            >
                <TourTarget id="name">{tag}</TourTarget>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    labelBottom: {
        left: 0,
        right: 0,
        bottom: 10,
        alignItems: "center",
    },
    seat: {
        position: "absolute",
        gap: 4,
    },
    fan: {
        position: "absolute",
    },
    label: {
        position: "absolute",
        zIndex: 5,
    },
});

export default PlayerPanel;
