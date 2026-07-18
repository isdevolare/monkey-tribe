import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssetImage } from "../components/game/AssetImage";
import { t } from "../game/i18n";
import type { Lang } from "../game/types/game";
import { theme } from "../theme/theme";

const LOADING_MESSAGE_KEYS = [
  "loading.gatheringBananas",
  "loading.preparingTribe",
  "loading.buildingVillage",
  "loading.trainingWarriors",
  "loading.exploringJungle",
  "loading.sharpeningSpears",
  "loading.openingPalace"
] as const;

export function LoadingScreen({ lang, onArtworkReady }: { lang: Lang; onArtworkReady: () => void }) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * LOADING_MESSAGE_KEYS.length));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      })
    );
    animation.start();
    const messageTimer = setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGE_KEYS.length);
    }, 1900);
    return () => {
      animation.stop();
      clearInterval(messageTimer);
    };
  }, [progress]);

  return (
    <View style={styles.screen} pointerEvents="none">
      <AssetImage
        assetKey="bgMainMenuPremium"
        resizeMode="cover"
        style={styles.fill}
        fallback={<View style={styles.fallback} />}
        onLoad={onArtworkReady}
        onError={onArtworkReady}
      />
      <View style={styles.vignette} />

      <View style={styles.logoWrap}>
        <View style={styles.logoHalo} />
        <AssetImage assetKey="uiLogo" style={styles.logo} fallback={<View />} hideFallbackOnLoad />
      </View>

      <View style={[styles.loadingArea, { paddingBottom: Math.max(insets.bottom, 18) + 22 }]}>
        <Text style={styles.message} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={theme.maxFontScale}>
          {t(LOADING_MESSAGE_KEYS[messageIndex] ?? LOADING_MESSAGE_KEYS[0], lang)}
        </Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressSweep,
              {
                transform: [{
                  translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-72, 224] })
                }]
              }
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07140d" },
  fill: { ...StyleSheet.absoluteFillObject },
  fallback: { flex: 1, backgroundColor: "#102b1a" },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 10, 6, 0.18)"
  },
  logoWrap: {
    position: "absolute",
    top: "24%",
    alignSelf: "center",
    width: 292,
    height: 292,
    alignItems: "center",
    justifyContent: "center"
  },
  logoHalo: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(3, 10, 6, 0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  logo: { width: "100%", height: "100%" },
  loadingArea: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 0,
    alignItems: "center"
  },
  message: {
    width: "100%",
    color: "#fff0bd",
    fontSize: 17,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: theme.fonts.bold,
    textShadowColor: "rgba(0, 0, 0, 0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  progressTrack: {
    width: 224,
    height: 5,
    marginTop: 14,
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(231, 190, 96, 0.55)",
    backgroundColor: "rgba(8, 18, 11, 0.78)"
  },
  progressSweep: {
    width: 72,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#efb93f",
    shadowColor: "#ffd66e",
    shadowOpacity: 0.85,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 }
  }
});
