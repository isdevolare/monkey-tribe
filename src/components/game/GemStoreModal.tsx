import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  glow: string;
  glowRadius: number;
  halo: string;
  haloOpacity: number;
  accent: string;
  buttonBg: string;
  buttonBorder: string;
  art: number;
  pulse: boolean;
  featured?: boolean;
};

/**
 * Per-pack visual tier. Cards grow progressively richer (leather pouch →
 * legendary jungle hoard) in glow, border, lighting and artwork scale without
 * becoming noisy. Keyed by the stable GEM_PACKS id (economy is never touched).
 */
const TIERS: Record<string, Tier> = {
  gem_pouch: {
    variant: "pouch_small",
    surface: "rgba(48, 36, 22, 0.9)",
    border: "rgba(178, 126, 66, 0.7)",
    borderWidth: 1.5,
    glow: "#6d4423",
    glowRadius: 6,
    halo: "#7bd39a",
    haloOpacity: 0.12,
    accent: "#e7d7b0",
    buttonBg: "rgba(120, 84, 40, 0.95)",
    buttonBorder: "rgba(226, 177, 90, 0.55)",
    art: 66,
    pulse: false
  },
  gem_bundle: {
    variant: "pouch_large",
    surface: "rgba(54, 40, 24, 0.92)",
    border: "rgba(200, 143, 78, 0.8)",
    borderWidth: 1.5,
    glow: "#8a5a2c",
    glowRadius: 8,
    halo: "#7bd39a",
    haloOpacity: 0.16,
    accent: "#f0dcac",
    buttonBg: "rgba(138, 96, 44, 0.96)",
    buttonBorder: "rgba(233, 190, 110, 0.6)",
    art: 70,
    pulse: false
  },
  gem_crate: {
    variant: "chest_wood",
    surface: "rgba(52, 38, 22, 0.94)",
    border: "rgba(214, 164, 77, 0.85)",
    borderWidth: 1.75,
    glow: "#b07d2e",
    glowRadius: 10,
    halo: "#8ef0a8",
    haloOpacity: 0.2,
    accent: "#ffe6a6",
    buttonBg: "rgba(150, 102, 40, 0.97)",
    buttonBorder: "rgba(255, 213, 122, 0.7)",
    art: 76,
    pulse: false
  },
  gem_vault: {
    variant: "chest_gold",
    surface: "rgba(58, 44, 20, 0.95)",
    border: "#ffd76a",
    borderWidth: 2,
    glow: "#ffcf5e",
    glowRadius: 13,
    halo: "#ffe9a8",
    haloOpacity: 0.24,
    accent: "#fff0b3",
    buttonBg: "rgba(176, 125, 30, 0.98)",
    buttonBorder: "#ffe08a",
    art: 80,
    pulse: true
  },
  gem_treasury: {
    variant: "chest_royal",
    surface: "rgba(48, 30, 62, 0.96)",
    border: "#b98bff",
    borderWidth: 2.25,
    glow: "#b072ff",
    glowRadius: 15,
    halo: "#d7b6ff",
    haloOpacity: 0.26,
    accent: "#f0d6ff",
    buttonBg: "rgba(96, 58, 152, 0.98)",
    buttonBorder: "#ffd76a",
    art: 84,
    pulse: true
  },
  gem_hoard: {
    variant: "treasure_legendary",
    surface: "rgba(46, 40, 20, 0.97)",
    border: "#ffe08a",
    borderWidth: 2.5,
    glow: "#ffdf7a",
    glowRadius: 18,
    halo: "#a6f0c0",
    haloOpacity: 0.3,
    accent: "#fff4bd",
    buttonBg: "rgba(168, 118, 28, 0.98)",
    buttonBorder: "#fff0b3",
    art: 104,
    pulse: true,
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
  const [comingSoon, setComingSoon] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.scrim}>
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
              <GemPackCard key={pack.id} pack={pack} lang={lang} onBuy={() => setComingSoon(true)} />
            ))}
            <UsagePanel lang={lang} />
          </ScrollView>
        </View>

        {comingSoon ? <ComingSoonPopup lang={lang} onClose={() => setComingSoon(false)} /> : null}
      </View>
    </Modal>
  );
}

