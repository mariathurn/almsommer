/* The very first screen of a new player: choose a name and a portrait,
before the rules and the guided first game. */

import { StyleSheet, View } from "react-native";
import ProfilePanel from "../components/ProfilePanel";
import SceneBackground from "../components/SceneBackground";

function WelcomeScreen({ onDone }) {
    return (
        <View style={styles.shell}>
            <SceneBackground />
            <ProfilePanel welcome onClose={onDone} />
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        flex: 1,
    },
});

export default WelcomeScreen;
