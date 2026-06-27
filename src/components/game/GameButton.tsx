import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme/theme";

type GameButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  helperText?: string;
  tone?: "primary" | "secondary" | "danger";
  children?: ReactNode;
};

export function GameButton({
  label,
  onPress,
  disabled,
  helperText,
  tone = "primary",
  children
}: GameButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "secondary" ? styles.secondary : null,
        tone === "danger" ? styles.danger : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null
      ]}
    >
      {children}
      <View style={styles.copy}>
        <Text style={[styles.label, disabled ? styles.disabledLabel : null]}>{label}</Text>
        {helperText ? (
          <Text style={[styles.helper, disabled ? styles.disabledLabel : null]}>{helperText}</Text>
        ) : null}
      </View>
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
  secondary: {
    backgroundColor: theme.colors.panel
  },
  danger: {
    backgroundColor: "#efb0a7"
  },
  copy: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
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
  helper: {
    marginTop: 2,
    color: "#4d5837",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  pressed: {
    transform: [{ scale: 0.98 }]
  }
});
