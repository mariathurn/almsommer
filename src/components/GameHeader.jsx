/* Top of the table: Menu on the left and a ribbon banner naming the current
game ("Maria calls the orange sheep") and what happens next. Dealing and
choosing the game happen in the middle of the table. */

import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Path, Pattern, Rect } from "react-native-svg";
import PaperButton from "./PaperButton";
import { CoinBalance } from "./Coin";
import { useStage } from "./Stage";
import { parseGame } from "../ai/schafkopfAI";
import { getGameType, suitNamesEn } from "../data/gameTypes";
import { colors, fonts, suitTheme } from "../theme";

function RibbonTail({ flip, height }) {
    const w = height * 0.45;
    return (
        <Svg width={w} height={height} style={flip && { transform: [{ scaleX: -1 }] }}>
            <Path
                d={`M${w} ${height * 0.18} H0 L${w * 0.45} ${height * 0.55} L0 ${height * 0.92} H${w} Z`}
                fill={colors.hay}
                stroke={colors.ink}
                strokeWidth={2.5}
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function getBannerTitle({ hasCards, selectedGame, calledAce, callerName, marriagePartnerName }) {
    const game = getGameType(selectedGame);
    if (!game) return hasCards ? "Declare your game" : "Almsommer";
    if (game.value === "Sau Spiel") {
        return calledAce
            ? `${callerName} calls the ${suitTheme[calledAce].name.toLowerCase()} sheep`
            : `${callerName} plays a Sheep Game`;
    }
    if (game.value === "Ramsch") return "Cowards Game: nobody announced";
    if (game.value === "Marriage") {
        return `${callerName} marries ${marriagePartnerName}`;
    }
    const { suit } = parseGame(selectedGame);
    if (game.value === "Solo" && suit) {
        return `${callerName} plays ${suit === "acorn" ? "an" : "a"} ${suitNamesEn[suit]} Solo`;
    }
    return `${callerName} plays a ${game.label}`;
}

function getBannerSubtitle({ hasCards, selectedGame, currentTurn, trickWinner, playerName, note }) {
    if (trickWinner) return `${playerName(trickWinner)} takes the trick`;
    if (note) return note;
    if (!hasCards) return "Deal the cards to begin";
    if (!getGameType(selectedGame)) return "Choose what you want to play";
    if (currentTurn === "south") return "Your turn";
    return `${playerName(currentTurn)} is thinking…`;
}

function GameHeader({
    hasCards,
    currentTurn,
    trickWinner,
    selectedGame,
    calledAce,
    playerName,
    onOpenMenu,
    coins = 0,
    marriagePartnerName = null,
    caller = null,
    title = null,
    note = null,
}) {
    const { width } = useStage();
    const compact = width < 900;
    const ribbonHeight = compact ? 46 : 58;
    const state = { hasCards, selectedGame, calledAce, currentTurn, trickWinner, playerName, marriagePartnerName, note };

    return (
        <View style={[styles.header, compact && styles.headerCompact]}>
            <View style={[styles.side, compact && styles.sideCompact]}>
                <PaperButton label="Menu" compact={compact} onPress={onOpenMenu} />
            </View>

            <View style={styles.banner}>
                <RibbonTail height={ribbonHeight} />
                <View style={[styles.ribbon, !compact && styles.ribbonWide, { height: ribbonHeight }]}>
                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Defs>
                            <Pattern id="banner-dots" width={12} height={12} patternUnits="userSpaceOnUse">
                                <Circle cx={6} cy={6} r={1.2} fill={colors.ink} opacity={0.1} />
                            </Pattern>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#banner-dots)" />
                    </Svg>
                    <Text style={[styles.bannerTitle, compact && styles.bannerTitleCompact]} numberOfLines={1}>
                        {title ?? getBannerTitle({ ...state, callerName: playerName(caller ?? "south") })}
                    </Text>
                    <Text style={styles.bannerSubtitle} numberOfLines={1}>
                        {getBannerSubtitle(state)}
                    </Text>
                </View>
                <RibbonTail height={ribbonHeight} flip />
            </View>

            {/* Your coins, opposite the Menu button so the banner stays centred */}
            <View style={[styles.side, compact && styles.sideCompact]}>
                <CoinBalance value={coins} compact={compact} />
            </View>
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
    sideCompact: {
        width: 72,
    },
    banner: {
        flexShrink: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    // Dotted paper with an ink border, like the game panel.
    ribbon: {
        backgroundColor: colors.paper,
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: colors.ink,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 18,
        marginHorizontal: -6,
        zIndex: 1,
        flexShrink: 1,
    },
    bannerTitle: {
        fontFamily: fonts.hand,
        fontSize: 24,
        lineHeight: 27,
        color: colors.ink,
    },
    bannerTitleCompact: {
        fontSize: 20,
        lineHeight: 23,
    },
    bannerSubtitle: {
        fontFamily: fonts.bodyBold,
        fontSize: 12,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: colors.inkSoft,
    },
    ribbonWide: {
        minWidth: 520,
    },
});

export default GameHeader;
