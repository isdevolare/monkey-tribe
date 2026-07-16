import { useEffect, useState, type ReactNode } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appBuildNumber, appVersion, PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from "../../game/appInfo";
import { playSound, useSoundStore } from "../../game/audio/soundManager";
import { t } from "../../game/i18n";
import { QA_CODES_ENABLED, redeemQaGemCode, type QaRedemptionResult } from "../../game/internal/qaCodes";
import { useAppSettingsStore, type PerformanceMode } from "../../game/settings/appSettings";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SupportModal } from "./SupportModal";
import { VolumeSlider } from "./VolumeSlider";

type SettingsModalProps = {
  visible: boolean;
  lang: Lang;
  onPickLanguage: (lang: Lang) => void;
  onClose: () => void;
  onReplayTutorial?: () => void;
  /** Optional in-game action; the reset button is hidden when omitted. */
  onReset?: () => void;
};

export function SettingsModal({
  visible,
  lang,
  onPickLanguage,
  onClose,
  onReplayTutorial,
  onReset
}: SettingsModalProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const musicVolume = useSoundStore((state) => state.musicVolume);
  const sfxVolume = useSoundStore((state) => state.sfxVolume);
  const musicMuted = useSoundStore((state) => state.musicMuted);
  const sfxMuted = useSoundStore((state) => state.sfxMuted);
  const setMusicVolume = useSoundStore((state) => state.setMusicVolume);
  const setSfxVolume = useSoundStore((state) => state.setSfxVolume);
  const setMusicMuted = useSoundStore((state) => state.setMusicMuted);
  const setSfxMuted = useSoundStore((state) => state.setSfxMuted);
  const notificationsEnabled = useAppSettingsStore((state) => state.notificationsEnabled);
  const hapticsEnabled = useAppSettingsStore((state) => state.hapticsEnabled);
  const performanceMode = useAppSettingsStore((state) => state.performanceMode);
  const setNotificationsEnabled = useAppSettingsStore((state) => state.setNotificationsEnabled);
  const setHapticsEnabled = useAppSettingsStore((state) => state.setHapticsEnabled);
  const setPerformanceMode = useAppSettingsStore((state) => state.setPerformanceMode);
  const [page, setPage] = useState<"settings" | "support">("settings");
  const [showCredits, setShowCredits] = useState(false);
  const [qaCode, setQaCode] = useState("");
  const [qaResult, setQaResult] = useState<QaRedemptionResult | null>(null);
  const [qaBusy, setQaBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setPage("settings");
      setShowCredits(false);
      setQaCode("");
      setQaResult(null);
      setQaBusy(false);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  function closeOrBack() {
    if (page === "support") {
      playSound("close");
      setPage("settings");
      return;
    }
    playSound("close");
    onClose();
  }

  async function redeemCode() {
    if (qaBusy) {
      return;
    }
    setQaBusy(true);
    try {
      const result = await redeemQaGemCode(qaCode);
      setQaResult(result);
      if (result === "success") {
        setQaCode("");
        playSound("confirm");
      } else {
        playSound("error");
      }
    } finally {
      setQaBusy(false);
    }
  }

  const verticalInset = Math.max(12, insets.top) + Math.max(12, insets.bottom);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={closeOrBack}>
      <Pressable
        style={[
          styles.scrim,
          { paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(12, insets.bottom) }
        ]}
        onPress={closeOrBack}
      >
        <Pressable
          style={[styles.card, { maxHeight: Math.max(360, height - verticalInset - 24) }]}
          onPress={() => undefined}
        >
          {page === "support" ? (
            <SupportModal visible lang={lang} onClose={() => setPage("settings")} />
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <Text style={styles.title}>{t("settings.title", lang)}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("settings.close", lang)}
                  onPress={onClose}
                  hitSlop={8}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeGlyph}>×</Text>
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Section title={t("settings.sectionGame", lang)}>
                  <Text style={styles.controlLabel}>{t("settings.language", lang)}</Text>
                  <SegmentedControl
                    options={[
                      { id: "tr", label: "Türkçe" },
                      { id: "en", label: "English" }
                    ]}
                    value={lang}
                    onChange={(value) => onPickLanguage(value as Lang)}
                  />
                  <SettingRow label={t("settings.notifications", lang)}>
                    <SettingToggle
                      enabled={notificationsEnabled}
                      label={t("settings.notifications", lang)}
                      onChange={setNotificationsEnabled}
                    />
                  </SettingRow>
                  <SettingRow label={t("settings.haptics", lang)}>
                    <SettingToggle
                      enabled={hapticsEnabled}
                      label={t("settings.haptics", lang)}
                      onChange={setHapticsEnabled}
                    />
                  </SettingRow>
                  <Text style={styles.controlLabel}>{t("settings.performance", lang)}</Text>
                  <SegmentedControl
                    options={[
                      { id: "balanced", label: t("settings.balanced", lang) },
                      { id: "highPerformance", label: t("settings.highPerformance", lang) }
                    ]}
                    value={performanceMode}
                    onChange={(value) => setPerformanceMode(value as PerformanceMode)}
                  />
                  {onReplayTutorial ? (
                    <ActionRow label={t("settings.replayTutorial", lang)} onPress={onReplayTutorial} />
                  ) : null}
                  {onReset ? (
                    <ActionRow label={t("settings.reset", lang)} onPress={onReset} danger />
                  ) : null}
                </Section>

                <Section title={t("settings.sectionAudio", lang)}>
                  <AudioRow
                    label={t("settings.music", lang)}
                    enabled={!musicMuted}
                    volume={musicVolume}
                    onToggle={(enabled) => setMusicMuted(!enabled)}
                    onVolume={setMusicVolume}
                  />
                  <AudioRow
                    label={t("settings.sound", lang)}
                    enabled={!sfxMuted}
                    volume={sfxVolume}
                    onToggle={(enabled) => {
                      setSfxMuted(!enabled);
                      if (enabled) {
                        setTimeout(() => playSound("confirm"), 0);
                      }
                    }}
                    onVolume={setSfxVolume}
                  />
                </Section>

                <Section title={t("settings.sectionSupport", lang)}>
                  <ActionRow
                    label={t("settings.support", lang)}
                    detail={t("settings.supportDetail", lang)}
                    onPress={() => {
                      playSound("open");
                      setPage("support");
                    }}
                  />
                </Section>

                <Section title={t("settings.sectionAbout", lang)}>
                  <InfoRow
                    label={t("settings.version", lang)}
                    value={`${appVersion()} (${appBuildNumber()})`}
                  />
                  <ActionRow
                    label={t("settings.privacy", lang)}
                    onPress={() => void Linking.openURL(PRIVACY_URL)}
                  />
                  <ActionRow
                    label={t("settings.terms", lang)}
                    onPress={() => void Linking.openURL(TERMS_URL)}
                  />
                  <ActionRow
                    label={t("settings.supportShort", lang)}
                    onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
                  />
                  <ActionRow
                    label={t("settings.credits", lang)}
                    onPress={() => setShowCredits((shown) => !shown)}
                  />
                  {showCredits ? (
                    <Text style={styles.creditsText}>{t("settings.creditsBody", lang)}</Text>
                  ) : null}
                </Section>

                {QA_CODES_ENABLED ? (
                  <Section title={t("settings.sectionDeveloper", lang)}>
                    <Text style={styles.qaTitle}>{t("qa.title", lang)}</Text>
                    <View style={styles.qaIntroRow}>
                      <View pointerEvents="none" style={styles.gemIcon}>
                        <AssetImage
                          assetKey="resourceJungleGem"
                          style={styles.fill}
                          fallback={<View />}
                          hideFallbackOnLoad
                        />
                      </View>
                      <Text style={styles.qaHelp}>{t("qa.help", lang)}</Text>
                    </View>
                    <View style={styles.qaRow}>
                      <TextInput
                        value={qaCode}
                        onChangeText={(value) => {
                          setQaCode(value);
                          setQaResult(null);
                        }}
                        editable={!qaBusy}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        spellCheck={false}
                        placeholder={t("qa.placeholder", lang)}
                        placeholderTextColor="#81765f"
                        style={styles.qaInput}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: qaBusy || !qaCode.trim() }}
                        disabled={qaBusy || !qaCode.trim()}
                        onPress={() => void redeemCode()}
                        style={[
                          styles.qaButton,
                          qaBusy || !qaCode.trim() ? styles.qaButtonDisabled : null
                        ]}
                      >
                        <Text style={styles.qaButtonText}>{t("qa.use", lang)}</Text>
                      </Pressable>
                    </View>
                    {qaResult && qaResult !== "disabled" ? (
                      <Text style={qaResult === "success" ? styles.qaSuccess : styles.qaError}>
                        {t(`qa.${qaResult}`, lang)}
                      </Text>
                    ) : null}
                  </Section>
                ) : null}
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SettingToggle({
  enabled,
  label,
  onChange
}: {
  enabled: boolean;
  label: string;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: enabled }}
      onPress={() => {
        playSound("tap");
        onChange(!enabled);
      }}
      style={[styles.toggle, enabled ? styles.toggleOn : null]}
    >
      <View style={[styles.toggleThumb, enabled ? styles.toggleThumbOn : null]} />
    </Pressable>
  );
}

