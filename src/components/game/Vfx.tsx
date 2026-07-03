import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

// Lightweight View-based particles. Everything animates transform/opacity
// only (native driver) so effects stay off the JS thread on device.

type SparkBurstProps = {
  /** Distinct bursts need distinct keys; the burst plays once on mount. */
  size?: number;
  color?: string;
  count?: number;
};

// Little radial impact burst for hits.
export function SparkBurst({ size = 34, color = "#ffd95a", count = 7 }: SparkBurstProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [t]);

  const opacity = t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });

  return (
    <View pointerEvents="none" style={[styles.burstWrap, { width: size, height: size }]}>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + 0.4;
        const reach = size * (0.38 + (index % 3) * 0.12);
        const translateX = t.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * reach]
        });
        const translateY = t.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * reach]
        });
        const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] });
        return (
          <Animated.View
            key={index}
            style={[
              styles.spark,
              {
                backgroundColor: color,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }]
              }
            ]}
          />
        );
      })}
    </View>
  );
}

type PulseRingProps = {
  size?: number;
  color?: string;
  duration?: number;
};

// Expanding ring + dust puffs for finished construction.
export function PulseRing({ size = 90, color = "rgba(255, 224, 151, 0.9)", duration = 650 }: PulseRingProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [t, duration]);

  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });
  const opacity = t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.9, 0] });

  return (
    <View pointerEvents="none" style={[styles.burstWrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            opacity,
            transform: [{ scale }]
          }
        ]}
      />
      {Array.from({ length: 6 }, (_, index) => {
        const angle = (index / 6) * Math.PI * 2;
        const translateX = t.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * size * 0.42]
        });
        const translateY = t.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * size * 0.3 - size * 0.08]
        });
        return (
          <Animated.View
            key={index}
            style={[styles.dust, { opacity, transform: [{ translateX }, { translateY }] }]}
          />
        );
      })}
    </View>
  );
}

const CONFETTI_COLORS = ["#ffd95a", "#8fd14f", "#ff8a5c", "#7ec8e3", "#f4a7c3", "#fff2bf"];

type ConfettiProps = {
  /** Spread width in px; pieces fall from the top of this area. */
  width: number;
  height: number;
  count?: number;
};

// One-shot celebration confetti for victory panels.
export function Confetti({ width, height, count = 26 }: ConfettiProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 1500,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [t]);

  const opacity = t.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { overflow: "hidden" }]}>
      {Array.from({ length: count }, (_, index) => {
        const seed = (index * 137.5) % 100;
        const startX = (seed / 100) * width;
        const drift = ((index % 5) - 2) * width * 0.06;
        const fall = height * (0.75 + ((index * 31) % 25) / 100);
        const delayPart = (index % 6) / 14;
        const translateY = t.interpolate({
          inputRange: [0, delayPart, 1],
          outputRange: [-24, -24, fall]
        });
        const translateX = t.interpolate({
          inputRange: [0, 1],
          outputRange: [startX, startX + drift]
        });
        const rotate = t.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${((index % 4) - 1.5) * 520}deg`]
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                width: 6 + (index % 3) * 2,
                height: 9 + ((index + 1) % 3) * 2,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }]
              }
            ]}
          />
        );
      })}
    </View>
  );
}

// Scale 0 -> 1.1 -> 1 entrance for things that spawn into the scene.
export function PopIn({
  children,
  delay = 0,
  style
}: {
  children: React.ReactNode;
  delay?: number;
  style?: object;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 320,
      delay,
      easing: Easing.out(Easing.back(2.2)),
      useNativeDriver: true
    }).start();
  }, [t, delay]);

  return (
    <Animated.View style={[style, { opacity: t, transform: [{ scale: t }] }]}>
      {children}
    </Animated.View>
  );
}

// Gentle looping twinkle for workers gathering on a shift.
export function Sparkle({ seed = 0 }: { seed?: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(600 + (seed % 5) * 260),
        Animated.timing(t, { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 420, useNativeDriver: true }),
        Animated.delay(900)
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, seed]);

  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.sparkle, { opacity: t, transform: [{ scale }, { rotate: "45deg" }] }]}
    />
  );
}

const styles = StyleSheet.create({
  burstWrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  spark: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3
  },
  ring: {
    position: "absolute",
    borderWidth: 3
  },
  dust: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(214, 190, 140, 0.85)"
  },
  confetti: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: 2
  },
  sparkle: {
    position: "absolute",
    top: "6%",
    right: "10%",
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: "#fff2bf",
    shadowColor: "#ffd95a",
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 }
  }
});
