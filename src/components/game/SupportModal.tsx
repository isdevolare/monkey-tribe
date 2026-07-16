import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

  if (!visible) {
    return null;
  }

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

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.backButton}>
          <Text style={styles.backText}>{t("support.back", lang)}</Text>
        </Pressable>
        <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
          {t("support.title", lang)}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro} maxFontSizeMultiplier={theme.maxFontScale}>
          {t("support.intro", lang)}
        </Text>

        <View style={styles.issueCard}>
          {SUPPORT_ISSUES.map((id) => (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ checked: issue === id }}
              onPress={() => {
                playSound("tap");
                setIssue(id);
                setStatus("idle");
              }}
              style={[styles.issueRow, issue === id ? styles.issueRowActive : null]}
            >
              <View style={[styles.radio, issue === id ? styles.radioActive : null]}>
                {issue === id ? <View style={styles.radioDot} /> : null}
              </View>
              <Text style={[styles.issueText, issue === id ? styles.issueTextActive : null]}>
                {t(`issue.${id}`, lang)}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t("support.notePlaceholder", lang)}
          placeholderTextColor="#81765f"
          multiline
          maxLength={280}
          style={styles.noteInput}
        />

        {status !== "idle" ? (
          <Text style={status === "sent" ? styles.sentText : styles.failText}>
            {t(status === "sent" ? "support.sent" : "support.mailFail", lang)}
          </Text>
        ) : null}

        <SpringPressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !issue }}
          disabled={!issue}
          onPress={handleSend}
          style={[styles.sendButton, !issue ? styles.sendButtonDisabled : null]}
        >
          <Text style={styles.sendText}>{t("support.send", lang)}</Text>
        </SpringPressable>

        <Text style={styles.diagnosticsNote}>{t("support.diagnosticsNote", lang)}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 0 },
  pageHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 177, 90, 0.2)"
  },
  backButton: { minWidth: 72, minHeight: 44, justifyContent: "center" },
  backText: { color: "#e2b15a", fontSize: 14, fontFamily: theme.fonts.heavy },
  title: {
    flex: 1,
    color: theme.colors.paper,
    fontSize: 19,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  headerSpacer: { width: 72 },
  scrollContent: { paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm },
  intro: { color: "#bdb094", fontSize: 13, fontFamily: theme.fonts.bold, marginBottom: 10 },
  issueCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.24)",
    backgroundColor: "rgba(42, 48, 31, 0.76)",
    overflow: "hidden"
  },
  issueRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 238, 188, 0.12)"
  },
  issueRowActive: { backgroundColor: "rgba(100, 125, 59, 0.42)" },
  radio: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7f745d"
  },
  radioActive: { borderColor: "#d8b35f" },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#e2b15a" },
  issueText: { flex: 1, color: "#d8ccb0", fontSize: 14, fontFamily: theme.fonts.bold },
  issueTextActive: { color: theme.colors.paper },
  noteInput: {
    minHeight: 86,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.28)",
    backgroundColor: "rgba(10, 14, 9, 0.72)",
    color: theme.colors.paper,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    padding: 12,
    textAlignVertical: "top"
  },
  sentText: { marginTop: 10, color: "#c6ee89", textAlign: "center", fontFamily: theme.fonts.heavy },
  failText: { marginTop: 10, color: "#f0b9a4", textAlign: "center", fontFamily: theme.fonts.heavy },
  sendButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(218, 185, 102, 0.7)",
    backgroundColor: "#46652f"
  },
  sendButtonDisabled: { opacity: 0.42 },
  sendText: { color: theme.colors.paper, fontSize: 15, fontFamily: theme.fonts.heavy },
  diagnosticsNote: {
    marginTop: 10,
    color: "#8f856d",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  }
});
