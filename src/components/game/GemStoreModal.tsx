import { memo, useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playSound } from "../../game/audio/soundManager";
import { GEM_PACKS, type GemPack } from "../../game/config/gemPacks";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { GemPackArtwork, type GemArtVariant } from "./GemPackArtwork";
import { SpringPressable } from "./SpringPressable";

type GemStoreModalProps = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
};

type Tier = {
  variant: GemArtVariant;
  surface: string;
  border: string;
  borderWidth: number;
  halo: string;
  accent: string;
  buttonBg: string;
  buttonBorder: string;
  /** The legendary best-value pack gets stronger static framing. */
  featured?: boolean;
};

/**
 * Per-pack visual tier. All six cards share one restrained jungle-and-gold
 * language; only the artwork and small static accents grow richer by tier.
 */
const TIERS: Record<string, Tier> = {
  gem_pouch: {
    variant: "pouch_small",
    surface: "#19251b",
    border: "rgba(211, 170, 88, 0.5)",
    borderWidth: 1.25,
    halo: "rgba(66, 170, 96, 0.14)",
    accent: "#eff9e9",
    buttonBg: "#2f733d",
    buttonBorder: "rgba(145, 211, 118, 0.62)"
  },
  gem_bundle: {
    variant: "pouch_large",
    surface: "#1a281d",
    border: "rgba(217, 177, 91, 0.56)",
    borderWidth: 1.25,
    halo: "rgba(69, 181, 101, 0.16)",
    accent: "#eff9e9",
    buttonBg: "#327a41",
    buttonBorder: "rgba(151, 220, 124, 0.68)"
  },
  gem_crate: {
    variant: "chest_wood",
    surface: "#1c2a1d",
    border: "rgba(224, 184, 96, 0.62)",
    borderWidth: 1.5,
    halo: "rgba(75, 192, 107, 0.18)",
    accent: "#f4faeb",
    buttonBg: "#347f43",
    buttonBorder: "rgba(157, 227, 129, 0.72)"
  },
  gem_vault: {
    variant: "chest_gold",
    surface: "#1e2d20",
    border: "rgba(232, 194, 104, 0.7)",
    borderWidth: 1.5,
    halo: "rgba(87, 205, 117, 0.2)",
    accent: "#f7fceb",
    buttonBg: "#378747",
    buttonBorder: "rgba(166, 233, 137, 0.78)"
  },
  gem_treasury: {
    variant: "chest_royal",
    surface: "#202f21",
    border: "rgba(239, 201, 109, 0.78)",
    borderWidth: 1.75,
    halo: "rgba(95, 214, 125, 0.22)",
    accent: "#fbffed",
    buttonBg: "#3a8d4a",
    buttonBorder: "rgba(176, 239, 145, 0.84)"
  },
  gem_hoard: {
    variant: "treasure_legendary",
    surface: "#27351d",
    border: "#efca67",
    borderWidth: 2.75,
    halo: "rgba(239, 202, 103, 0.22)",
    accent: "#fff8d8",
    buttonBg: "#438f43",
    buttonBorder: "#f0d273",
    featured: true
  }
};

/**
 * Player-facing Gem Store. Real StoreKit / Google Play Billing is not connected
 * yet: pressing a package never grants Gems, never simulates a purchase and
 * never changes any balance — it only surfaces a "coming soon" notice. Package
 * values come exclusively from GEM_PACKS; the USD figure is a reference price
 * that the store-provided localized price will replace once IAP is wired up.
 */
export function GemStoreModal({ visible, lang, onClose }: GemStoreModalProps) {
  const gems = useGameStore((state) => state.gems);
  const insets = useSafeAreaInsets();
  const [comingSoon, setComingSoon] = useState(false);
  const openComingSoon = useCallback(() => setComingSoon(true), []);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.scrim, { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.headerTop}>
            <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("gemStore.title", lang)}
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
              {t("gemStore.subtitle", lang)}
            </Text>
            <View style={styles.balancePill}>
              <AssetImage assetKey="resourceJungleGem" style={styles.balanceGem} fallback={<View />} hideFallbackOnLoad />
              <Text style={styles.balanceText} maxFontSizeMultiplier={theme.maxFontScale}>{gems}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {GEM_PACKS.map((pack) => (
              <GemPackCard key={pack.id} pack={pack} lang={lang} onBuy={openComingSoon} />
            ))}
            <UsagePanel lang={lang} />
          </ScrollView>
        </View>

        {comingSoon ? <ComingSoonPopup lang={lang} onClose={() => setComingSoon(false)} /> : null}
      </View>
    </Modal>
  );
}

