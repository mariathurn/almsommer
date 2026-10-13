import { useState } from "react";
import { StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts, Rubik_900Black } from "@expo-google-fonts/rubik";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import DeckScreen from "./screens/DeckScreen";
import GameScreen from "./screens/GameScreen";
import MenuScreen from "./screens/MenuScreen";
import { colors } from "./theme";

// Three screens, switched with plain state: "menu", "game" and "deck".
// Leaving the game unmounts it, so Play always starts a fresh table.
function App() {
  const [screen, setScreen] = useState("menu");
  const [fontsLoaded] = useFonts({ Rubik_900Black });
  const openMenu = () => setScreen("menu");

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <SafeAreaView style={styles.page}>
        {!fontsLoaded ? null : screen === "game" ? (
          <GameScreen onOpenMenu={openMenu} />
        ) : screen === "deck" ? (
          <DeckScreen onBack={openMenu} />
        ) : (
          <MenuScreen onPlay={() => setScreen("game")} onOpenDeck={() => setScreen("deck")} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.page,
    padding: 4,
  },
});

export default App;
