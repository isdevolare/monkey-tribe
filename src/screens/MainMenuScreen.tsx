import { StyleSheet, Text, View } from "react-native";
import { Circle, Ellipse, Path, Svg } from "react-native-svg";
import { GameButton } from "../components/game/GameButton";
import { useGameStore } from "../game/state/gameStore";
import { theme } from "../theme/theme";

export function MainMenuScreen() {
  const startGame = useGameStore((state) => state.startGame);

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          <Circle cx="90" cy="92" r="70" fill="#3f9c52" />
          <Circle cx="55" cy="72" r="25" fill="#8b5e35" />
          <Circle cx="125" cy="72" r="25" fill="#8b5e35" />
          <Circle cx="90" cy="96" r="54" fill="#8b5e35" />
          <Ellipse cx="90" cy="112" rx="35" ry="27" fill="#d6a46b" />
          <Circle cx="72" cy="88" r="7" fill="#1d1612" />
          <Circle cx="108" cy="88" r="7" fill="#1d1612" />
          <Path d="M74 116 Q90 132 106 116" stroke="#1d1612" strokeWidth="7" fill="none" />
          <Path d="M126 42 C151 51 159 72 144 88" stroke="#ffd95a" strokeWidth="12" fill="none" />
        </Svg>
      </View>
      <Text style={styles.title}>Monkey Tribe</Text>
      <Text style={styles.subtitle}>Gather, train, and raid the enemy camp.</Text>
      <View style={styles.buttonWrap}>
        <GameButton label="Start Game" onPress={startGame} />
      </View>
    </View>
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
  hero: {
    marginBottom: theme.spacing.lg
  },
  title: {
    color: theme.colors.paper,
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center"
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    color: "#dcefc9",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center"
  },
  buttonWrap: {
    width: "100%",
    maxWidth: 280,
    marginTop: theme.spacing.xl
  }
});