const GemPackCard = memo(function GemPackCard({ pack, lang, onBuy }: { pack: GemPack; lang: Lang; onBuy: () => void }) {
  const tier = TIERS[pack.id] ?? TIERS.gem_pouch!;
  const referencePrice = `$${pack.referenceUsdPrice.toFixed(2)}`;

  return (
    <View style={styles.cardOuter}>
      <View
        style={[
          styles.packCard,
          tier.featured ? styles.packCardFeatured : null,
          {
            backgroundColor: tier.surface,
            borderColor: tier.border,
            borderWidth: tier.borderWidth
          }
        ]}
      >
        <View style={styles.badgeRow}>
          {pack.bonusPercent > 0 ? (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>+{pack.bonusPercent}%</Text>
            </View>
          ) : <View />}
          {tier.featured ? (
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>{t("gemStore.bestValue", lang)}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.artFrame, tier.featured ? styles.artFrameFeatured : null]} pointerEvents="none">
          <View style={[styles.artHalo, tier.featured ? styles.artHaloFeatured : null, { backgroundColor: tier.halo }]} />
          <View style={[styles.artInner, tier.featured ? styles.artInnerFeatured : null]}>
            <GemPackArtwork variant={tier.variant} />
          </View>
        </View>

        <Text
          style={[styles.amountText, tier.featured ? styles.amountTextFeatured : null]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.76}
          maxFontSizeMultiplier={theme.maxFontScale}
        >
          {pack.gems.toLocaleString("en-US")}
        </Text>
        <Text
          style={styles.packName}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          maxFontSizeMultiplier={theme.maxFontScale}
        >
          {t(`gemStore.pack.${pack.id}`, lang)}
        </Text>
        <Text style={[styles.priceText, { color: tier.accent }]} maxFontSizeMultiplier={theme.maxFontScale}>
          {referencePrice}
        </Text>

        <SpringPressable
          accessibilityRole="button"
          accessibilityLabel={`${t(`gemStore.pack.${pack.id}`, lang)} · ${t("gemStore.purchase", lang)}`}
          onPress={onBuy}
          pressedScale={0.96}
          style={[styles.buyButton, { backgroundColor: tier.buttonBg, borderColor: tier.buttonBorder }]}
        >
          <Text style={[styles.buyText, { color: tier.accent }]} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("gemStore.purchase", lang)}
          </Text>
        </SpringPressable>
      </View>
    </View>
  );
});

