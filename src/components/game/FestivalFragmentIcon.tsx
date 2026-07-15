import { StyleSheet, View } from "react-native";

/**
 * Per-skin Festival fragment marker. This is deliberately mask-shaped rather
 * than gem-shaped and never represents a spendable balance.
 */
export function FestivalFragmentIcon({
  size = 20,
  tint = "#f4c95f"
}: {
  size?: number;
  tint?: string;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.root, { width: size, height: size }]}
    >
      <View
        style={[
          styles.leftRibbon,
          {
            width: size * 0.38,
            height: size * 0.16,
            left: size * 0.02,
            top: size * 0.18,
            backgroundColor: tint
          }
        ]}
      />
      <View
        style={[
          styles.rightRibbon,
          {
            width: size * 0.38,
            height: size * 0.16,
            right: size * 0.02,
            top: size * 0.18,
            backgroundColor: tint
          }
        ]}
      />
      <View
        style={[
          styles.mask,
          {
            width: size * 0.7,
            height: size * 0.76,
            left: size * 0.15,
            top: size * 0.12,
            borderRadius: size * 0.22,
            borderColor: tint,
            backgroundColor: "#48255f"
          }
        ]}
      >
        <View style={styles.eyes}>
          <View style={[styles.eye, { width: size * 0.12, height: size * 0.1, backgroundColor: tint }]} />
          <View style={[styles.eye, { width: size * 0.12, height: size * 0.1, backgroundColor: tint }]} />
        </View>
        <View style={[styles.mark, { width: size * 0.19, height: size * 0.07, backgroundColor: tint }]} />
      </View>
      <View
        style={[
          styles.chip,
          {
            width: size * 0.18,
            height: size * 0.23,
            right: size * 0.1,
            bottom: size * 0.02,
            backgroundColor: "#151018",
            borderColor: tint
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "relative" },
  leftRibbon: { position: "absolute", borderRadius: 99, transform: [{ rotate: "-34deg" }] },
  rightRibbon: { position: "absolute", borderRadius: 99, transform: [{ rotate: "34deg" }] },
  mask: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    transform: [{ rotate: "-5deg" }],
    shadowColor: "#fff",
    shadowOpacity: 0.35,
    shadowRadius: 3
  },
  eyes: { flexDirection: "row", gap: 3 },
  eye: { borderRadius: 99, transform: [{ rotate: "12deg" }] },
  mark: { marginTop: 3, borderRadius: 99 },
  chip: { position: "absolute", borderRadius: 3, borderWidth: 1, transform: [{ rotate: "18deg" }] }
});
