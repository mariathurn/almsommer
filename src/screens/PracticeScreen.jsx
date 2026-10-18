/* "Practice", from the start menu: the basic rules again, the guided Sheep
Game, a practice round for every game with its tips, and a few techniques.
Practice rounds don't count for coins or achievements. */

import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import Card from "../components/Card";
import PaperButton from "../components/PaperButton";
import SceneBackground from "../components/SceneBackground";
import { PanelButton } from "../components/SettingsPanel";
import { practiceLessons } from "../data/lessons";
import { t } from "../i18n";
import { colors, fonts, softShadow } from "../theme";

const card = (id) => {
    const [suit, rank] = id.split("-");
    return { id, suit, rank };
};

// A picture card for each entry.
const icons = {
    rules: "leaf-A",
    guided: "acorn-O",
    sheep: "bell-A",
    solo: "heart-O",
    dog: "acorn-U",
    marriage: "heart-9",
    ramsch: "leaf-9",
};
const techniques = ["trumps", "smear", "follow", "search"];

function Entry({ icon, title, text, tips = [], button, onPress }) {
    return (
        <View style={styles.entry}>
            <View style={styles.entryTop}>
                <View style={styles.icon}>
                    <Card card={card(icon)} faceUp height={74} />
                </View>
                <View style={styles.entryText}>
                    <Text style={styles.entryTitle}>{title}</Text>
                    <Text style={styles.entryBody}>{text}</Text>
                </View>
            </View>
            {tips.length ? (
                <View style={styles.tips}>
                    {tips.map((tip) => (
                        <View key={tip} style={styles.tip}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ))}
                </View>
            ) : null}
            <PanelButton label={button} onPress={onPress} style={styles.entryButton} />
        </View>
    );
}

function PracticeScreen({ onBack, onRules, onGuided, onPractice }) {
    return (
        <View style={styles.shell}>
            <SceneBackground />
            <View style={styles.header}>
                <PaperButton label={t("common.backToMenu")} compact onPress={onBack} />
            </View>
            <View style={styles.panelSlot}>
                <View style={styles.panel}>
                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Defs>
                            <Pattern id="practice-dots" width={14} height={14} patternUnits="userSpaceOnUse">
                                <Circle cx={7} cy={7} r={1.3} fill={colors.ink} opacity={0.09} />
                            </Pattern>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#practice-dots)" />
                    </Svg>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.heading}>{t("practice.title")}</Text>
                        <Text style={styles.intro}>{t("practice.intro")}</Text>

                        <Entry
                            icon={icons.rules}
                            title={t("practice.rules")}
                            text={t("practice.rulesText")}
                            button={t("practice.open")}
                            onPress={onRules}
                        />
                        <Entry
                            icon={icons.guided}
                            title={t("practice.guided")}
                            text={t("practice.guidedText")}
                            button={t("practice.play")}
                            onPress={onGuided}
                        />
                        {practiceLessons.map((lesson) => (
                            <Entry
                                key={lesson.id}
                                icon={icons[lesson.id]}
                                title={t(`lesson.${lesson.id}.title`)}
                                text={t(`lesson.${lesson.id}.goal`)}
                                tips={[1, 2, 3].map((i) => t(`lesson.${lesson.id}.tip${i}`))}
                                button={t("practice.play")}
                                onPress={() => onPractice(lesson)}
                            />
                        ))}

                        <Text style={styles.sectionLabel}>{t("practice.techniques")}</Text>
                        {techniques.map((id) => (
                            <View key={id} style={styles.technique}>
                                <Text style={styles.entryTitle}>{t(`technique.${id}.title`)}</Text>
                                <Text style={styles.entryBody}>{t(`technique.${id}.text`)}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        flex: 1,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    panelSlot: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 20,
        alignItems: "center",
    },
    panel: {
        flex: 1,
        width: "100%",
        maxWidth: 640,
        backgroundColor: colors.paper,
        borderRadius: 22,
        borderWidth: 2.5,
        borderColor: colors.ink,
        overflow: "hidden",
        ...softShadow,
    },
    content: {
        padding: 20,
        gap: 12,
    },
    heading: {
        fontFamily: fonts.hand,
        fontSize: 44,
        lineHeight: 48,
        color: colors.ink,
    },
    intro: {
        fontFamily: fonts.body,
        fontSize: 16,
        lineHeight: 21,
        color: colors.inkSoft,
    },
    entry: {
        gap: 10,
        padding: 12,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: colors.ink,
    },
    entryTop: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
    },
    icon: {
        ...softShadow,
    },
    entryText: {
        flex: 1,
        gap: 2,
    },
    entryTitle: {
        fontFamily: fonts.bodyBold,
        fontSize: 19,
        color: colors.ink,
    },
    entryBody: {
        fontFamily: fonts.body,
        fontSize: 15,
        lineHeight: 20,
        color: colors.inkSoft,
    },
    tips: {
        gap: 4,
    },
    tip: {
        flexDirection: "row",
        gap: 6,
    },
    bullet: {
        fontFamily: fonts.bodyBold,
        fontSize: 15,
        lineHeight: 20,
        color: colors.hayDeep,
    },
    tipText: {
        flex: 1,
        fontFamily: fonts.body,
        fontSize: 15,
        lineHeight: 20,
        color: colors.ink,
    },
    entryButton: {
        marginTop: 0,
        paddingVertical: 10,
    },
    sectionLabel: {
        marginTop: 8,
        fontFamily: fonts.bodyBold,
        fontSize: 13,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: colors.inkSoft,
    },
    technique: {
        gap: 2,
        paddingVertical: 6,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.keyline,
    },
});

export default PracticeScreen;