const UsagePanel = memo(function UsagePanel({ lang }: { lang: Lang }) {
  const items = [
    t("gemStore.usage.festivalChest", lang),
    t("gemStore.usage.monkeyCollection", lang),
    t("gemStore.usage.resourceShop", lang)
  ];
  return (
    <View style={styles.usagePanel}>
      <Text style={styles.usageTitle} maxFontSizeMultiplier={theme.maxFontScale}>{t("gemStore.usageTitle", lang)}</Text>
      <View style={styles.usageList}>
        {items.map((label) => (
          <View key={label} style={styles.usageRow}>
            <View style={styles.usageDot} />
            <Text style={styles.usageItem} maxFontSizeMultiplier={theme.maxFontScale}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

/**
 * Rendered as an in-tree overlay (not a nested Modal) so it reliably appears
 * on top of the store on both native and web. Purely informational — it never
 * grants Gems or changes any balance.
 */
function ComingSoonPopup({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.popupScrim]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.popup}>
        <AssetImage assetKey="resourceJungleGem" style={styles.popupGem} fallback={<View />} hideFallbackOnLoad />
        <Text style={styles.popupText} maxFontSizeMultiplier={theme.maxFontScale}>
          {t("gemStore.comingSoonMessage", lang)}
        </Text>
        <SpringPressable accessibilityRole="button" onPress={onClose} style={styles.popupButton}>
          <Text style={styles.popupButtonText} maxFontSizeMultiplier={theme.maxFontScale}>{t("collection.ok", lang)}</Text>
        </SpringPressable>
      </View>
    </View>
  );
}

/** Reusable entry-point button ("Buy Gems") to open the Gem Store from a shop. */
export function BuyGemsButton({ lang, onPress, style }: { lang: Lang; onPress: () => void; style?: object }) {
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={t("gemStore.buy", lang)}
      onPress={() => {
        playSound("open");
        onPress();
      }}
      style={[styles.entryButton, style]}
    >
      <AssetImage assetKey="resourceJungleGem" style={styles.entryGem} fallback={<View />} hideFallbackOnLoad />
      <Text style={styles.entryText} maxFontSizeMultiplier={theme.maxFontScale}>{t("gemStore.buy", lang)}</Text>
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
    maxWidth: 410,
    maxHeight: "90%",
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
    borderColor: "rgba(117, 211, 126, 0.56)",
    backgroundColor: "rgba(14, 43, 24, 0.94)",
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  balanceGem: { width: 16, height: 16 },
  balanceText: { color: "#d9f7d5", fontSize: 13, fontFamily: theme.fonts.heavy },
  scroll: { flexGrow: 0 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 6
  },
  cardOuter: { width: "48.4%" },
  packCard: {
    position: "relative",
    width: "100%",
    minHeight: 226,
    alignItems: "center",
    borderRadius: 16,
    paddingTop: 9,
    paddingBottom: 10,
    paddingHorizontal: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  packCardFeatured: {
    shadowColor: "#d5ad4d",
    shadowOpacity: 0.3,
    shadowRadius: 9,
    elevation: 6
  },
  badgeRow: {
    width: "100%",
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4
  },
  bonusBadge: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(128, 218, 133, 0.68)",
    backgroundColor: "rgba(37, 92, 46, 0.86)",
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  bonusText: { color: "#d3f8d1", fontSize: 9, lineHeight: 11, fontFamily: theme.fonts.heavy },
  bestValueBadge: {
    flexShrink: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(239, 202, 103, 0.76)",
    backgroundColor: "rgba(80, 60, 18, 0.92)",
    paddingHorizontal: 5,
    paddingVertical: 2
  },
  bestValueText: {
    color: "#f8dd8b",
    fontSize: 8,
    lineHeight: 10,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  artFrame: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1
  },
  artInner: {
    width: 70,
    height: 70
  },
  artHalo: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35
  },
  artFrameFeatured: {
    width: 78,
    height: 78
  },
  artInnerFeatured: {
    width: 76,
    height: 76
  },
  artHaloFeatured: {
    width: 78,
    height: 78,
    borderRadius: 39
  },
  amountText: {
    width: "100%",
    color: "#d7f6d5",
    fontSize: 24,
    lineHeight: 28,
    fontFamily: theme.fonts.heavy,
    textAlign: "center",
    fontVariant: ["tabular-nums"]
  },
  amountTextFeatured: { color: "#fff0aa" },
  packName: {
    width: "100%",
    minHeight: 16,
    marginTop: 1,
    color: "#d8c99f",
    fontSize: 11,
    lineHeight: 15,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  priceText: { marginTop: 4, fontSize: 13, lineHeight: 17, fontFamily: theme.fonts.heavy },
  buyButton: {
    alignSelf: "stretch",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
    borderRadius: 11,
    borderWidth: 1.5
  },
  buyText: { fontSize: 12, fontFamily: theme.fonts.heavy, letterSpacing: 0.3 },
  usagePanel: {
    width: "100%",
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.34)",
    backgroundColor: "rgba(31, 28, 19, 0.86)",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  usageTitle: {
    color: "#e7d7b0",
    fontSize: 11,
    lineHeight: 15,
    fontFamily: theme.fonts.heavy,
    marginBottom: 6
  },
  usageList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  usageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  usageDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#8ef0a8"
  },
  usageItem: {
    color: "#cdbf9a",
    fontSize: 10,
    fontFamily: theme.fonts.bold,
    marginRight: 6
  },
  popupScrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(3, 8, 5, 0.78)",
    padding: 24
  },
  popup: {
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: "#6ecbf0",
    backgroundColor: "#142028",
    padding: 20,
    shadowColor: "#6ecbf0",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 18
  },
  popupGem: { width: 46, height: 46, marginBottom: 10 },
  popupText: {
    color: "#e9ddbd",
    fontSize: 14,
    lineHeight: 19,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  popupButton: {
    marginTop: 18,
    minWidth: 130,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(155, 225, 105, 0.75)",
    backgroundColor: "rgba(56, 125, 46, 0.96)"
  },
  popupButtonText: { color: "#f0ffdf", fontSize: 13, fontFamily: theme.fonts.heavy },
  entryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(126, 208, 255, 0.6)",
    backgroundColor: "rgba(22, 70, 92, 0.96)",
    paddingHorizontal: 14
  },
  entryGem: { width: 17, height: 17 },
  entryText: { color: "#cef1ff", fontSize: 12, fontFamily: theme.fonts.heavy }
});