function SegmentedControl({
  options,
  value,
  onChange
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable
          key={option.id}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === option.id }}
          onPress={() => {
            playSound("tap");
            onChange(option.id);
          }}
          style={[styles.segment, value === option.id ? styles.segmentActive : null]}
        >
          <Text style={[styles.segmentText, value === option.id ? styles.segmentTextActive : null]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function AudioRow({
  label,
  enabled,
  volume,
  onToggle,
  onVolume
}: {
  label: string;
  enabled: boolean;
  volume: number;
  onToggle: (enabled: boolean) => void;
  onVolume: (volume: number) => void;
}) {
  return (
    <View style={styles.audioBlock}>
      <SettingRow label={label}>
        <SettingToggle enabled={enabled} label={label} onChange={onToggle} />
      </SettingRow>
      <View style={styles.volumeRow}>
        <VolumeSlider value={volume} onChange={onVolume} />
        <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
      </View>
    </View>
  );
}

function ActionRow({
  label,
  detail,
  onPress,
  danger = false
}: {
  label: string;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionRow}>
      <View style={styles.actionCopy}>
        <Text style={[styles.rowLabel, danger ? styles.dangerText : null]}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 14, 9, 0.78)",
    paddingHorizontal: 14
  },
  card: {
    width: "100%",
    maxWidth: 420,
    minHeight: 320,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.56)",
    backgroundColor: "#111a12",
    paddingHorizontal: 14,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 16,
    overflow: "hidden"
  },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 177, 90, 0.2)"
  },
  headerSpacer: { width: 42 },
  title: {
    flex: 1,
    color: theme.colors.paper,
    fontSize: 21,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  closeButton: { width: 42, height: 44, alignItems: "flex-end", justifyContent: "center" },
  closeGlyph: { color: "#c9bc9d", fontSize: 28, lineHeight: 30, fontFamily: theme.fonts.regular },
  content: { paddingTop: 4, paddingBottom: 8 },
  sectionWrap: { marginTop: 12 },
  sectionTitle: {
    marginLeft: 4,
    marginBottom: 6,
    color: "#e2b15a",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: theme.fonts.heavy
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.22)",
    backgroundColor: "rgba(41, 49, 31, 0.74)",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  controlLabel: {
    marginTop: 3,
    marginBottom: 6,
    color: "#bdb094",
    fontSize: 12,
    fontFamily: theme.fonts.bold
  },
  segmented: {
    minHeight: 42,
    flexDirection: "row",
    borderRadius: 10,
    backgroundColor: "rgba(10, 14, 9, 0.68)",
    padding: 3,
    gap: 3
  },
  segment: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: "#536f36", borderWidth: 1, borderColor: "rgba(218,185,102,0.48)" },
  segmentText: { color: "#9e9278", fontSize: 12, fontFamily: theme.fonts.heavy, textAlign: "center" },
  segmentTextActive: { color: theme.colors.paper },
  settingRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 238, 188, 0.11)"
  },
  rowLabel: { flexShrink: 1, color: "#eee4cb", fontSize: 14, fontFamily: theme.fonts.bold },
  rowDetail: { marginTop: 2, color: "#8f856d", fontSize: 11, fontFamily: theme.fonts.regular },
  toggle: {
    width: 48,
    height: 28,
    justifyContent: "center",
    paddingHorizontal: 3,
    borderRadius: 14,
    backgroundColor: "#3b4036"
  },
  toggleOn: { backgroundColor: "#6f8e43" },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#b7ae99" },
  toggleThumbOn: { alignSelf: "flex-end", backgroundColor: "#fff2c8" },
  audioBlock: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,238,188,0.11)" },
  volumeRow: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 6 },
  volumeValue: { width: 40, color: "#bdb094", fontSize: 11, fontFamily: theme.fonts.heavy, textAlign: "right" },
  actionRow: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 238, 188, 0.11)"
  },
  actionCopy: { flex: 1, paddingVertical: 8 },
  chevron: { color: "#c8a759", fontSize: 25, lineHeight: 27, marginLeft: 8 },
  dangerText: { color: "#efa692" },
  infoValue: { color: "#a99d83", fontSize: 13, fontFamily: theme.fonts.heavy },
  creditsText: { color: "#a99d83", fontSize: 12, lineHeight: 17, fontFamily: theme.fonts.regular, paddingVertical: 9 },
  qaIntroRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  qaTitle: { color: "#eee4cb", fontSize: 14, fontFamily: theme.fonts.heavy, marginBottom: 5 },
  gemIcon: { width: 30, height: 30, marginRight: 8 },
  qaHelp: { flex: 1, color: "#bdb094", fontSize: 12, fontFamily: theme.fonts.bold },
  qaRow: { minHeight: 46, flexDirection: "row", gap: 8 },
  qaInput: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.32)",
    backgroundColor: "rgba(10, 14, 9, 0.72)",
    color: theme.colors.paper,
    fontSize: 13,
    fontFamily: theme.fonts.heavy,
    paddingHorizontal: 11
  },
  qaButton: {
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(218,185,102,0.7)",
    backgroundColor: "#536f36",
    paddingHorizontal: 12
  },
  qaButtonDisabled: { opacity: 0.42 },
  qaButtonText: { color: theme.colors.paper, fontSize: 13, fontFamily: theme.fonts.heavy },
  qaSuccess: { marginTop: 8, color: "#c6ee89", fontSize: 12, fontFamily: theme.fonts.heavy },
  qaError: { marginTop: 8, color: "#f0b9a4", fontSize: 12, fontFamily: theme.fonts.heavy },
  fill: { width: "100%", height: "100%" }
});
