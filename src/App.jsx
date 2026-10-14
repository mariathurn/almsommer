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
import { colors } from "./theme";
import { sounds, startAmbience } from "./audio/sounds";

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
  // Coins won or lost per player since the app was opened.
  const [sessionScores, setSessionScores] = useState({ south: 0, west: 0, north: 0, east: 0 });
  const addRoundToSession = (deltas) =>
    setSessionScores((scores) =>
      Object.fromEntries(Object.entries(scores).map(([player, total]) => [player, total + (deltas[player] ?? 0)]))
    );
  const openMenu = () => setScreen("menu");

  // Meadow music on loop from the moment the app opens.
  useEffect(() => startAmbience(), []);

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <SafeAreaView style={styles.page}>
        {!fontsLoaded || !cardArtLoaded ? null : (
          <Stage>
            {screen === "game" ? (
              <GameScreen onOpenMenu={openMenu} sessionScores={sessionScores} onRoundScored={addRoundToSession} />
            ) : screen === "deck" ? (
              <DeckScreen onBack={openMenu} />
            ) : screen === "achievements" ? (
              <AchievementsScreen onBack={openMenu} />
            ) : (
              <MenuScreen
                onPlay={() => {
                  sounds.sheep();
                  setScreen("game");
                }}
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
