import { StyleSheet, Text, View } from "react-native";
import { GameButton } from "../components/game/GameButton";
import { useGameStore } from "../game/state/gameStore";
import { theme } from "../theme/theme";

export function ResultScreen() {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const resetGame = useGameStore((state) => state.resetGame);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const victory = gameStatus === "victory";

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>{victory ? "Enemy camp destroyed" : "The tribe has fallen"}</Text>
      <Text style={styles.title}>{victory ? "Victory" : "Defeat"}</Text>
      <View style={styles.actions}>
        <GameButton label="Restart" onPress={resetGame} />
        <GameButton label="Main Menu" onPress={goToMenu} />
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
  kicker: {
    color: "#dcefc9",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase"
  },
  title: {
    marginTop: theme.spacing.sm,
    color: theme.colors.paper,
    fontSize: 46,
    fontWeight: "900",
    textAlign: "center"
  },
  actions: {
    width: "100%",
    maxWidth: 280,
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl
  }
});
