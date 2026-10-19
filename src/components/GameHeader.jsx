/* Top of the table: Menu on the left and a ribbon banner naming the current
game ("Maria calls the orange sheep") and what happens next. Dealing and
choosing the game happen in the middle of the table. */

import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Path, Pattern, Rect } from "react-native-svg";
import PaperButton from "./PaperButton";
import { CoinBalance } from "./Coin";
import { LastTrickButton } from "./LastTrick";
import { TourTarget } from "./Tour";
import { useStage } from "./Stage";
import { parseGame } from "../ai/schafkopfAI";
import { getGameType } from "../data/gameTypes";
import { t } from "../i18n";
import { colors, fonts, paper } from "../theme";

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
    if (!game) return hasCards ? t("banner.declare") : "Almsommer";
    if (game.value === "Sau Spiel") {
        return calledAce
            ? t("banner.callsSheep", { name: callerName, suit: calledAce })
            : t("banner.plays", { name: callerName, game: game.value });
    }
    if (game.value === "Ramsch") return t("banner.cowards");
    if (game.value === "Marriage") return t("banner.marries", { name: callerName, partner: marriagePartnerName });
    const { suit, tout } = parseGame(selectedGame);
    return t("banner.plays", { name: callerName, game: game.value, suit, tout });
}

function getBannerSubtitle({ hasCards, selectedGame, currentTurn, trickWinner, playerName, note }) {
    if (trickWinner) return t("banner.takesTrick", { name: playerName(trickWinner) });
    if (note) return note;
    if (!hasCards) return t("banner.dealToBegin");
    if (!getGameType(selectedGame)) return t("banner.choose");
    if (currentTurn === "south") return t("banner.yourTurn");
    return t("banner.thinking", { name: playerName(currentTurn) });
}

// Phones: three lines on paper, opens the pause menu.
function HamburgerButton({ onPress }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={t("common.menu")}
            hitSlop={6}
            style={({ pressed }) => [styles.hamburger, pressed && styles.hamburgerPressed]}
        >
            {[0, 1, 2].map((line) => (
                <View key={line} style={styles.hamburgerLine} />
            ))}
        </Pressable>
    );
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
    // The eye button right of the banner: shows the last trick, greyed out
    // until the first trick of the round is taken.
    onShowLastTrick = null,
    hasLastTrick = false,
}) {
    const { width, isPortrait } = useStage();
    const compact = width < 900;
    // Phones: a hamburger instead of "Menu", no coin box (your coins are on
    // your name tag), and a wider banner with larger text.
    const phone = isPortrait;
    const ribbonHeight = phone ? 56 : compact ? 46 : 58;
    const state = { hasCards, selectedGame, calledAce, currentTurn, trickWinner, playerName, marriagePartnerName, note };

    return (
        <View style={[styles.header, compact && styles.headerCompact]}>
            {phone ? (
                <TourTarget id="menu">
                    <HamburgerButton onPress={onOpenMenu} />
                </TourTarget>
            ) : (
                <View style={[styles.side, compact && styles.sideCompact]}>
                    <TourTarget id="menu" style={styles.tourMenu}>
                        <PaperButton label={t("common.menu")} accessibilityLabel={t("common.menu")} compact={compact} onPress={onOpenMenu} />
                    </TourTarget>
                </View>
            )}

            <TourTarget id="banner" style={[styles.banner, phone && styles.bannerPhone]}>
                <RibbonTail height={ribbonHeight} />
                <View
                    style={[
                        styles.ribbon,
                        !compact && styles.ribbonWide,
                        phone ? [styles.ribbonPhone, { minHeight: ribbonHeight }] : { height: ribbonHeight },
                    ]}
                >
                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Defs>
                            <Pattern id="banner-dots" width={12} height={12} patternUnits="userSpaceOnUse">
                                <Circle cx={6} cy={6} r={1.2} fill={colors.ink} opacity={0.1} />
                            </Pattern>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#banner-dots)" />
                    </Svg>
                    <Text
                        style={[styles.bannerTitle, compact && styles.bannerTitleCompact, phone && styles.bannerTitlePhone]}
                        numberOfLines={1}
                        // Native apps: shrink a long title instead of cutting off its last word.
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                    >
                        {title ?? getBannerTitle({ ...state, callerName: playerName(caller ?? "south") })}
                    </Text>
                    <Text style={[styles.bannerSubtitle, phone && styles.bannerSubtitlePhone]} numberOfLines={phone ? 2 : 1}>
                        {getBannerSubtitle(state)}
                    </Text>
                </View>
                <RibbonTail height={ribbonHeight} flip />
            </TourTarget>

            {/* The last-trick eye and your coins, opposite the Menu button so the banner stays centred */}
            {phone ? (
                <TourTarget id="lastTrick">
                    <LastTrickButton onPress={onShowLastTrick} disabled={!hasLastTrick} size={46} />
                </TourTarget>
            ) : (
                <View style={[styles.side, styles.sideRight, compact && styles.sideCompact]}>
                    <TourTarget id="lastTrick">
                        <LastTrickButton onPress={onShowLastTrick} disabled={!hasLastTrick} size={compact ? 36 : 42} />
                    </TourTarget>
                    <TourTarget id="coins">
                        <CoinBalance value={coins} compact={compact} />
                    </TourTarget>
                </View>
            )}
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
        width: 150,
    },
    tourMenu: {
        alignSelf: "flex-start",
    },
    sideCompact: {
        width: 124,
    },
    sideRight: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
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
    bannerPhone: {
        flex: 1,
    },
    ribbonPhone: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    bannerTitlePhone: {
        fontSize: 22,
        lineHeight: 25,
        textAlign: "center",
    },
    bannerSubtitlePhone: {
        fontSize: 13,
        lineHeight: 16,
        letterSpacing: 0.6,
        color: colors.ink,
        textAlign: "center",
    },
    hamburger: {
        ...paper,
        width: 46,
        height: 46,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },
    hamburgerPressed: {
        transform: [{ scale: 0.95 }],
    },
    hamburgerLine: {
        width: 22,
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.ink,
    },
});

export default GameHeader;
