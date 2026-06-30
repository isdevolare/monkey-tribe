import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
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
                onPress={() => onPickLanguage(option)}
                style={[styles.langButton, lang === option ? styles.langButtonActive : null]}
              >
                <Text style={[styles.langText, lang === option ? styles.langTextActive : null]}>
                  {option === "tr" ? "Türkçe" : "English"}
                </Text>
              </Pressable>
            ))}
          </View>

          {onReset ? (
            <Pressable accessibilityRole="button" onPress={onReset} style={styles.reset}>
              <Text style={styles.resetText}>{t("settings.reset", lang)}</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>{t("settings.close", lang)}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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
    borderColor: "rgba(255, 224, 151, 0.3)",
    backgroundColor: "rgba(17, 20, 14, 0.97)",
    padding: theme.spacing.lg
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
  reset: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.lg,
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
