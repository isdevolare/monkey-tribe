import { StyleSheet, Text, View } from "react-native";
import { Circle, Ellipse, Line, Path, Polygon, Rect, Svg } from "react-native-svg";
import { AssetImage } from "../components/game/AssetImage";
import { GameButton } from "../components/game/GameButton";
import { useGameStore } from "../game/state/gameStore";
import { theme } from "../theme/theme";

export function MainMenuScreen() {
  const startGame = useGameStore((state) => state.startGame);

  return (
    <View style={styles.screen}>
      <AssetImage assetKey="bgMainMenu" resizeMode="cover" style={styles.backdrop} fallback={<MenuBackdrop />} />

      <View style={styles.hero}>
        <AssetImage assetKey="uiLogo" style={styles.heroAsset} fallback={<HeroFallback />} />
      </View>

      <Text style={styles.kicker}>Survival RTS Prototype</Text>
      <Text style={styles.title}>Monkey Tribe</Text>
      <Text style={styles.subtitle}>Gather the jungle, raise huts, train fighters, and break the rival camp.</Text>

      <View style={styles.buttonWrap}>
        <GameButton label="Start Game" helperText="Lead the tribe" onPress={startGame} />
      </View>
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
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.jungle
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  hero: {
    width: 190,
    height: 190,
    marginBottom: theme.spacing.lg
  },
  heroAsset: {
    width: 190,
    height: 190
  },
  kicker: {
    color: "#bddf96",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.paper,
    fontSize: 43,
    fontWeight: "900",
    textAlign: "center"
  },
  subtitle: {
    maxWidth: 320,
    marginTop: theme.spacing.sm,
    color: "#e3f2cf",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center"
  },
  buttonWrap: {
    width: "100%",
    maxWidth: 300,
    marginTop: theme.spacing.xl
  }
});
