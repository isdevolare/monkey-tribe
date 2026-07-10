import { useMemo, useRef } from "react";
import { PanResponder, StyleSheet, View } from "react-native";

type VolumeSliderProps = {
  /** 0..1 */
  value: number;
  onChange: (value: number) => void;
};

/**
 * Dependency-free volume slider: a PanResponder over a gold-trimmed rail,
 * styled to match the settings card. Tap anywhere or drag the thumb.
 */
export function VolumeSlider({ value, onChange }: VolumeSliderProps) {
  const trackWidth = useRef(0);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          applyTouch(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          applyTouch(event.nativeEvent.locationX);
        }
      }),
    []
  );

  function applyTouch(x: number) {
    if (trackWidth.current <= 0) {
      return;
    }
    const ratio = Math.min(1, Math.max(0, x / trackWidth.current));
    changeRef.current(ratio);
  }

  const percent = Math.min(1, Math.max(0, value)) * 100;

  return (
    <View
      style={styles.touchArea}
      onLayout={(event) => {
        trackWidth.current = event.nativeEvent.layout.width;
      }}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      {...pan.panHandlers}
    >
      <View pointerEvents="none" style={styles.rail}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <View pointerEvents="none" style={[styles.thumb, { left: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    flex: 1,
    height: 36,
    justifyContent: "center"
  },
  rail: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(20, 16, 10, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.18)",
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#8fbc4f"
  },
  thumb: {
    position: "absolute",
    top: 7,
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(226, 177, 90, 0.9)",
    backgroundColor: "#f7efdd",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  }
});
