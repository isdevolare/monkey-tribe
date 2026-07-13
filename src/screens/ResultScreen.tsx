import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Circle, Line, Path, Svg } from "react-native-svg";
import { AssetImage } from "../components/game/AssetImage";
import { Confetti } from "../components/game/Vfx";
import { WoodButton } from "../components/game/WoodButton";
import { t } from "../game/i18n";
import { useGameStore } from "../game/state/gameStore";
import { theme } from "../theme/theme";

// Staggered fade+rise so the panel contents reveal one by one.
function useReveal(order: number) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 360,
      delay: 180 + order * 170,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [t, order]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return { opacity: t, transform: [{ translateY }] };
}

export function ResultScreen() {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const resetGame = useGameStore((state) => state.resetGame);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const lang = useGameStore((state) => state.language);
  const victory = gameStatus === "victory";
  const { width, height } = useWindowDimensions();
  const heroReveal = useReveal(0);
  const titleReveal = useReveal(1);
  const textReveal = useReveal(2);
  const actionsReveal = useReveal(3);

  return (
    <View style={styles.screen}>
      <AssetImage
        assetKey="bgJungleGame"
        resizeMode="cover"
        style={styles.backdrop}
        fallback={<View style={styles.backdropFallback} />}
      />
      <View style={[styles.overlay, victory ? styles.overlayVictory : styles.overlayDefeat]} />

      <View style={styles.card}>
        <Animated.View style={heroReveal}>
          <View style={[styles.heroRing, victory ? styles.heroRingVictory : styles.heroRingDefeat]}>
            <AssetImage
              assetKey={victory ? "unitFighter" : "unitWorker"}
              style={styles.resultHero}
              fallback={<ResultFallback victory={victory} />}
            />
          </View>
        </Animated.View>

        <Animated.View style={titleReveal}>
          <Text style={[styles.kicker, victory ? styles.kickerVictory : styles.kickerDefeat]}>
            {victory ? t("result.victoryKicker", lang) : t("result.defeatKicker", lang)}
          </Text>
          <Text style={styles.title}>
            {victory ? t("result.victory", lang) : t("result.defeat", lang)}
          </Text>
        </Animated.View>
        <Animated.View style={textReveal}>
          <Text style={styles.subtitle}>
            {victory ? t("result.victoryText", lang) : t("result.defeatText", lang)}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.actions, actionsReveal]}>
          <WoodButton label={t("result.retry", lang)} onPress={resetGame} primary />
          <WoodButton label={t("result.menu", lang)} onPress={goToMenu} />
        </Animated.View>
      </View>

      {victory ? <Confetti width={width} height={height} count={34} /> : null}
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
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  backdropFallback: {
    flex: 1,
    backgroundColor: "#0f281c"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject
  },
  overlayVictory: {
    backgroundColor: "rgba(9, 26, 12, 0.6)"
  },
  overlayDefeat: {
    backgroundColor: "rgba(24, 8, 6, 0.66)"
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(226, 177, 90, 0.45)",
    backgroundColor: "rgba(17, 20, 14, 0.92)",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14
  },
  heroRing: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 66,
    borderWidth: 3,
    backgroundColor: "rgba(10, 14, 8, 0.55)",
    overflow: "hidden"
  },
  heroRingVictory: {
    borderColor: "#e2b15a"
  },
  heroRingDefeat: {
    borderColor: "#8a4a3c"
  },
  resultHero: {
    width: 112,
    height: 112
  },
  kicker: {
    marginTop: theme.spacing.lg,
    fontSize: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center",
    textTransform: "uppercase"
  },
  kickerVictory: {
    color: "#c6ee89"
  },
  kickerDefeat: {
    color: "#f0b9a4"
  },
  title: {
    marginTop: 2,
    color: theme.colors.paper,
    fontSize: 42,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 4
  },
  subtitle: {
    maxWidth: 300,
    marginTop: theme.spacing.xs,
    color: "#d8ccb0",
    fontSize: 15,
    fontWeight: "700", fontFamily: theme.fonts.regular,
    textAlign: "center"
  },
  actions: {
    width: "100%",
    maxWidth: 280,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg
  }
});
