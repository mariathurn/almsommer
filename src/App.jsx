import { useState } from "react";
import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { AlfaSlabOne_400Regular } from "@expo-google-fonts/alfa-slab-one";
import { BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed";
import { Fraunces_600SemiBold, Fraunces_700Bold, Fraunces_900Black } from "@expo-google-fonts/fraunces";
import {
  AlegreyaSans_400Regular,
  AlegreyaSans_500Medium,
  AlegreyaSans_700Bold,
} from "@expo-google-fonts/alegreya-sans";
import { CaveatBrush_400Regular } from "@expo-google-fonts/caveat-brush";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Stage from "./components/Stage";
import DeckScreen from "./screens/DeckScreen";
import GameScreen from "./screens/GameScreen";
import MenuScreen from "./screens/MenuScreen";
import usePreloadedCardArt from "./hooks/usePreloadedCardArt";
import { colors } from "./theme";

// Three screens, switched with plain state: "menu", "game" and "deck".
// Leaving the game unmounts it, so Play always starts a fresh table.
function App() {
  const [screen, setScreen] = useState("menu");
  const [fontsLoaded] = useFonts({
    // Card faces
    AlfaSlabOne_400Regular,
    BarlowCondensed_700Bold,
    // Interface: Fraunces for titles and numbers, Alegreya Sans for text
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
    AlegreyaSans_400Regular,
    AlegreyaSans_500Medium,
    AlegreyaSans_700Bold,
    // Hand-drawn buttons on the title screen
    CaveatBrush_400Regular,
  });
  const cardArtLoaded = usePreloadedCardArt();
  const openMenu = () => setScreen("menu");

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <SafeAreaView style={styles.page}>
        {!fontsLoaded || !cardArtLoaded ? null : (
          <Stage>
            {screen === "game" ? (
              <GameScreen onOpenMenu={openMenu} />
            ) : screen === "deck" ? (
              <DeckScreen onBack={openMenu} />
            ) : (
              <MenuScreen onPlay={() => setScreen("game")} onOpenDeck={() => setScreen("deck")} />
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
    backgroundColor: "#1d2433",
  },
});

export default App;
