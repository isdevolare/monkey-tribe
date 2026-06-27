import { SafeAreaView, StatusBar } from "react-native";
import { useGameStore } from "./src/game/state/gameStore";
import { MainMenuScreen } from "./src/screens/MainMenuScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { theme } from "./src/theme/theme";

export default function App() {
  const screen = useGameStore((state) => state.currentScreen);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.jungle }}>
      <StatusBar barStyle="light-content" />
      {screen === "menu" ? <MainMenuScreen /> : null}
      {screen === "game" ? <GameScreen /> : null}
      {screen === "result" ? <ResultScreen /> : null}
    </SafeAreaView>
  );
}
