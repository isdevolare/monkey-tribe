import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Baloo2_500Medium,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  useFonts
} from "@expo-google-fonts/baloo-2";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FadeIn } from "./src/components/game/FadeIn";
import { initGameSounds } from "./src/game/audio/soundBridge";
import {
  flushVillageSave,
  SAVE_KEY,
  useGameStore
} from "./src/game/state/gameStore";
import { MainMenuScreen } from "./src/screens/MainMenuScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import type { VillageSave } from "./src/game/types/game";
import { theme } from "./src/theme/theme";

// Hold the native splash up until hydration + fonts finish, so the default
// (empty) village never flashes before the saved state is restored.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const screen = useGameStore((state) => state.currentScreen);
  const [fontsLoaded] = useFonts({
    Baloo2_500Medium,
    Baloo2_700Bold,
    Baloo2_800ExtraBold
  });
  const [hydrated, setHydrated] = useState(false);
  const bootStarted = useRef(false);

  // One-time boot. Order matters: restore the save FIRST, then start the
  // audio bridge — so the bridge seeds its baseline from the restored state
  // and never replays saved-progress transitions as fresh events (that was
  // the source of the stray achievement/reward jingles on launch).
  useEffect(() => {
    if (bootStarted.current) {
      return;
    }
    bootStarted.current = true;

    (async () => {
      if (__DEV__) {
        console.log("[startup] hydration start");
      }
      try {
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        if (raw) {
          const save = JSON.parse(raw) as VillageSave;
          if (Array.isArray(save.buildings) && save.resources) {
            useGameStore.getState().hydrate(save);
          }
        }
      } catch {
        // A corrupt save must never block launch; fall back to a fresh village.
      }
      if (__DEV__) {
        console.log("[startup] hydration complete");
      }
      // Audio bridge subscribes only now, after hydration is applied.
      initGameSounds();
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextState) => {
      const now = Date.now();
      const leftForeground = previousState === "active" && nextState !== "active";
      const enteredForeground = previousState !== "active" && nextState === "active";

      if (leftForeground) {
        useGameStore.getState().reconcileWorkTask(now);
        void flushVillageSave();
      } else if (enteredForeground) {
        useGameStore.getState().reconcileWorkTask(now);
      }

      previousState = nextState;
    });

    return () => subscription.remove();
  }, [hydrated]);

  useEffect(() => {
    if (fontsLoaded && __DEV__) {
      console.log("[startup] assets ready");
    }
  }, [fontsLoaded]);

  const appReady = hydrated && fontsLoaded;

  useEffect(() => {
    if (appReady && __DEV__) {
      console.log("[startup] app ready");
    }
  }, [appReady]);

  // Hide the native splash only once real content is about to paint.
  const onLayoutRootView = useCallback(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [appReady]);

  // Render nothing (native splash stays visible) until fully ready — never
  // the default state.
  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.appShell} onLayout={onLayoutRootView}>
        {/* Full-bleed frame: the background fills edge to edge (including behind
            the status bar); each screen insets its own content via safe-area
            padding. No solid strip at the top. */}
        <View style={styles.phoneFrame}>
          <StatusBar barStyle="light-content" />
          <FadeIn key={screen} rise={0} style={styles.screenFill}>
            {screen === "menu" ? <MainMenuScreen /> : null}
            {screen === "game" ? <GameScreen /> : null}
            {screen === "result" ? <ResultScreen /> : null}
          </FadeIn>
        </View>
      </View>
    </SafeAreaProvider>
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
