import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { playSound, useSoundStore } from "../../game/audio/soundManager";
import { SupportModal } from "./SupportModal";
import { VolumeSlider } from "./VolumeSlider";
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
  const musicVolume = useSoundStore((state) => state.musicVolume);
  const sfxVolume = useSoundStore((state) => state.sfxVolume);
  const musicMuted = useSoundStore((state) => state.musicMuted);
  const sfxMuted = useSoundStore((state) => state.sfxMuted);
  const setMusicVolume = useSoundStore((state) => state.setMusicVolume);
  const setSfxVolume = useSoundStore((state) => state.setSfxVolume);
  const setMusicMuted = useSoundStore((state) => state.setMusicMuted);
  const setSfxMuted = useSoundStore((state) => state.setSfxMuted);
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

          <Text style={styles.label}>{t("settings.music", lang)}</Text>
          <View style={styles.volumeRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(musicMuted ? "settings.unmute" : "settings.mute", lang)}
              accessibilityState={{ selected: musicMuted }}
              onPress={() => setMusicMuted(!musicMuted)}
              style={[styles.muteButton, musicMuted ? styles.muteButtonActive : null]}
            >
              <Text style={styles.muteIcon}>{musicMuted ? "🔇" : "🔊"}</Text>
            </Pressable>
            <VolumeSlider value={musicVolume} onChange={setMusicVolume} />
            <Text style={styles.volumeValue}>{Math.round(musicVolume * 100)}%</Text>
          </View>

          <Text style={styles.label}>{t("settings.sound", lang)}</Text>
          <View style={styles.volumeRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(sfxMuted ? "settings.unmute" : "settings.mute", lang)}
              accessibilityState={{ selected: sfxMuted }}
              onPress={() => {
                setSfxMuted(!sfxMuted);
                if (sfxMuted) {
                  // Turning SFX back on: confirm audibly.
                  setTimeout(() => playSound("confirm"), 0);
                }
              }}
              style={[styles.muteButton, sfxMuted ? styles.muteButtonActive : null]}
            >
              <Text style={styles.muteIcon}>{sfxMuted ? "🔇" : "🔊"}</Text>
            </Pressable>
            <VolumeSlider
              value={sfxVolume}
              onChange={setSfxVolume}
            />
            <Text style={styles.volumeValue}>{Math.round(sfxVolume * 100)}%</Text>
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
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  muteButton: {
    width: 42,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 224, 151, 0.18)",
    backgroundColor: "rgba(54, 43, 27, 0.6)"
  },
  muteButtonActive: {
    borderColor: "rgba(226, 120, 90, 0.7)",
    backgroundColor: "rgba(101, 54, 45, 0.92)"
  },
  muteIcon: {
    fontSize: 17
  },
  volumeValue: {
    minWidth: 44,
    color: "#d8ccb0",
    fontSize: 13,
    fontFamily: theme.fonts.heavy,
    textAlign: "right"
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
