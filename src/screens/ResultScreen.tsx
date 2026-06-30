import { StyleSheet, Text, View } from "react-native";
import { Circle, Line, Path, Svg } from "react-native-svg";
import { AssetImage } from "../components/game/AssetImage";
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
      <AssetImage
        assetKey={victory ? "unitFighter" : "unitWorker"}
        style={styles.resultHero}
        fallback={<ResultFallback victory={victory} />}
      />
      <Text style={styles.kicker}>{victory ? "Enemy camp destroyed" : "The jungle pushed back"}</Text>
      <Text style={styles.title}>{victory ? "Victory" : "Defeat"}</Text>
      <Text style={styles.subtitle}>
        {victory
          ? "The tribe holds the clearing. The bananas are safe for now."
          : "Rebuild faster, add huts, and do not let the enemy camp snowball."}
      </Text>
      <View style={styles.actions}>
        <GameButton label="Retry" helperText="Start the fight again" onPress={resetGame} />
        <GameButton label="Main Menu" tone="secondary" onPress={goToMenu} />
      </View>
    </View>
  );
}

function ResultFallback({ victory }: { victory: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 170 170">
      <Circle cx="85" cy="85" r="72" fill={victory ? "#3f9c52" : "#7f2d25"} />
      <Circle cx="52" cy="72" r="22" fill="#8b5e35" />
      <Circle cx="118" cy="72" r="22" fill="#8b5e35" />
      <Circle cx="85" cy="95" r="48" fill="#8b5e35" />
      <Circle cx="68" cy="90" r="6" fill="#1d1612" />
      <Circle cx="102" cy="90" r="6" fill="#1d1612" />
      {victory ? (
        <>
          <Path d="M67 109 Q85 126 103 109" stroke="#1d1612" strokeWidth="6" fill="none" />
          <Path d="M103 36 L119 66 L86 60 Z" fill="#ffd95a" />
        </>
      ) : (
        <>
          <Line x1="68" y1="112" x2="102" y2="112" stroke="#1d1612" strokeWidth="6" />
          <Path d="M46 42 C36 57 38 74 52 83" stroke="#efdfc6" strokeWidth="8" fill="none" />
        </>
      )}
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
  resultHero: {
    width: 170,
    height: 170
  },
  kicker: {
    marginTop: theme.spacing.lg,
    color: "#dcefc9",
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center",
    textTransform: "uppercase"
  },
  title: {
    marginTop: theme.spacing.sm,
    color: theme.colors.paper,
    fontSize: 46,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  subtitle: {
    maxWidth: 310,
    marginTop: theme.spacing.sm,
    color: "#e3f2cf",
    fontSize: 16,
    fontWeight: "700", fontFamily: theme.fonts.regular,
    textAlign: "center"
  },
  actions: {
    width: "100%",
    maxWidth: 300,
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl
  }
});
