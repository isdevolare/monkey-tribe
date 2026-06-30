import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Circle, Ellipse, Line, Path, Polygon, Rect, Svg } from "react-native-svg";
import { AssetImage } from "../components/game/AssetImage";
import { SettingsModal } from "../components/game/SettingsModal";
import { t } from "../game/i18n";
import { useGameStore } from "../game/state/gameStore";
import { theme } from "../theme/theme";

export function MainMenuScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const lang = useGameStore((state) => state.language);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <View style={styles.screen}>
      <AssetImage assetKey="bgMainMenu" resizeMode="cover" style={styles.backdrop} fallback={<MenuBackdrop />} />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.logoShadow}>
          <AssetImage assetKey="uiLogo" style={styles.logo} fallback={<HeroFallback />} />
        </View>

        <Text style={styles.kicker}>{t("menu.tagline", lang)}</Text>
        <Text style={styles.subtitle}>{t("menu.subtitle", lang)}</Text>

        <View style={styles.buttonStack}>
          <WoodButton label={t("menu.start", lang)} onPress={startGame} primary />
          <WoodButton label={t("menu.settings", lang)} onPress={() => setShowSettings(true)} />
        </View>
      </View>

      <SettingsModal
        visible={showSettings}
        lang={lang}
        onPickLanguage={setLanguage}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}

function WoodButton({
  label,
  onPress,
  primary
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.woodButton,
        primary ? styles.woodButtonPrimary : styles.woodButtonSecondary,
        pressed ? styles.woodButtonPressed : null
      ]}
    >
      <AssetImage
        assetKey="uiButtonWoodLarge"
        resizeMode="stretch"
        style={styles.woodButtonArt}
        fallback={<View style={primary ? styles.woodButtonPrimaryFill : styles.woodButtonSecondaryFill} />}
      />
      <View style={styles.woodGrainTop} />
      <Text style={[styles.woodButtonText, primary ? styles.woodButtonTextPrimary : null]}>{label}</Text>
      <View style={styles.woodGrainBottom} />
    </Pressable>
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
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(6, 18, 11, 0.42)"
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 52,
    paddingRight: theme.spacing.xl,
    paddingBottom: 38,
    paddingLeft: theme.spacing.xl
  },
  logoShadow: {
    width: 282,
    height: 282,
    marginBottom: theme.spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.48,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14
  },
  logo: {
    width: 282,
    height: 282
  },
  kicker: {
    color: theme.colors.banana,
    fontSize: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    letterSpacing: 0,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: "uppercase"
  },
  subtitle: {
    maxWidth: 320,
    marginTop: theme.spacing.sm,
    color: "#f3f0d7",
    fontSize: 16,
    fontWeight: "800", fontFamily: theme.fonts.bold,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  buttonStack: {
    width: "100%",
    maxWidth: 310,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl
  },
  woodButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "rgba(42, 22, 8, 0.65)",
    paddingHorizontal: theme.spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  woodButtonPrimary: {
    backgroundColor: "#9a5a22"
  },
  woodButtonSecondary: {
    minHeight: 48,
    backgroundColor: "#6f421f"
  },
  woodButtonPrimaryFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#9a5a22"
  },
  woodButtonSecondaryFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#6f421f"
  },
  woodButtonArt: {
    ...StyleSheet.absoluteFillObject
  },
  woodButtonPressed: {
    transform: [{ translateY: 2 }, { scale: 0.985 }],
    opacity: 0.92
  },
  woodButtonText: {
    color: "#ffe9ad",
    fontSize: 16,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center",
    textShadowColor: "rgba(42, 22, 8, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },
  woodButtonTextPrimary: {
    color: "#fff2bf",
    fontSize: 19
  },
  woodGrainTop: {
    position: "absolute",
    top: 10,
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255, 215, 136, 0.28)"
  },
  woodGrainBottom: {
    position: "absolute",
    bottom: 11,
    left: 32,
    right: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(59, 28, 10, 0.34)"
  }
});
