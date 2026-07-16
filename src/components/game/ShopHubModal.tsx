import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playSound } from "../../game/audio/soundManager";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";

type ShopHubModalProps = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
  onOpenGemStore: () => void;
  onOpenFestivalChest: () => void;
  onOpenMonkeys: () => void;
  onOpenResourceShop: () => void;
};

/**
 * Single Shop hub opened from the HUD shop button. Pure navigation — each
 * entry opens the existing screen/modal (Gem Store, Festival Chest, monkey
 * purchases, Resource Shop); no economy logic is duplicated here.
 */
export function ShopHubModal({
  visible,
  lang,
  onClose,
  onOpenGemStore,
  onOpenFestivalChest,
  onOpenMonkeys,
  onOpenResourceShop
}: ShopHubModalProps) {
  const gems = useGameStore((state) => state.gems);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.scrim, { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.headerTop}>
            <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("shopHub.title", lang)}
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
              {t("shopHub.subtitle", lang)}
            </Text>
            <View style={styles.balancePill}>
              <AssetImage assetKey="resourceJungleGem" style={styles.balanceGem} fallback={<View />} hideFallbackOnLoad />
              <Text style={styles.balanceText} maxFontSizeMultiplier={theme.maxFontScale}>{gems}</Text>
            </View>
          </View>

          <HubEntry
            label={t("gemStore.title", lang)}
            description={t("shopHub.gemStoreDesc", lang)}
            accent="#7ed0ff"
            icon={<AssetImage assetKey="resourceJungleGem" style={styles.entryArt} fallback={<View />} hideFallbackOnLoad />}
            onPress={onOpenGemStore}
          />
          <HubEntry
            label={t("festival.chest.name", lang)}
            description={t("shopHub.festivalDesc", lang)}
            accent="#ff9ade"
            icon={<AssetImage assetKey="propCrate" style={styles.entryArt} resizeMode="contain" fallback={<Text style={styles.entryGlyph}>🎁</Text>} hideFallbackOnLoad />}
            onPress={onOpenFestivalChest}
          />
          <HubEntry
            label={t("collection.tab.monkeys", lang)}
            description={t("shopHub.monkeysDesc", lang)}
            accent="#ffd76a"
            icon={<MonkeyCollectionIcon />}
            onPress={onOpenMonkeys}
          />
          <HubEntry
            label={t("gemStore.resourceShop", lang)}
            description={t("shopHub.resourceDesc", lang)}
            accent="#a7e08a"
            icon={<AssetImage assetKey="resourceBanana" style={styles.entryArt} fallback={<View />} hideFallbackOnLoad />}
            onPress={onOpenResourceShop}
          />
        </View>
      </View>
    </Modal>
  );
}

/**
 * Dedicated "Monkey Collection" icon: two overlapping circular gold-framed
 * portraits (Jungle Worker behind, Young Scout in front) built from the real
 * in-game portrait assets, mirroring the profile avatar medallion styling —
 * no emoji artwork.
 */
function MonkeyCollectionIcon() {
  return (
    <View style={styles.monkeyDuo}>
      <View style={[styles.monkeyMedallion, styles.monkeyBack]}>
        <AssetImage
          assetKey="unitWorker"
          style={styles.monkeyArt}
          imageStyle={styles.monkeyArtZoom}
          resizeMode="contain"
          fallback={<View style={styles.monkeyFallback} />}
          hideFallbackOnLoad
        />
      </View>
      <View style={[styles.monkeyMedallion, styles.monkeyFront]}>
        <AssetImage
          assetKey="unitScout"
          style={styles.monkeyArt}
          imageStyle={styles.monkeyArtZoom}
          resizeMode="contain"
          fallback={<View style={styles.monkeyFallback} />}
          hideFallbackOnLoad
        />
      </View>
    </View>
  );
}

function HubEntry({
  label,
  description,
  accent,
  icon,
  onPress
}: {
  label: string;
  description: string;
  accent: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        playSound("open");
        onPress();
      }}
      pressedScale={0.97}
      style={[styles.entry, { borderColor: accent }]}
    >
      <View style={[styles.entryIconFrame, { shadowColor: accent }]}>
        <View style={[styles.entryHalo, { backgroundColor: accent }]} />
        {icon}
      </View>
      <View style={styles.entryCopy}>
        <Text style={styles.entryLabel} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>{label}</Text>
        <Text style={styles.entryDescription} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>{description}</Text>
      </View>
      <Text style={[styles.entryChevron, { color: accent }]}>›</Text>
    </SpringPressable>
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
    maxWidth: 390,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#d6a44d",
    backgroundColor: "rgba(21, 27, 17, 0.99)",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
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
    marginBottom: 12
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
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 66,
    marginBottom: 9,
    borderRadius: 15,
    borderWidth: 1.5,
    backgroundColor: "rgba(45, 36, 22, 0.9)",
    paddingHorizontal: 11,
    paddingVertical: 9
  },
  entryIconFrame: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "rgba(10, 15, 9, 0.85)",
    shadowOpacity: 0.4,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4
  },
  entryHalo: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    opacity: 0.18
  },
  entryArt: { width: 32, height: 32 },
  entryGlyph: { fontSize: 24, lineHeight: 30 },
  monkeyDuo: {
    width: 46,
    height: 46
  },
  monkeyMedallion: {
    position: "absolute",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#1b2b19",
    borderColor: "#e2b15a"
  },
  monkeyBack: {
    width: 29,
    height: 29,
    top: 1,
    left: 1,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.7)",
    opacity: 0.9
  },
  monkeyFront: {
    width: 35,
    height: 35,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    shadowColor: "#ffd76a",
    shadowOpacity: 0.45,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5
  },
  monkeyArt: {
    ...StyleSheet.absoluteFillObject
  },
  monkeyArtZoom: {
    top: 3,
    transform: [{ scale: 1.5 }]
  },
  monkeyFallback: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#3f4a29"
  },
  entryCopy: {
    flex: 1,
    minWidth: 0
  },
  entryLabel: {
    color: "#ffefc2",
    fontSize: 14,
    lineHeight: 18,
    fontFamily: theme.fonts.heavy
  },
  entryDescription: {
    marginTop: 1,
    color: "#c2b492",
    fontSize: 9.5,
    lineHeight: 13,
    fontFamily: theme.fonts.bold
  },
  entryChevron: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: theme.fonts.heavy
  }
});
