import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";

type WoodButtonProps = {
  label: string;
  onPress: () => void;
  primary?: boolean;
};

/** Chunky carved-wood menu button shared by the menu and result screens. */
export function WoodButton({ label, onPress, primary }: WoodButtonProps) {
  return (
    <SpringPressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.woodButton, primary ? styles.woodButtonPrimary : styles.woodButtonSecondary]}
    >
      <AssetImage
        assetKey="uiButtonWoodLarge"
        resizeMode="stretch"
        style={styles.woodButtonArt}
        fallback={
          <View style={primary ? styles.woodButtonPrimaryFill : styles.woodButtonSecondaryFill} />
        }
      />
      <View style={styles.woodGrainTop} />
      <Text style={[styles.woodButtonText, primary ? styles.woodButtonTextPrimary : null]}>
        {label}
      </Text>
      <View style={styles.woodGrainBottom} />
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  woodButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "rgba(42, 22, 8, 0.65)",
    paddingHorizontal: theme.spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  woodButtonPrimary: {
    backgroundColor: "#9a5a22"
  },
  woodButtonSecondary: {
    minHeight: 48,
    backgroundColor: "#6f421f"
  },
  woodButtonPrimaryFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#9a5a22"
  },
  woodButtonSecondaryFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#6f421f"
  },
  woodButtonArt: {
    ...StyleSheet.absoluteFillObject
  },
  woodButtonText: {
    color: "#ffe9ad",
    fontSize: 16,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center",
    textShadowColor: "rgba(42, 22, 8, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  },
  woodButtonTextPrimary: {
    color: "#fff2bf",
    fontSize: 19
  },
  woodGrainTop: {
    position: "absolute",
    top: 10,
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255, 215, 136, 0.28)"
  },
  woodGrainBottom: {
    position: "absolute",
    bottom: 11,
    left: 32,
    right: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(59, 28, 10, 0.34)"
  }
});
