import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useSoundStore } from "./soundManager";

// Haptics ride the SFX mute switch: muting the game feel mutes the
// buzzing too. All calls are fire-and-forget and no-op on web.
const supported = Platform.OS === "ios" || Platform.OS === "android";

function enabled() {
  return supported && !useSoundStore.getState().sfxMuted;
}

/** Light tick for selections and ordinary taps. */
export function hapticSelect() {
  if (!enabled()) {
    return;
  }
  Haptics.selectionAsync().catch(() => undefined);
}

/** Physical thump for hits and completed work. */
export function hapticImpact(strength: "light" | "medium" = "light") {
  if (!enabled()) {
    return;
  }
  Haptics.impactAsync(
    strength === "medium"
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Light
  ).catch(() => undefined);
}

/** End-of-battle verdicts. */
export function hapticOutcome(kind: "success" | "error") {
  if (!enabled()) {
    return;
  }
  Haptics.notificationAsync(
    kind === "success"
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Error
  ).catch(() => undefined);
}
