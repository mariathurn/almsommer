/* An opponent on the phone (portrait) table: a head-and-shoulders crop of a
card figure (dog, sheep or shepherd, any colour; see data/portraits.js) on
its card's panel colour and cloud texture, inside a white ring, their session coins in a small box at its corner, and
a dark name tag (with their side once it's known). The ring turns gold on
their turn; the tag lights up when they take a trick. */

import { StyleSheet, Text, View } from "react-native";
import { CoinIcon } from "./Coin";
import Portrait from "./Portrait";
import WinnerGlow from "./WinnerGlow";
import { formatCoins } from "./PlayerName";
import { opponentPortraits } from "../data/portraits";
import { t } from "../i18n";
import { statusName } from "../i18n/names";
import { colors, fonts } from "../theme";

// The dark name tag under a profile, also used for your own name at the
// bottom. It shines when its player takes a trick; `children` go at its right
// (your coins), `scale` makes it larger in the web view.
export function DarkNameTag({ name, status, isTrickWinner, isCurrentTurn = false, scale = 1, children, style }) {
    return (
        <WinnerGlow active={isTrickWinner} radius={14 * scale} spread={4} scaleTo={1.06}>
            <View
                style={[
                    styles.tag,
                    { minWidth: 92 * scale, paddingHorizontal: 12 * scale, paddingVertical: 6 * scale, borderRadius: 14 * scale },
                    isCurrentTurn && styles.tagActive,
                    isTrickWinner && styles.tagWinner,
                    style,
                ]}
            >
                <View style={styles.tagText}>
                    <Text style={[styles.name, { fontSize: 18 * scale }]} numberOfLines={1}>
                        {name}
                    </Text>
                    {status ? (
                        <Text style={[styles.status, { fontSize: 12 * scale }]} numberOfLines={1}>
                            {status}
                        </Text>
                    ) : null}
                </View>
                {children}
            </View>
        </WinnerGlow>
    );
}

// A small white box with the gold coin and a balance.
export function CoinBox({ coins, scale = 1, style }) {
    return (
        <View style={[styles.coinBox, style]} accessibilityLabel={t("coins.session", { count: coins })}>
            <CoinIcon size={14 * scale} />
            <Text style={[styles.coins, { fontSize: 12 * scale }]}>{formatCoins(coins)}</Text>
        </View>
    );
}

// tagSide "right" puts the name tag beside the portrait instead of below it
// (the player at the top in the web view), with the coins moved to the left.
// isHighlighted: the portrait glows gold (e.g. this player just accepted your marriage).
// call: "Kontra" or "Retour", if they said it.
function OpponentProfile({ seat, name, status, coins, isCurrentTurn, isTrickWinner, isHighlighted = false, size = 70, tagSide = "below", call = null }) {
    const beside = tagSide === "right";
    const portrait = opponentPortraits[seat];
    const known = status && status !== "Unknown";
    const scale = size / 70;

    return (
        <View style={[styles.profile, beside && styles.profileBeside]}>
            <WinnerGlow active={isHighlighted} loop radius={(size + 10) / 2} spread={8} scaleTo={1.08} style={styles.glowWrap}>
                <View
                    style={[
                        styles.ring,
                        { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2 },
                        (isCurrentTurn || isHighlighted) && styles.ringActive,
                    ]}
                >
                    <Portrait portrait={portrait} size={size} />
                    <CoinBox coins={coins} scale={scale} style={[styles.coinBoxOnRing, beside ? styles.coinBoxLeft : styles.coinBoxRight]} />
                </View>
            </WinnerGlow>

            <DarkNameTag
                name={name}
                status={[known ? statusName(status) : null, call].filter(Boolean).join(" · ") || null}
                isTrickWinner={isTrickWinner}
                scale={scale}
                style={beside && styles.tagBeside}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    profile: {
        alignItems: "center",
    },
    // White ring without an outer line; the name tag below touches it.
    // White ring without an outer line; gold on their turn.
    ring: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        zIndex: 1,
    },
    // Keeps the ring above the name tag, as before the glow wrapped it.
    glowWrap: {
        zIndex: 1,
    },
    ringActive: {
        backgroundColor: colors.hay,
    },
    coinBoxOnRing: {
        position: "absolute",
        bottom: -4,
    },
    coinBoxRight: {
        right: -14,
    },
    coinBoxLeft: {
        left: -14,
    },
    profileBeside: {
        flexDirection: "row",
        alignItems: "center",
    },
    tagBeside: {
        marginTop: 0,
        marginLeft: -6,
    },
    coinBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingLeft: 4,
        paddingRight: 7,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: "#ffffff",
        borderWidth: 2.5,
        borderColor: colors.ink,
    },
    tag: {
        marginTop: -3,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "#2f2421",
        borderWidth: 3,
        borderColor: colors.ink,
    },
    tagText: {
        alignItems: "center",
    },
    tagActive: {
        borderColor: colors.hay,
    },
    tagWinner: {
        borderColor: colors.hay,
    },
    name: {
        fontFamily: fonts.title,
        fontSize: 18,
        color: "#ffffff",
    },
    status: {
        marginTop: -2,
        fontFamily: fonts.bodyBold,
        fontSize: 12,
        color: colors.hay,
    },
    coins: {
        fontFamily: fonts.number,
        fontSize: 12,
        color: colors.ink,
    },
});

export default OpponentProfile;
