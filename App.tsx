import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Baloo2_500Medium,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  useFonts
} from "@expo-google-fonts/baloo-2";
import { useEffect } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { FadeIn } from "./src/components/game/FadeIn";
import { initGameSounds } from "./src/game/audio/soundBridge";
import { SAVE_KEY, useGameStore } from "./src/game/state/gameStore";
import { MainMenuScreen } from "./src/screens/MainMenuScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import type { VillageSave } from "./src/game/types/game";
import { theme } from "./src/theme/theme";

export default function App() {
  const screen = useGameStore((state) => state.currentScreen);
  const [fontsLoaded] = useFonts({
    Baloo2_500Medium,
    Baloo2_700Bold,
    Baloo2_800ExtraBold
  });

  useEffect(() => {
    initGameSounds();
  }, []);

  // Restore the saved village once on launch so it persists across sessions.
  useEffect(() => {
    AsyncStorage.getItem(SAVE_KEY)
      .then((raw) => {
        if (!raw) {
          return;
        }
        const save = JSON.parse(raw) as VillageSave;
        if (Array.isArray(save.buildings) && save.resources) {
          useGameStore.getState().hydrate(save);
        }
      })
      .catch(() => undefined);
  }, []);

  if (!fontsLoaded) {
    return <View style={styles.appShell} />;
  }

  return (
    <View style={styles.appShell}>
      <SafeAreaView style={styles.phoneFrame}>
        <StatusBar barStyle="light-content" />
        <FadeIn key={screen} rise={0} style={styles.screenFill}>
          {screen === "menu" ? <MainMenuScreen /> : null}
          {screen === "game" ? <GameScreen /> : null}
          {screen === "result" ? <ResultScreen /> : null}
        </FadeIn>
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
  },
  screenFill: {
    flex: 1
  }
});
