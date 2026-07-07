import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { playSound } from "../../game/audio/soundManager";
import { t } from "../../game/i18n";
import { SUPPORT_ISSUES, submitSupportReport, type SupportIssueId } from "../../game/support";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { SpringPressable } from "./SpringPressable";

type SupportModalProps = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
};

export function SupportModal({ visible, lang, onClose }: SupportModalProps) {
  const [issue, setIssue] = useState<SupportIssueId | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "failed">("idle");

  async function handleSend() {
    if (!issue) {
      return;
    }
    const ok = await submitSupportReport(t(`issue.${issue}`, lang), note.trim());
    setStatus(ok ? "sent" : "failed");
    if (ok) {
      playSound("confirm");
      setIssue(null);
      setNote("");
    }
  }

  function handleClose() {
    playSound("close");
    setStatus("idle");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.scrim} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("support.title", lang)}
          </Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.header} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("support.helpHeader", lang)}
            </Text>
            {["support.help1", "support.help2", "support.help3"].map((key) => (
              <View key={key} style={styles.helpRow}>
                <Text style={styles.helpBullet}>🍌</Text>
                <Text style={styles.helpText} maxFontSizeMultiplier={theme.maxFontScale}>
                  {t(key, lang)}
                </Text>
              </View>
            ))}

            <Text style={[styles.header, styles.reportHeader]} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("support.reportHeader", lang)}
            </Text>
            <View style={styles.issueWrap}>
              {SUPPORT_ISSUES.map((id) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: issue === id }}
                  onPress={() => {
                    playSound("tap");
                    setIssue(id);
                    setStatus("idle");
                  }}
                  style={[styles.issueChip, issue === id ? styles.issueChipActive : null]}
                >
                  <Text
                    style={[styles.issueText, issue === id ? styles.issueTextActive : null]}
                    maxFontSizeMultiplier={theme.maxFontScale}
                  >
                    {t(`issue.${id}`, lang)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t("support.notePlaceholder", lang)}
              placeholderTextColor="#8d8264"
              multiline
              maxLength={280}
              style={styles.noteInput}
            />

            {status === "sent" ? (
              <Text style={styles.sentText} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("support.sent", lang)}
              </Text>
            ) : null}
            {status === "failed" ? (
              <Text style={styles.failText} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("support.mailFail", lang)}
              </Text>
            ) : null}

            <SpringPressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !issue }}
              disabled={!issue}
              onPress={handleSend}
              style={[styles.sendButton, !issue ? styles.sendButtonDisabled : null]}
            >
              <Text style={styles.sendText} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("support.send", lang)}
              </Text>
            </SpringPressable>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={handleClose} style={styles.close}>
            <Text style={styles.closeText} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("settings.close", lang)}
            </Text>
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
    maxWidth: 340,
    maxHeight: "82%",
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
    fontSize: theme.type.h1,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  scroll: {
    flexGrow: 0,
    marginTop: theme.spacing.sm
  },
  header: {
    color: "#e2b15a",
    fontSize: theme.type.label,
    fontFamily: theme.fonts.heavy,
    textTransform: "uppercase",
    marginBottom: 6
  },
  reportHeader: {
    marginTop: theme.spacing.md
  },
  helpRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 5
  },
  helpBullet: {
    fontSize: theme.type.label
  },
  helpText: {
    flex: 1,
    color: "#d8ccb0",
    fontSize: theme.type.label,
    fontFamily: theme.fonts.bold
  },
  issueWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  issueChip: {
    minHeight: 40,
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 224, 151, 0.18)",
    backgroundColor: "rgba(54, 43, 27, 0.6)",
    paddingHorizontal: 11
  },
  issueChipActive: {
    borderColor: "rgba(198, 238, 137, 0.7)",
    backgroundColor: "rgba(68, 101, 45, 0.92)"
  },
  issueText: {
    color: "#d8ccb0",
    fontSize: theme.type.label,
    fontFamily: theme.fonts.heavy
  },
  issueTextActive: {
    color: theme.colors.paper
  },
  noteInput: {
    minHeight: 66,
    marginTop: theme.spacing.sm,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.28)",
    backgroundColor: "rgba(14, 12, 7, 0.75)",
    color: theme.colors.paper,
    fontSize: theme.type.body,
    fontFamily: theme.fonts.regular,
    padding: 10,
    textAlignVertical: "top"
  },
  sentText: {
    marginTop: theme.spacing.sm,
    color: "#c6ee89",
    fontSize: theme.type.label,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  failText: {
    marginTop: theme.spacing.sm,
    color: "#f0b9a4",
    fontSize: theme.type.label,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  sendButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(198, 238, 137, 0.5)",
    backgroundColor: "rgba(68, 101, 45, 0.92)"
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendText: {
    color: theme.colors.paper,
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy
  },
  close: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xs
  },
  closeText: {
    color: "#d8ccb0",
    fontSize: theme.type.body,
    fontFamily: theme.fonts.heavy
  }
});
