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

// Tiny seeded RNG so each unit gets a stable, different stroll path.
function makeRng(seed: number) {
  let a = seed * 1234567 + 99;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let v = Math.imul(a ^ (a >>> 15), 1 | a);
    v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v;
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

type WanderingUnitProps = {
  children: ReactNode;
  seed: number;
  /** Horizontal/vertical stroll radius in px. */
  range?: number;
  style?: StyleProp<ViewStyle>;
};

// Strolls the unit between a few nearby waypoints (plus a walk bob), so
// village monkeys actually move around instead of bobbing in place.
export function WanderingUnit({ children, seed, range = 16, style }: WanderingUnitProps) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rng = makeRng(seed);
    const steps: Animated.CompositeAnimation[] = [];

    for (let i = 0; i < 4; i += 1) {
      const targetX = (rng() * 2 - 1) * range;
      const targetY = (rng() * 2 - 1) * range * 0.55;
      const duration = 1700 + rng() * 1500;
      steps.push(
        Animated.parallel([
          Animated.timing(tx, {
            toValue: targetX,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(ty, {
            toValue: targetY,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      );
      steps.push(Animated.delay(350 + rng() * 800));
    }

    const walk = Animated.loop(Animated.sequence(steps));
    walk.start();

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );
    bobLoop.start();

    return () => {
      walk.stop();
      bobLoop.stop();
    };
  }, [seed, range, tx, ty, bob]);

  const translateY = Animated.add(ty, bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }));

  return (
    <Animated.View style={[{ transform: [{ translateX: tx }, { translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
