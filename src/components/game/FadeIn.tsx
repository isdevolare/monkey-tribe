import { type ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

type FadeInProps = {
  children: ReactNode;
  duration?: number;
  /** Vertical offset the content rises from, in px. */
  rise?: number;
  style?: StyleProp<ViewStyle>;
};

// Fades + gently rises its children in on mount, for premium screen transitions.
export function FadeIn({ children, duration = 260, rise = 12, style }: FadeInProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [t, duration]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] });

  return (
    <Animated.View style={[style, { opacity: t, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
