/* PlayerPanel

Owns one seat at the table. South is your fanned hand, with your dark name
tag (role, game and coins) at the bottom of the screen. Opponents are
portrait profiles (see OpponentProfile). */

import { StyleSheet, Text, View } from "react-native";
import FanOfCards from "./FanOfCards";
import OpponentProfile, { CoinBox, DarkNameTag } from "./OpponentProfile";
import { getGameType } from "../data/gameTypes";
import { CARD_RATIO, PROFILE_SCALE, fanWidth } from "../theme";

const SOUTH_SPACING = 0.55;
const SOUTH_ROTATION_STEP = 5;

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
}) {
    // Larger profiles and tags in the web (landscape) view.
    const scale = layout.portrait ? 1 : PROFILE_SCALE;
    // Your own tag looks like the opponents' and sits at the bottom, with your
    // role and game ("Caller · Sheep Game") and your coins.
    const badge = showFriendBadge ? "Friend" : getGameType(gameType)?.label;
    const tag = (
        <DarkNameTag
            name={name}
            status={[status, badge].filter(Boolean).join(" · ") || null}
            isCurrentTurn={isCurrentTurn}
            isTrickWinner={isTrickWinner}
            scale={scale}
        >
            <CoinBox coins={score} scale={scale} />
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
                />
            </View>
        );
    }

    // On narrow (portrait) screens the cards overlap more so the hand fits,
    // with a margin for the tilt of the outer cards.
    const cardWidth = layout.southCardHeight * CARD_RATIO;
    const spacing =
        cards.length > 1
            ? Math.min(SOUTH_SPACING, (layout.width - 2 * layout.edge - 24 - cardWidth) / ((cards.length - 1) * cardWidth))
            : SOUTH_SPACING;
    const fanLength = cards.length ? fanWidth(cards.length, layout.southCardHeight, spacing) : 0;
    // Portrait: nudged right, since the tilted fan otherwise looks left-heavy.
    const left = (layout.width - fanLength) / 2 + (layout.portrait ? cardWidth * 0.1 : 0);

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
                    confirmTap={Boolean(layout.portrait)}
                />
            </View>
            <View
                style={[
                    styles.label,
                    styles.labelBottom,
                ]}
                pointerEvents="none"
            >
                {tag}
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
