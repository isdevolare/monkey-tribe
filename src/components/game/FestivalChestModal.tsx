import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { FestivalChestPanel } from "./FestivalCollectionPanel";
import { SpringPressable } from "./SpringPressable";

type FestivalChestModalProps = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
  /** Insufficient Gems → route the player to the Gem Store. */
  onOpenGemStore: () => void;
};

/**
 * Shop-hub entry for the Festival Chest. Reuses FestivalChestPanel (launch
 * price, odds, fragment rewards) and the existing openFestivalChest store
 * action — no economy logic lives here. Hidden while a chest transaction is
 * pending so the global opening/claim flow owns the screen.
 */
export function FestivalChestModal({ visible, lang, onClose, onOpenGemStore }: FestivalChestModalProps) {
  const gems = useGameStore((state) => state.gems);
  const insets = useSafeAreaInsets();
  const pending = useGameStore((state) => state.pendingFestivalChest);

  return (
    <Modal
      visible={visible && pending == null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.scrim, { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.headerTop}>
            <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("festival.chest.name", lang)}
            </Text>
            <SpringPressable
              accessibilityRole="button"
              accessibilityLabel={t("settings.close", lang)}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </SpringPressable>
          </View>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("shopHub.festivalDesc", lang)}
            </Text>
            <View style={styles.balancePill}>
              <AssetImage assetKey="resourceJungleGem" style={styles.balanceGem} fallback={<View />} hideFallbackOnLoad />
              <Text style={styles.balanceText} maxFontSizeMultiplier={theme.maxFontScale}>{gems}</Text>
            </View>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} bounces={false}>
            <FestivalChestPanel lang={lang} onInsufficient={onOpenGemStore} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4, 11, 7, 0.84)",
    padding: 14
  },
  card: {
    width: "100%",
    maxWidth: 410,
    maxHeight: "88%",
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#d6a44d",
    backgroundColor: "rgba(21, 27, 17, 0.99)",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  title: {
    flexShrink: 1,
    color: theme.colors.paper,
    fontSize: 20,
    lineHeight: 24,
    fontFamily: theme.fonts.heavy
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.5)",
    backgroundColor: "rgba(60, 40, 22, 0.9)"
  },
  closeText: {
    color: theme.colors.paper,
    fontSize: 22,
    lineHeight: 24,
    fontFamily: theme.fonts.heavy
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
    marginBottom: 10
  },
  subtitle: {
    flex: 1,
    color: "#cdbf9a",
    fontSize: 11,
    lineHeight: 15,
    fontFamily: theme.fonts.bold
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(126, 208, 255, 0.5)",
    backgroundColor: "rgba(6, 19, 27, 0.92)",
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  balanceGem: { width: 16, height: 16 },
  balanceText: { color: "#c9efff", fontSize: 13, fontFamily: theme.fonts.heavy },
  scroll: { flexGrow: 0 }
});
