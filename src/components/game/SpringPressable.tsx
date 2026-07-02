import { useRef } from "react";
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { playSound, type SoundName } from "../../game/audio/soundManager";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SpringPressableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Sound played on press-in; pass null to stay silent. Defaults to "tap". */
  sound?: SoundName | null;
};

/**
 * Pressable with the game's shared touch feel: a quick scale-down on press
 * and a bouncy spring back on release, plus the tap sound.
 */
export function SpringPressable({
  style,
  sound = "tap",
  onPressIn,
  onPressOut,
  ...rest
}: SpringPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn(event: GestureResponderEvent) {
    if (sound) {
      playSound(sound);
    }
    Animated.spring(scale, {
      toValue: 0.92,
      speed: 50,
      bounciness: 4,
      useNativeDriver: true
    }).start();
    onPressIn?.(event);
  }

  function handlePressOut(event: GestureResponderEvent) {
    Animated.spring(scale, {
      toValue: 1,
      speed: 20,
      bounciness: 14,
      useNativeDriver: true
    }).start();
    onPressOut?.(event);
  }

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { transform: [{ scale }] }]}
    />
  );
}
