import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { useGameStore } from "./src/game/state/gameStore";
import { MainMenuScreen } from "./src/screens/MainMenuScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { theme } from "./src/theme/theme";

export default function App() {
  const screen = useGameStore((state) => state.currentScreen);

  return (
    <View style={styles.appShell}>
      <SafeAreaView style={styles.phoneFrame}>
        <StatusBar barStyle="light-content" />
        {screen === "menu" ? <MainMenuScreen /> : null}
        {screen === "game" ? <GameScreen /> : null}
        {screen === "result" ? <ResultScreen /> : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#050806"
  },
  phoneFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    overflow: "hidden",
    backgroundColor: theme.colors.jungle
  }
});
