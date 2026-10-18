import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { AlfaSlabOne_400Regular } from "@expo-google-fonts/alfa-slab-one";
import { BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed";
import {
  AlegreyaSans_400Regular,
  AlegreyaSans_500Medium,
  AlegreyaSans_700Bold,
  AlegreyaSans_800ExtraBold,
} from "@expo-google-fonts/alegreya-sans";
import { CaveatBrush_400Regular } from "@expo-google-fonts/caveat-brush";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Stage from "./components/Stage";
import AchievementsScreen from "./screens/AchievementsScreen";
import DeckScreen from "./screens/DeckScreen";
import GameScreen from "./screens/GameScreen";
import MenuScreen from "./screens/MenuScreen";
import PracticeScreen from "./screens/PracticeScreen";
import RulesScreen from "./screens/RulesScreen";
import { markRulesSeen, markTutorialDone, useOnboarding } from "./data/onboarding";
import usePreloadedCardArt from "./hooks/usePreloadedCardArt";
import useHotkey from "./hooks/useHotkey";
import { colors } from "./theme";
import { startAmbience } from "./audio/sounds";
import { getProfile, recordRound, useProfile } from "./data/profile";
import { unlockAchievements } from "./data/achievementStore";
import { useLanguage } from "./i18n";

// Screens, switched with plain state: "menu", "game", "achievements" and
// "deck" (the card deck, opened from the settings).
// Leaving the game unmounts it, so Play always starts a fresh table.
function App() {
  const [screen, setScreen] = useState("menu");
  const [fontsLoaded] = useFonts({
    // Card faces
    AlfaSlabOne_400Regular,
    BarlowCondensed_700Bold,
    // Interface: Caveat Brush for big moments, Alfa Slab One for numbers
    // (also on the cards), Alegreya Sans for everything else
    AlegreyaSans_400Regular,
    AlegreyaSans_500Medium,
    AlegreyaSans_700Bold,
    AlegreyaSans_800ExtraBold,
    CaveatBrush_400Regular,
  });
  const cardArtLoaded = usePreloadedCardArt();
  // Texts are looked up while rendering (i18n/index.js), so a language change
  // re-renders the whole app from here.
  useLanguage();
  // Coins won or lost per player since the app was opened. Your own coins
  // are your savings instead, kept in your profile across app starts.
  const [sessionScores, setSessionScores] = useState({ south: 0, west: 0, north: 0, east: 0 });
  const profile = useProfile();
  // A finished round: your savings and stats, the session scores, and any
  // achievements it earned (returned, so the game can show them).
  const addRoundToSession = (round) => {
    const { deltas } = round;
    recordRound(deltas.south ?? 0);
    setSessionScores((scores) =>
      Object.fromEntries(Object.entries(scores).map(([player, total]) => [player, total + (deltas[player] ?? 0)]))
    );
    return unlockAchievements({ round, savings: getProfile().savings });
  };
  // Savings achievements also count savings from before they existed.
  useEffect(() => {
    unlockAchievements({ savings: profile.savings });
  }, [profile.savings]);
  const tableScores = { ...sessionScores, south: profile.savings };
  const openMenu = () => setScreen("menu");
  // The game being played: null for a normal game, or a lesson (guided first
  // game, practice round). gameKey restarts the table for a fresh game. The
  // menu plays its exit (shepherds out, sheep sound) before starting one.
  const [lesson, setLesson] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const startGame = (nextLesson = null) => {
    setLesson(nextLesson);
    setGameKey((key) => key + 1);
    setScreen("game");
  };
  // Rules: on the first start they lead into the guided game; from Practice
  // they go back there.
  const [rulesFirst, setRulesFirst] = useState(false);
  const onboarding = useOnboarding();
  useEffect(() => {
    if (onboarding.loaded && !onboarding.rulesSeen && screen === "menu") {
      setRulesFirst(true);
      setScreen("rules");
    }
  }, [onboarding.loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  const finishRules = (skipped) => {
    if (!rulesFirst) return setScreen("practice");
    markRulesSeen();
    setRulesFirst(false);
    // Skipping on the first start skips the guided game too.
    if (skipped) {
      markTutorialDone();
      openMenu();
    } else {
      startGame({ type: "guided" });
    }
  };
  // The end of a lesson: play on for real, more practice, or the same again.
  const onLessonAction = (action) => {
    if (lesson?.type === "guided") markTutorialDone();
    if (action === "continue") startGame(null);
    else if (action === "again") startGame(lesson);
    else setScreen("practice");
  };

  // Web shortcut: Esc back to the menu (in the game it opens the pause menu
  // instead). P to play is handled by the menu, so it gets its exit too.
  const ready = fontsLoaded && cardArtLoaded;
  useHotkey("Escape", openMenu, ready && screen !== "menu" && screen !== "game" && !(screen === "rules" && rulesFirst));

  // Meadow music on loop from the moment the app opens.
  useEffect(() => startAmbience(), []);

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <SafeAreaView style={styles.page}>
        {!fontsLoaded || !cardArtLoaded ? null : (
          <Stage>
            {screen === "game" ? (
              <GameScreen
                key={gameKey}
                lesson={lesson}
                onLessonAction={onLessonAction}
                onOpenMenu={openMenu}
                playerName={profile.name}
                sessionScores={tableScores}
                onRoundScored={addRoundToSession}
              />
            ) : screen === "deck" ? (
              <DeckScreen onBack={openMenu} />
            ) : screen === "achievements" ? (
              <AchievementsScreen onBack={openMenu} />
            ) : screen === "rules" ? (
              <RulesScreen first={rulesFirst} onDone={finishRules} />
            ) : screen === "practice" ? (
              <PracticeScreen
                onBack={openMenu}
                onRules={() => setScreen("rules")}
                onGuided={() => startGame({ type: "guided" })}
                onPractice={(practice) => startGame({ type: "practice", lesson: practice })}
              />
            ) : (
              <MenuScreen
                onPlay={() => startGame(null)}
                onOpenPractice={() => setScreen("practice")}
                onOpenAchievements={() => setScreen("achievements")}
                onOpenDeck={() => setScreen("deck")}
              />
            )}
          </Stage>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#000000",
  },
});

export default App;