function GemPackCard({ pack, lang, onBuy }: { pack: GemPack; lang: Lang; onBuy: () => void }) {
  const tier = TIERS[pack.id] ?? TIERS.gem_pouch!;
  const scale = useRef(new Animated.Value(1)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle one-shot intro shine.
    shine.setValue(0);
    Animated.timing(shine, { toValue: 1, duration: 240, delay: 60, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    if (!tier.pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, shine, tier.pulse]);

  const hovered = useRef(false);
  function runShine() {
    shine.setValue(0);
    Animated.timing(shine, { toValue: 1, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }
  function animateTo(value: number, speed: number) {
    Animated.spring(scale, { toValue: value, speed, bounciness: 6, useNativeDriver: true }).start();
  }
  function hoverIn() {
    hovered.current = true;
    animateTo(1.035, 60);
    runShine();
  }
  function hoverOut() {
    hovered.current = false;
    animateTo(1, 40);
  }
  function pressIn() {
    playSound("tap");
    animateTo(0.97, 60);
  }
  function pressOut() {
    animateTo(hovered.current ? 1.035 : 1, 30);
  }

  const shineX = shine.interpolate({ inputRange: [0, 1], outputRange: [-240, 240] });
  const haloOpacity = tier.pulse
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [tier.haloOpacity, Math.min(0.55, tier.haloOpacity + 0.22)] })
    : tier.haloOpacity;
  const referencePrice = `$${pack.referenceUsdPrice.toFixed(2)}`;

  const artFrame = (
    <View style={[styles.artFrame, tier.featured ? styles.artFrameFeatured : null]}>
      <Animated.View
        style={[
          styles.artHalo,
          tier.featured ? styles.artHaloFeatured : null,
          { backgroundColor: tier.halo, opacity: haloOpacity }
        ]}
      />
      <View style={{ width: tier.art, height: tier.art }}>
        <GemPackArtwork variant={tier.variant} />
      </View>
    </View>
  );

  const bonus =
    pack.bonusPercent > 0 ? (
      <View style={styles.bonusBadge}>
        <Text style={styles.bonusText}>{t("gemStore.bonus", lang, { percent: pack.bonusPercent })}</Text>
      </View>
    ) : null;

  const amount = (
    <View style={styles.amountRow}>
      <Text style={[styles.amountText, tier.featured ? styles.amountTextFeatured : null]} maxFontSizeMultiplier={theme.maxFontScale}>
        {pack.gems.toLocaleString()}
      </Text>
      <Text style={styles.amountLabel} maxFontSizeMultiplier={theme.maxFontScale}>{t("gemStore.gemsLabel", lang)}</Text>
    </View>
  );

  const priceBlock = (
    <View style={styles.priceBlock}>
      <View style={[styles.pricePill, { borderColor: tier.buttonBorder }]}>
        <Text style={[styles.priceText, { color: tier.accent }]} maxFontSizeMultiplier={theme.maxFontScale}>{referencePrice}</Text>
      </View>
      <Text style={styles.priceCaption} maxFontSizeMultiplier={theme.maxFontScale}>{t("gemStore.referencePrice", lang)}</Text>
    </View>
  );

  // Visual button — the whole card is the press target (see the Pressable
  // below), so this stays a plain View to avoid nested-pressable conflicts.
  const buyButton = (
    <View style={[styles.buyButton, { backgroundColor: tier.buttonBg, borderColor: tier.buttonBorder }]}>
      <Text style={[styles.buyText, { color: tier.accent }]} maxFontSizeMultiplier={theme.maxFontScale}>
        {t("gemStore.purchase", lang)}
      </Text>
    </View>
  );

  const shineSweep = (
    <Animated.View pointerEvents="none" style={[styles.shine, { transform: [{ translateX: shineX }, { rotate: "18deg" }] }]} />
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t(`gemStore.pack.${pack.id}`, lang)} · ${t("gemStore.purchase", lang)}`}
      onHoverIn={hoverIn}
      onHoverOut={hoverOut}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onBuy}
      style={tier.featured ? styles.cardOuterFeatured : styles.cardOuter}
    >
      <Animated.View
        style={[
          styles.packCard,
          tier.featured ? styles.packCardFeatured : null,
          {
            backgroundColor: tier.surface,
            borderColor: tier.border,
            borderWidth: tier.borderWidth,
            shadowColor: tier.glow,
            shadowRadius: tier.glowRadius,
            transform: [{ scale }]
          }
        ]}
      >
        {bonus}
        {shineSweep}
        {tier.featured ? (
          <>
            {artFrame}
            <View style={styles.featuredInfo}>
              {amount}
              <Text style={[styles.packName, styles.packNameFeatured]} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
                {t(`gemStore.pack.${pack.id}`, lang)}
              </Text>
              {priceBlock}
              {buyButton}
            </View>
          </>
        ) : (
          <>
            {artFrame}
            {amount}
            <Text style={styles.packName} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
              {t(`gemStore.pack.${pack.id}`, lang)}
            </Text>
            {priceBlock}
            {buyButton}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

function UsagePanel({ lang }: { lang: Lang }) {
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
}

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
    borderColor: "rgba(126, 208, 255, 0.5)",
    backgroundColor: "rgba(6, 19, 27, 0.92)",
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  balanceGem: { width: 16, height: 16 },
  balanceText: { color: "#c9efff", fontSize: 13, fontFamily: theme.fonts.heavy },
  scroll: { flexGrow: 0 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 6
  },
  cardOuter: { width: "48.4%" },
  cardOuterFeatured: { width: "100%" },
  packCard: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    overflow: "hidden",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  packCardFeatured: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14
  },
  bonusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#8ef0a8",
    backgroundColor: "rgba(37, 92, 46, 0.95)",
    paddingHorizontal: 7,
    paddingVertical: 2.5
  },
  bonusText: { color: "#c8ffd4", fontSize: 9, lineHeight: 12, fontFamily: theme.fonts.heavy },
  shine: {
    position: "absolute",
    top: -30,
    bottom: -30,
    width: 26,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    zIndex: 3
  },
  artFrame: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 6
  },
  artFrameFeatured: {
    width: 116,
    height: 116,
    marginBottom: 0,
    marginTop: 0
  },
  artHalo: {
    position: "absolute",
    width: 74,
    height: 74,
    borderRadius: 37
  },
  artHaloFeatured: {
    width: 108,
    height: 108,
    borderRadius: 54
  },
  featuredInfo: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start"
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4
  },
  amountText: { color: "#eafaff", fontSize: 22, lineHeight: 26, fontFamily: theme.fonts.heavy },
  amountTextFeatured: { fontSize: 28, lineHeight: 32 },
  amountLabel: { color: "#9fd8ef", fontSize: 10, fontFamily: theme.fonts.bold },
  packName: {
    marginTop: 3,
    color: "#e7d7b0",
    fontSize: 10.5,
    fontFamily: theme.fonts.bold
  },
  packNameFeatured: {
    fontSize: 13,
    marginTop: 4
  },
  priceBlock: {
    alignItems: "center",
    marginTop: 8
  },
  pricePill: {
    borderRadius: 9,
    borderWidth: 1,
    backgroundColor: "rgba(12, 10, 6, 0.72)",
    paddingHorizontal: 12,
    paddingVertical: 3
  },
  priceText: { fontSize: 13, fontFamily: theme.fonts.heavy },
  priceCaption: {
    marginTop: 3,
    color: "#9c927b",
    fontSize: 8,
    lineHeight: 10,
    fontFamily: theme.fonts.bold,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  buyButton: {
    alignSelf: "stretch",
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
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
