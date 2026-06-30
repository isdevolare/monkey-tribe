import { type ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

type LivelyUnitProps = {
  children: ReactNode;
  /** Stable per-unit seed so units don't bob in lockstep. */
  seed: number;
  /** Extra vertical reach in px (defaults to a gentle idle bob). */
  amplitude?: number;
  style?: StyleProp<ViewStyle>;
};

// Wraps a unit sprite in a looping bob + sway so the scene feels alive
// without any game-state movement. Uses the native driver (transform only).
export function LivelyUnit({ children, seed, amplitude = 6, style }: LivelyUnitProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 1300 + (seed % 6) * 180;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [seed, t]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -amplitude] });
  const translateX = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-2.5, 2.5, -2.5] });
  const rotate = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["-3deg", "3deg", "-3deg"] });

  return (
    <Animated.View style={[{ transform: [{ translateX }, { translateY }, { rotate }] }, style]}>
      {children}
    </Animated.View>
  );
}
