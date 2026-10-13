/* Top of the table: Menu on the left and a ribbon banner naming the current
game ("Maria calls the orange sheep") and what happens next. Dealing and
choosing the game happen in the middle of the table. */

import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import PaperButton from "./PaperButton";
import { getGameType } from "../data/gameTypes";
import { colors, fonts, paper, suitTheme } from "../theme";

function RibbonTail({ flip, height }) {
    const w = height * 0.45;
    return (
        <Svg width={w} height={height} style={flip && { transform: [{ scaleX: -1 }] }}>
            <Path
                d={`M${w} ${height * 0.18} H0 L${w * 0.45} ${height * 0.55} L0 ${height * 0.92} H${w} Z`}
                fill={colors.hay}
                stroke={colors.hayDeep}
                strokeWidth={1.5}
            />
        </Svg>
    );
}

function getBannerTitle({ hasCards, selectedGame, calledAce, callerName }) {
    const game = getGameType(selectedGame);
    if (!game) return hasCards ? "Declare your game" : "Almsommer";
    if (game.value === "Sau Spiel") {
        return calledAce
            ? `${callerName} calls the ${suitTheme[calledAce].name.toLowerCase()} sheep`
            : `${callerName} plays a Sheep Game`;
    }
    if (game.value === "Ramsch") return "Cowards Game: nobody announced";
    if (game.value === "Marriage") return `${callerName} offers a Marriage`;
    return `${callerName} plays a ${game.label}`;
}

function getBannerSubtitle({ hasCards, selectedGame, currentTurn, trickWinner, playerName }) {
    if (trickWinner) return `${playerName(trickWinner)} takes the trick`;
    if (!hasCards) return "Deal the cards to begin";
    if (!getGameType(selectedGame)) return "Choose what you want to play";
    if (currentTurn === "south") return "Your turn";
    return `${playerName(currentTurn)} is thinking…`;
}

function GameHeader({ hasCards, currentTurn, trickWinner, selectedGame, calledAce, playerName, onOpenMenu }) {
    const { width } = useWindowDimensions();
    const compact = width < 900;
    const ribbonHeight = compact ? 46 : 58;
    const state = { hasCards, selectedGame, calledAce, currentTurn, trickWinner, playerName };

    return (
        <View style={[styles.header, compact && styles.headerCompact]}>
            <View style={styles.side}>
                <PaperButton label="Menu" compact={compact} onPress={onOpenMenu} />
            </View>

            <View style={styles.banner}>
                <RibbonTail height={ribbonHeight} />
                <View style={[styles.ribbon, { height: ribbonHeight }]}>
                    <Text style={[styles.bannerTitle, compact && styles.bannerTitleCompact]} numberOfLines={1}>
                        {getBannerTitle({ ...state, callerName: playerName("south") })}
                    </Text>
                    <Text style={styles.bannerSubtitle} numberOfLines={1}>
                        {getBannerSubtitle(state)}
                    </Text>
                </View>
                <RibbonTail height={ribbonHeight} flip />
            </View>

            {/* Keeps the banner centred opposite the Menu button */}
            <View style={styles.side} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 4,
    },
    headerCompact: {
        paddingHorizontal: 10,
        paddingTop: 6,
        gap: 8,
    },
    side: {
        width: 90,
    },
    banner: {
        flexShrink: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    ribbon: {
        ...paper,
        borderRadius: 4,
        borderColor: colors.hayDeep,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 18,
        marginHorizontal: -6,
        zIndex: 1,
        flexShrink: 1,
    },
    bannerTitle: {
        fontFamily: fonts.title,
        fontSize: 19,
        color: colors.ink,
    },
    bannerTitleCompact: {
        fontSize: 15,
    },
    bannerSubtitle: {
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        color: colors.inkSoft,
    },
});

export default GameHeader;
