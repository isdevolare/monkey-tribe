import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme/theme";
import { NineSliceFrame } from "./NineSliceFrame";
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
      <View style={primary ? styles.woodButtonPrimaryFill : styles.woodButtonSecondaryFill} />
      <NineSliceFrame preset="woodButton" cornerSize={26} style={StyleSheet.absoluteFill} />
      <Text
        style={[styles.woodButtonText, primary ? styles.woodButtonTextPrimary : null]}
        numberOfLines={1}
        maxFontSizeMultiplier={theme.maxFontScale}
      >
        {label}
      </Text>
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  woodButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(58, 30, 10, 0.85)",
    paddingHorizontal: theme.spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  woodButtonPrimary: {
    backgroundColor: "#8a4d1c"
  },
  woodButtonSecondary: {
    minHeight: 48,
    backgroundColor: "#66401e"
  },
  woodButtonPrimaryFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#8a4d1c"
  },
  woodButtonSecondaryFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#66401e"
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
  }
});
