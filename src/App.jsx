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
import usePreloadedCardArt from "./hooks/usePreloadedCardArt";
import useHotkey from "./hooks/useHotkey";
import { colors } from "./theme";
import { sounds, startAmbience } from "./audio/sounds";
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
  const startGame = () => {
    sounds.sheep();
    setScreen("game");
  };

  // Web shortcuts: Esc back to the menu (in the game it opens the pause
  // menu instead), P to play (from the menu).
  const ready = fontsLoaded && cardArtLoaded;
  useHotkey("Escape", openMenu, ready && screen !== "menu" && screen !== "game");
  useHotkey("p", startGame, ready && screen === "menu");

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
                onOpenMenu={openMenu}
                playerName={profile.name}
                sessionScores={tableScores}
                onRoundScored={addRoundToSession}
              />
            ) : screen === "deck" ? (
              <DeckScreen onBack={openMenu} />
            ) : screen === "achievements" ? (
              <AchievementsScreen onBack={openMenu} />
            ) : (
              <MenuScreen
                onPlay={startGame}
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
