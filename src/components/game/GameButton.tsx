import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../../theme/theme";

type GameButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children?: ReactNode;
};

export function GameButton({ label, onPress, disabled, children }: GameButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null
      ]}
    >
      {children}
      <Text style={[styles.label, disabled ? styles.disabledLabel : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.banana,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  disabled: {
    borderColor: theme.colors.panelDark,
    backgroundColor: "#d8d2aa"
  },
  disabledLabel: {
    color: "#827a58"
  },
  label: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center"
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});
