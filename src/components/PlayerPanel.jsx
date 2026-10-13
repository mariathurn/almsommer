/* PlayerPanel

Owns one seat at the table: the player's name/status and their fanned hand.
South plays face up and can tap cards; the other seats show card backs,
rotated so their cards point toward the middle of the table. */

import { StyleSheet, View } from "react-native";
import FanOfCards from "./FanOfCards";
import PlayerName from "./PlayerName";
import { fanWidth } from "../theme";

const seatFan = {
    south: { spacing: 0.72, rotationStep: 5, rotation: "0deg" },
    north: { spacing: 0.35, rotationStep: 4, rotation: "180deg" },
    west: { spacing: 0.35, rotationStep: 4, rotation: "90deg" },
    east: { spacing: 0.35, rotationStep: 4, rotation: "-90deg" },
};

function getSeatPlacement(seat, layout, fanLength) {
    const { width, height, edge, labelHeight, southFanTop, sideInset, opponentCardHeight } = layout;

    switch (seat) {
        case "south":
            return {
                fan: { left: (width - fanLength) / 2, top: southFanTop },
                label: { left: (width - fanLength) / 2, top: southFanTop - labelHeight },
            };
        case "north":
            return {
                fan: { left: (width - fanLength) / 2, top: edge },
                label: { left: (width + fanLength) / 2 + 12, top: edge },
            };
        case "west":
            return {
                fan: {
                    left: sideInset + opponentCardHeight / 2 - fanLength / 2,
                    top: (height - opponentCardHeight) / 2,
                },
                label: { left: edge, top: (height + fanLength) / 2 + 8 },
            };
        case "east":
        default:
            return {
                fan: {
                    left: width - sideInset - opponentCardHeight / 2 - fanLength / 2,
                    top: (height - opponentCardHeight) / 2,
                },
                label: { right: edge, top: (height + fanLength) / 2 + 8 },
            };
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
    status = "Non-Player",
    showFriendBadge = false,
}) {
    const isSouth = seat === "south";
    const cardHeight = isSouth ? layout.southCardHeight : layout.opponentCardHeight;
    const fan = seatFan[seat];
    const fanLength = cards.length ? fanWidth(cards.length, cardHeight, fan.spacing) : 0;
    const placement = getSeatPlacement(seat, layout, fanLength);

    return (
        <>
            <View
                style={[styles.fan, placement.fan, { transform: [{ rotate: fan.rotation }] }]}
                pointerEvents={isSouth ? "box-none" : "none"}
            >
                <FanOfCards
                    cards={cards}
                    cardHeight={cardHeight}
                    faceUp={isSouth}
                    onPlayCard={isSouth ? onPlayCard : undefined}
                    isCurrentTurn={isCurrentTurn}
                    playedCards={playedCards}
                    spacing={fan.spacing}
                    rotationStep={fan.rotationStep}
                />
            </View>

            <PlayerName
                style={[styles.label, placement.label, seat === "east" && styles.labelEnd]}
                name={name}
                gameType={gameType}
                status={status}
                showFriendBadge={showFriendBadge}
                isCurrentTurn={isCurrentTurn}
            />
        </>
    );
}

const styles = StyleSheet.create({
    fan: {
        position: "absolute",
    },
    label: {
        position: "absolute",
        zIndex: 5,
    },
    labelEnd: {
        justifyContent: "flex-end",
    },
});

export default PlayerPanel;
