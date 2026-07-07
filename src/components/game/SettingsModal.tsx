import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { playSound, useSoundStore } from "../../game/audio/soundManager";
import { SupportModal } from "./SupportModal";
import { t } from "../../game/i18n";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";

type SettingsModalProps = {
  visible: boolean;
  lang: Lang;
  onPickLanguage: (lang: Lang) => void;
  onClose: () => void;
  /** Optional in-game action; the reset button is hidden when omitted. */
  onReset?: () => void;
};

export function SettingsModal({ visible, lang, onPickLanguage, onClose, onReset }: SettingsModalProps) {
  const soundEnabled = useSoundStore((state) => state.enabled);
  const setSoundEnabled = useSoundStore((state) => state.setEnabled);
  const [showSupport, setShowSupport] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title}>{t("settings.title", lang)}</Text>

          <Text style={styles.label}>{t("settings.language", lang)}</Text>
          <View style={styles.langRow}>
            {(["tr", "en"] as Lang[]).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => {
                  playSound("tap");
                  onPickLanguage(option);
                }}
                style={[styles.langButton, lang === option ? styles.langButtonActive : null]}
              >
                <Text style={[styles.langText, lang === option ? styles.langTextActive : null]}>
                  {option === "tr" ? "Türkçe" : "English"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t("settings.sound", lang)}</Text>
          <View style={styles.langRow}>
            {([true, false] as const).map((option) => (
              <Pressable
                key={String(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: soundEnabled === option }}
                onPress={() => {
                  setSoundEnabled(option);
                  if (option) {
                    playSound("confirm");
                  }
                }}
                style={[styles.langButton, soundEnabled === option ? styles.langButtonActive : null]}
              >
                <Text
                  style={[styles.langText, soundEnabled === option ? styles.langTextActive : null]}
                >
                  {t(option ? "settings.soundOn" : "settings.soundOff", lang)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              playSound("open");
              setShowSupport(true);
            }}
            style={styles.support}
          >
            <Text style={styles.supportText}>{t("settings.support", lang)}</Text>
          </Pressable>

          {onReset ? (
            <Pressable accessibilityRole="button" onPress={onReset} style={styles.reset}>
              <Text style={styles.resetText}>{t("settings.reset", lang)}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              playSound("close");
              onClose();
            }}
            style={styles.close}
          >
            <Text style={styles.closeText}>{t("settings.close", lang)}</Text>
          </Pressable>
        </Pressable>
      </Pressable>

      <SupportModal visible={showSupport} lang={lang} onClose={() => setShowSupport(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 23, 15, 0.68)",
    padding: theme.spacing.xl
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(226, 177, 90, 0.5)",
    backgroundColor: "rgba(17, 20, 14, 0.97)",
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12
  },
  title: {
    color: theme.colors.paper,
    fontSize: 20,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  label: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    color: "#d8ccb0",
    fontSize: 13,
    fontFamily: theme.fonts.bold
  },
  langRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  langButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 224, 151, 0.18)",
    backgroundColor: "rgba(54, 43, 27, 0.6)"
  },
  langButtonActive: {
    borderColor: "rgba(198, 238, 137, 0.7)",
    backgroundColor: "rgba(68, 101, 45, 0.92)"
  },
  langText: {
    color: "#d8ccb0",
    fontSize: 15,
    fontFamily: theme.fonts.heavy
  },
  langTextActive: {
    color: theme.colors.paper
  },
  support: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.lg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.4)",
    backgroundColor: "rgba(74, 56, 28, 0.75)"
  },
  supportText: {
    color: "#ffe9ad",
    fontSize: 14,
    fontFamily: theme.fonts.heavy
  },
  reset: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm,
    borderRadius: 10,
    backgroundColor: "#9a3322"
  },
  resetText: {
    color: theme.colors.paper,
    fontSize: 14,
    fontFamily: theme.fonts.heavy
  },
  close: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm
  },
  closeText: {
    color: "#d8ccb0",
    fontSize: 14,
    fontFamily: theme.fonts.heavy
  }
});
