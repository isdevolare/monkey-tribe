import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Circle, Ellipse, Line, Path, Polygon, Rect, Svg } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssetImage } from "../components/game/AssetImage";
import { CriticalAssetPreloader } from "../components/game/CriticalAssetPreloader";
import { SettingsModal } from "../components/game/SettingsModal";
import { WoodButton } from "../components/game/WoodButton";
import { playSound } from "../game/audio/soundManager";
import { areGameAssetsSettled } from "../game/assets/assetCache";
import { criticalVillageAssetKeys } from "../game/assets/villageCriticalAssets";
import { t } from "../game/i18n";
import { markTutorialForReplay } from "../game/settings/tutorial";
import { getPrimaryRoyalAppearance } from "../game/config/profileMonkeys";
import { useGameStore } from "../game/state/gameStore";
import { theme } from "../theme/theme";

export function MainMenuScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const lang = useGameStore((state) => state.language);
  const displays = useGameStore((state) => state.royalCharacterDisplays);
  const buildings = useGameStore((state) => state.buildings);
  const workerExpeditions = useGameStore((state) => state.workerExpeditions);
  const appearance = getPrimaryRoyalAppearance(displays);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 700;
  const [showSettings, setShowSettings] = useState(false);
  const criticalAssets = useMemo(
    () => criticalVillageAssetKeys({ buildings, workerExpeditions, royalCharacterDisplays: displays }),
    [buildings, displays, workerExpeditions]
  );
  const criticalAssetSignature = criticalAssets.join("|");
  const [villageAssetsReady, setVillageAssetsReady] = useState(() => areGameAssetsSettled(criticalAssets));
  const [enteringVillage, setEnteringVillage] = useState(false);
  const ambience = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setVillageAssetsReady(areGameAssetsSettled(criticalAssets));
  }, [criticalAssetSignature]);

  useEffect(() => {
    if (!enteringVillage || !villageAssetsReady) return;
    const frame = requestAnimationFrame(startGame);
    return () => cancelAnimationFrame(frame);
  }, [enteringVillage, startGame, villageAssetsReady]);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(ambience, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(ambience, { toValue: 0, duration: 11000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    ]));
    animation.start();
    return () => animation.stop();
  }, [ambience]);

  return (
    <View style={styles.screen}>
      <CriticalAssetPreloader assetKeys={criticalAssets} onReady={() => setVillageAssetsReady(true)} />
      <Animated.View
        style={[
          styles.backdropMotion,
          { transform: [
            { scale: ambience.interpolate({ inputRange: [0, 1], outputRange: [1.035, 1.055] }) },
            { translateY: ambience.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }
          ] }
        ]}
      >
        <AssetImage assetKey="bgMainMenuPremium" resizeMode="cover" style={styles.backdrop} fallback={<MenuBackdrop />} />
      </Animated.View>
      <View style={styles.overlay} />
      <Animated.View style={[styles.sunVeil, { opacity: ambience.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.18] }) }]} pointerEvents="none" />

      <View style={styles.decorLayer} pointerEvents="none">
        <Animated.View style={[styles.torchLeft, { opacity: ambience.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.86, 1, 0.9] }), transform: [{ scale: ambience.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] }) }] }]}>
          <AssetImage assetKey="menuTorch" resizeMode="contain" style={styles.fill} fallback={<View />} />
        </Animated.View>
        <Animated.View style={[styles.torchRight, { opacity: ambience.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0.88, 0.98] }), transform: [{ scale: ambience.interpolate({ inputRange: [0, 1], outputRange: [1.02, 0.98] }) }] }]}>
          <AssetImage assetKey="menuTorch" resizeMode="contain" style={styles.fill} fallback={<View />} />
        </Animated.View>
        <Animated.View style={[styles.leafA, { transform: [{ translateY: ambience.interpolate({ inputRange: [0, 1], outputRange: [-4, 12] }) }, { translateX: ambience.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) }, { rotate: ambience.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "8deg"] }) }] }]} />
        <Animated.View style={[styles.leafB, { transform: [{ translateY: ambience.interpolate({ inputRange: [0, 1], outputRange: [8, -6] }) }, { translateX: ambience.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }, { rotate: ambience.interpolate({ inputRange: [0, 1], outputRange: ["22deg", "-5deg"] }) }] }]} />
        <View style={styles.bottomScrimA} />
        <View style={styles.bottomScrimB} />
        <View style={styles.bottomScrimC} />
        <AssetImage assetKey="menuTotem" resizeMode="contain" style={styles.totem} fallback={<View />} />
        <AssetImage assetKey={appearance.villageAsset} resizeMode="contain" style={styles.mascot} fallback={<View />} />
        <View style={styles.bottomTag}>
          <Text style={styles.bottomTagText} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("menu.bottomTag", lang)}
          </Text>
        </View>
      </View>

      <View style={[styles.content, compact ? styles.contentCompact : null, { paddingTop: insets.top + (compact ? 12 : 26) }]}>
        <View style={styles.logoShadow}>
          <View style={styles.logoHalo} />
          <AssetImage
            assetKey="uiLogo"
            style={styles.logo}
            fallback={<HeroFallback />}
            hideFallbackOnLoad
          />
        </View>

        <Text style={styles.kicker}>{t("menu.tagline", lang)}</Text>
        <Text style={styles.subtitle}>{t("menu.subtitle", lang)}</Text>

        <View style={[styles.buttonStack, compact ? styles.buttonStackCompact : null]}>
          <View style={styles.primaryButtonGlow}>
            <WoodButton
              label={t("menu.start", lang)}
              onPress={() => {
                playSound("confirm");
                if (villageAssetsReady) startGame();
                else setEnteringVillage(true);
              }}
              primary
            />
          </View>
          <View style={styles.settingsButtonWrap}>
            <WoodButton
              label={t("menu.settings", lang)}
              onPress={() => {
                playSound("open");
                setShowSettings(true);
              }}
            />
          </View>
        </View>
      </View>

      <SettingsModal
        visible={showSettings}
        lang={lang}
        onPickLanguage={setLanguage}
        onReplayTutorial={() => {
          void markTutorialForReplay();
          setShowSettings(false);
        }}
        onClose={() => setShowSettings(false)}
      />
      {enteringVillage && !villageAssetsReady ? (
        <View style={styles.villageEntryOverlay}>
          <View style={styles.villageEntryShade} />
          <Text style={styles.villageEntryText} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("loading.buildingVillage", lang)}
          </Text>
          <View style={styles.villageEntryTrack}>
            <Animated.View
              style={[
                styles.villageEntryProgress,
                { opacity: ambience.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function MenuBackdrop() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 760">
      <Rect width="390" height="760" fill="#173d2b" />
      <Circle cx="42" cy="74" r="86" fill="#2c7440" />
      <Circle cx="342" cy="120" r="110" fill="#315f32" />
      <Circle cx="62" cy="646" r="128" fill="#2f6f39" />
      <Path d="M28 520 C110 450 185 460 260 380 C310 330 344 270 380 246" stroke="#9b7446" strokeWidth="42" fill="none" />
      <Path d="M0 510 C84 454 169 464 247 386 C303 331 340 278 390 247" stroke="#b68852" strokeWidth="19" fill="none" />
      <Circle cx="78" cy="420" r="34" fill="#2d8547" />
      <Circle cx="112" cy="396" r="42" fill="#46a456" />
      <Circle cx="332" cy="526" r="42" fill="#2c7440" />
      <Circle cx="300" cy="506" r="32" fill="#3c934f" />
    </Svg>
  );
}

function HeroFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 190 190">
      <Circle cx="95" cy="95" r="78" fill="#f4d35e" opacity="0.22" />
      <Rect x="80" y="28" width="30" height="118" rx="14" fill="#70431f" />
      <Circle cx="52" cy="63" r="42" fill="#2d8547" />
      <Circle cx="132" cy="58" r="48" fill="#46a456" />
      <Circle cx="102" cy="36" r="44" fill="#3c934f" />
      <Circle cx="58" cy="94" r="25" fill="#8b5e35" />
      <Circle cx="132" cy="94" r="25" fill="#8b5e35" />
      <Circle cx="95" cy="116" r="52" fill="#8b5e35" />
      <Ellipse cx="95" cy="132" rx="33" ry="25" fill="#d6a46b" />
      <Circle cx="78" cy="108" r="7" fill="#1d1612" />
      <Circle cx="112" cy="108" r="7" fill="#1d1612" />
      <Path d="M80 135 Q95 149 110 135" stroke="#1d1612" strokeWidth="6" fill="none" />
      <Line x1="128" y1="144" x2="166" y2="106" stroke="#efe3bb" strokeWidth="7" />
      <Line x1="126" y1="146" x2="115" y2="157" stroke="#6a4121" strokeWidth="8" />
      <Path d="M32 50 C21 70 23 95 41 108" stroke="#ffd95a" strokeWidth="11" fill="none" />
      <Polygon points="94,14 104,33 84,33" fill="#ffd95a" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.jungle
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  backdropMotion: {
    ...StyleSheet.absoluteFillObject
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(4, 14, 8, 0.28)"
  },
  sunVeil: {
    position: "absolute",
    top: -90,
    left: "14%",
    width: 90,
    height: "62%",
    borderRadius: 999,
    backgroundColor: "#ffe8a3",
    transform: [{ rotate: "14deg" }]
  },
  decorLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  mascot: {
    position: "absolute",
    left: -6,
    bottom: 4,
    width: 99,
    height: 132
  },
  totem: {
    position: "absolute",
    right: 7,
    bottom: 10,
    width: 60,
    height: 105
  },
  bottomScrimA: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    backgroundColor: "rgba(4, 10, 6, 0.18)"
  },
  bottomScrimB: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    backgroundColor: "rgba(4, 10, 6, 0.26)"
  },
  bottomScrimC: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 44,
    backgroundColor: "rgba(4, 10, 6, 0.36)"
  },
  bottomTag: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(242, 196, 101, 0.64)",
    backgroundColor: "rgba(12, 14, 8, 0.88)",
    paddingHorizontal: 18,
    paddingVertical: 7,
    shadowColor: "#efb93f",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7
  },
  bottomTagText: {
    color: "#ffe9ad",
    fontSize: theme.type.label,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  torchLeft: {
    position: "absolute",
    left: 4,
    top: 150,
    width: 58,
    height: 120
  },
  torchRight: {
    position: "absolute",
    right: 6,
    top: 150,
    width: 58,
    height: 120
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingRight: theme.spacing.xl,
    paddingBottom: 130,
    paddingLeft: theme.spacing.xl
  },
  contentCompact: { paddingBottom: 104 },
  logoShadow: {
    width: 282,
    height: 282,
    marginBottom: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  logoHalo: {
    position: "absolute",
    width: 242,
    height: 242,
    borderRadius: 121,
    backgroundColor: "rgba(3, 10, 6, 0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  logo: {
    width: 282,
    height: 282
  },
  kicker: {
    color: theme.colors.banana,
    fontSize: 15,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    letterSpacing: 0.25,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: "none"
  },
  subtitle: {
    maxWidth: 320,
    marginTop: 5,
    color: "#f3f0d7",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800", fontFamily: theme.fonts.bold,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  buttonStack: {
    width: "100%",
    maxWidth: 310,
    gap: 7,
    marginTop: 18
  },
  buttonStackCompact: { marginTop: 10, gap: 5 },
  primaryButtonGlow: {
    borderRadius: 14,
    shadowColor: "#ffd66e",
    shadowOpacity: 0.38,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10
  },
  settingsButtonWrap: { width: "86%", alignSelf: "center", opacity: 0.94 },
  fill: { width: "100%", height: "100%" },
  leafA: {
    position: "absolute",
    top: "18%",
    left: "9%",
    width: 12,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(112, 171, 58, 0.48)"
  },
  leafB: {
    position: "absolute",
    top: "37%",
    right: "11%",
    width: 10,
    height: 25,
    borderRadius: 999,
    backgroundColor: "rgba(76, 137, 47, 0.42)"
  },
  villageEntryOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center"
  },
  villageEntryShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 11, 6, 0.62)"
  },
  villageEntryText: {
    color: "#fff0bd",
    fontSize: 17,
    lineHeight: 22,
    fontFamily: theme.fonts.bold,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  villageEntryTrack: {
    width: 156,
    height: 5,
    marginTop: 12,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(7, 18, 10, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(235, 190, 91, 0.52)"
  },
  villageEntryProgress: {
    width: "100%",
    height: 3,
    borderRadius: 999,
    backgroundColor: "#e9b544"
  }
});
