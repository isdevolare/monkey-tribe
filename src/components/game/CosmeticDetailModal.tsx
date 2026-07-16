import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import {
  getCosmeticAppearance,
  getDefaultSkinId,
  getProfileMonkey,
  isArchivedProfileSkin,
  isGemPurchasableProfileMonkey,
  skinsForMonkey,
  type CosmeticRarity,
  type ProfileMonkey,
  type ProfileSkin
} from "../../game/config/profileMonkeys";
import { t } from "../../game/i18n";
import { festivalFragmentRequirement } from "../../game/config/festivalCollection";
import type { FestivalFragmentProgress, Lang, ProfileMonkeyId, ProfileSkinId } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";

export type CosmeticDetailSelection =
  | { kind: "monkey"; item: ProfileMonkey; wasNew: boolean }
  | { kind: "skin"; item: ProfileSkin; wasNew: boolean };

type DetailProps = {
  selection: CosmeticDetailSelection | null;
  lang: Lang;
  gems: number;
  owned: boolean;
  equipped: boolean;
  ownedSkinIds: readonly ProfileSkinId[];
  unlockedMonkeyIds: readonly ProfileMonkeyId[];
  festivalFragments: FestivalFragmentProgress;
  /**
   * When false (Profile context) the detail view is browse/equip only: no
   * price row and no unlock button — locked purchasable monkeys point at the
   * Shop instead. Defaults to true (Shop context).
   */
  purchaseEnabled?: boolean;
  onClose: () => void;
  onUnlock: () => void;
  onEquip: () => void;
  onOpenSkin: (skin: ProfileSkin) => void;
};

const RARITY: Record<CosmeticRarity, { border: string; glow: string; badge: string; text: string }> = {
  common: { border: "#b77b43", glow: "#d99a52", badge: "#744822", text: "#ffe2aa" },
  rare: { border: "#c5dbea", glow: "#d8f3ff", badge: "#526b7d", text: "#e8f7ff" },
  epic: { border: "#be78ff", glow: "#d08cff", badge: "#70329d", text: "#f1d7ff" },
  legendary: { border: "#ffd66c", glow: "#ffe28c", badge: "#9e6714", text: "#fff1b6" },
  mythic: { border: "#ffe47e", glow: "#9feeff", badge: "#7054a5", text: "#fff4bd" }
};

const RARITY_ICON: Record<CosmeticRarity, string> = {
  common: "◆",
  rare: "✦",
  epic: "✧",
  legendary: "★",
  mythic: "✺"
};

export function CosmeticDetailModal({
  selection,
  lang,
  gems,
  owned,
  equipped,
  ownedSkinIds,
  unlockedMonkeyIds,
  festivalFragments,
  purchaseEnabled = true,
  onClose,
  onUnlock,
  onEquip,
  onOpenSkin
}: DetailProps) {
  const { width, height } = useWindowDimensions();
  if (!selection) return null;

  const monkey = selection.kind === "monkey"
    ? selection.item
    : getProfileMonkey(selection.item.monkeyId)!;
  const skin = selection.kind === "skin" ? selection.item : null;
  const appearance = getCosmeticAppearance(monkey.id, skin?.id ?? getDefaultSkinId(monkey.id));
  const rarity = skin?.rarity ?? monkey.rarity;
  const colors = RARITY[rarity];
  const presentationGlow = skin?.presentationGlow ?? colors.glow;
  const price = monkey.price;
  const archived = isArchivedProfileSkin(skin ?? undefined);
  const parentOwned = unlockedMonkeyIds.includes(monkey.id);
  const purchasable = skin == null && isGemPurchasableProfileMonkey(monkey);
  const availableSkins = skinsForMonkey(monkey.id);
  const title = t((skin ?? monkey).nameKey, lang);
  const description = t((skin ?? monkey).descriptionKey, lang);
  const festivalRequired = skin?.catalogStatus === "festival" ? festivalFragmentRequirement(skin.id) : 0;
  const festivalCurrent = skin?.catalogStatus === "festival"
    ? Math.min(festivalRequired, festivalFragments[skin.id] ?? 0)
    : 0;

  return (
      <View style={styles.detailLayer}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.panel,
            {
              width: Math.min(width - 24, 402),
              maxHeight: Math.min(height - 38, 760),
              borderColor: colors.border,
              shadowColor: presentationGlow
            }
          ]}
        >
          <View style={[styles.glowLine, { backgroundColor: presentationGlow }]} pointerEvents="none" />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.topRow}>
              <View style={[styles.rarityBadge, { backgroundColor: colors.badge }]}>
                <Text style={[styles.rarityText, { color: colors.text }]}>{RARITY_ICON[rarity]} {t(`collection.rarity.${rarity}`, lang)}</Text>
              </View>
              {skin?.badgeKey ? <View style={styles.festivalBadge}><Text style={styles.festivalBadgeText}>{t(skin.badgeKey, lang)}</Text></View> : null}
              {selection.wasNew ? <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View> : null}
              <SpringPressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></SpringPressable>
            </View>

            <View style={[styles.heroFrame, { borderColor: colors.border, shadowColor: presentationGlow }]}>
              <View style={[styles.heroHalo, { backgroundColor: presentationGlow }]} />
              <AssetImage assetKey={appearance.portraitAsset} resizeMode="contain" style={styles.heroArt} fallback={<Text style={styles.heroFallback}>🐵</Text>} hideFallbackOnLoad />
            </View>

            <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>{title}</Text>
            {skin ? <Text style={styles.parentName}>{t(monkey.nameKey, lang)}</Text> : null}
            <Text style={styles.description} maxFontSizeMultiplier={theme.maxFontScale}>{description}</Text>

            <View style={styles.stateRow}>
              <Text style={[styles.stateChip, equipped ? styles.equippedChip : owned ? styles.ownedChip : styles.lockedChip]}>
                {archived
                  ? t("collection.unavailable", lang)
                  : skin && !parentOwned
                    ? t("collection.requiresNamedMonkey", lang, { name: t(monkey.nameKey, lang) })
                    : equipped
                      ? t("collection.equipped", lang)
                      : owned
                        ? t("collection.owned", lang)
                        : t("collection.locked", lang)}
              </Text>
              {!owned && purchasable && purchaseEnabled ? (
                <View style={styles.priceRow}>
                  <AssetImage assetKey="resourceJungleGem" style={styles.priceGem} fallback={<View />} hideFallbackOnLoad />
                  <Text style={styles.price}>{price}</Text>
                </View>
              ) : null}
              {!owned && skin == null && monkey.acquisition === "daily_reward_or_gems" ? <Text style={styles.comingSoon}>{t("collection.day7Scout", lang)}</Text> : null}
              {!owned && skin?.catalogStatus === "festival" ? <Text style={styles.comingSoon}>{t("festival.progress", lang, { current: festivalCurrent, required: festivalRequired })}</Text> : null}
              {!owned && purchasable && purchaseEnabled && gems < price ? <Text style={styles.shortfall}>{t("collection.detail.missing", lang, { amount: price - gems })}</Text> : null}
            </View>

            <Text style={styles.sectionTitle}>{t("collection.detail.villagePreview", lang)}</Text>
            <View style={styles.preview}>
              <AssetImage assetKey="bgJungleGame" resizeMode="cover" style={StyleSheet.absoluteFill} fallback={<View style={styles.previewFallback} />} hideFallbackOnLoad />
              <View style={styles.previewShade} />
              <View style={styles.previewGround} />
              {skin?.presentationGlow ? <View style={[styles.previewAura, { backgroundColor: presentationGlow }]} /> : null}
              <PremiumPreviewArt
                asset={appearance.villageAsset}
                floating={skin?.previewMotion === "float"}
                particleColor={skin?.particleColor}
              />
            </View>

            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>{t("collection.detail.availableSkins", lang)}</Text>
              <Text style={styles.skinCount}>{availableSkins.length}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skinStrip}>
              {availableSkins.map((entry) => {
                const entryAppearance = getCosmeticAppearance(monkey.id, entry.id);
                const entryOwned = ownedSkinIds.includes(entry.id);
                return (
                  <SpringPressable key={entry.id} onPress={() => onOpenSkin(entry)} style={[styles.skinThumb, skin?.id === entry.id ? styles.skinThumbSelected : null]}>
                    <AssetImage assetKey={entryAppearance.portraitAsset} style={styles.skinThumbArt} resizeMode="contain" fallback={<Text>🐵</Text>} hideFallbackOnLoad />
                    <Text style={styles.skinThumbName} numberOfLines={1}>{t(entry.nameKey, lang)}</Text>
                    <Text style={[styles.skinThumbState, entryOwned ? styles.skinThumbOwned : null]}>
                      {entryOwned
                        ? "✓"
                        : entry.catalogStatus === "festival"
                          ? t("festival.progress", lang, { current: festivalFragments[entry.id] ?? 0, required: festivalFragmentRequirement(entry.id) })
                          : t("collection.locked", lang)}
                    </Text>
                  </SpringPressable>
                );
              })}
            </ScrollView>
          </ScrollView>

          <View style={styles.actions}>
            <SpringPressable onPress={onClose} style={[styles.actionButton, styles.secondaryButton]}><Text style={styles.secondaryText}>{t("collection.detail.close", lang)}</Text></SpringPressable>
            {archived ? (
              <View style={[styles.actionButton, styles.unavailableButton]}><Text style={styles.actionText}>{t("collection.unavailable", lang)}</Text></View>
            ) : skin && !parentOwned ? (
              <View style={[styles.actionButton, styles.unavailableButton]}><Text style={styles.actionText}>{t("collection.requiresNamedMonkey", lang, { name: t(monkey.nameKey, lang) })}</Text></View>
            ) : !owned && purchasable && !purchaseEnabled ? (
              <View style={[styles.actionButton, styles.unavailableButton]}><Text style={styles.actionText}>{t("collection.detail.inShop", lang)}</Text></View>
            ) : !owned && purchasable ? (
              <SpringPressable onPress={onUnlock} style={[styles.actionButton, styles.unlockButton]}>
                <Text style={styles.actionText}>{t("collection.unlock", lang)}</Text>
                <AssetImage assetKey="resourceJungleGem" style={styles.actionGem} fallback={<View />} hideFallbackOnLoad />
                <Text style={styles.actionText}>{price}</Text>
              </SpringPressable>
            ) : !owned ? (
              <View style={[styles.actionButton, styles.unavailableButton]}><Text style={styles.actionText}>{skin?.catalogStatus === "festival" ? t("festival.progress", lang, { current: festivalCurrent, required: festivalRequired }) : t("collection.unavailable", lang)}</Text></View>
            ) : !equipped ? (
              <SpringPressable onPress={onEquip} style={[styles.actionButton, styles.equipButton]}><Text style={styles.actionText}>{t("collection.equip", lang)}</Text></SpringPressable>
            ) : (
              <View style={[styles.actionButton, styles.equippedButton]}><Text style={styles.actionText}>{t("collection.equipped", lang)}</Text></View>
            )}
          </View>
        </View>
      </View>
  );
}

const PREVIEW_PARTICLES = [
  { left: "28%", top: 34 },
  { left: "40%", top: 16 },
  { left: "58%", top: 25 },
  { left: "69%", top: 48 },
  { left: "48%", top: 62 }
] as const;

function PremiumPreviewArt({ asset, floating, particleColor }: {
  asset: import("../../game/assets/gameAssets").GameAssetKey;
  floating: boolean;
  particleColor?: string;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!floating && !particleColor) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift, floating, particleColor]);

  return (
    <>
      {particleColor ? PREVIEW_PARTICLES.map((particle, index) => (
        <Animated.View
          key={`${particle.left}-${particle.top}`}
          pointerEvents="none"
          style={[
            styles.previewParticle,
            { left: particle.left, top: particle.top, backgroundColor: particleColor },
            {
              opacity: drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.18, index % 2 ? 0.68 : 0.92, 0.2] }),
              transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [7 + index, -8 - index] }) }]
            }
          ]}
        />
      )) : null}
      <Animated.View style={[styles.previewMonkeyWrap, floating ? { transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [3, -4] }) }] } : null]}>
        <AssetImage assetKey={asset} resizeMode="contain" style={styles.previewMonkey} fallback={<Text style={styles.previewEmoji}>🐵</Text>} hideFallbackOnLoad />
      </Animated.View>
    </>
  );
}

type UnlockFeedbackProps = {
  selection: CosmeticDetailSelection | null;
  lang: Lang;
  onDismiss: () => void;
  onEquipNow: () => void;
};

const PARTICLES = [
  [-72, -44], [-46, -78], [-12, -92], [24, -88], [58, -62], [76, -22], [-78, -8], [52, 12]
] as const;

export function CosmeticUnlockFeedback({ selection, lang, onDismiss, onEquipNow }: UnlockFeedbackProps) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!selection) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    const timer = setTimeout(onDismiss, 1450);
    return () => { animation.stop(); clearTimeout(timer); };
  }, [onDismiss, progress, selection]);
  if (!selection) return null;

  const monkey = selection.kind === "monkey"
    ? selection.item
    : getProfileMonkey(selection.item.monkeyId)!;
  const skin = selection.kind === "skin" ? selection.item : null;
  const appearance = getCosmeticAppearance(monkey.id, skin?.id ?? getDefaultSkinId(monkey.id));
  const title = t(selection.item.nameKey, lang);

  return (
      <Pressable style={styles.unlockScrim} onPress={onDismiss}>
        <Animated.View style={[styles.unlockCard, { opacity: progress.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 1] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.76, 1.06, 1] }) }] }]}>
          <Animated.View style={[styles.unlockGlow, { opacity: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.85, 0.28] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.38] }) }] }]} />
          {PARTICLES.map(([x, y], index) => <Animated.View key={`${x}-${y}`} style={[styles.particle, { opacity: progress.interpolate({ inputRange: [0, 0.16, 0.76, 1], outputRange: [0, 1, 0.8, 0] }), transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) }, { scale: index % 2 ? 0.75 : 1 }] }]} />)}
          <Animated.Text style={[styles.breakLock, { opacity: progress.interpolate({ inputRange: [0, 0.38, 0.58], outputRange: [1, 1, 0] }), transform: [{ rotate: progress.interpolate({ inputRange: [0, 0.55], outputRange: ["0deg", "-18deg"] }) }] }]}>🔓</Animated.Text>
          <AssetImage assetKey={appearance.portraitAsset} style={styles.unlockArt} resizeMode="contain" fallback={<Text style={styles.heroFallback}>🐵</Text>} hideFallbackOnLoad />
          <Text style={styles.unlockedText}>{t("collection.unlocked", lang)}</Text>
          <Text style={styles.unlockName}>{title}</Text>
          <SpringPressable onPress={onEquipNow} style={styles.equipNowButton}><Text style={styles.actionText}>{t("collection.detail.equipNow", lang)}</Text></SpringPressable>
          <Text style={styles.skipText}>{t("collection.detail.tapToSkip", lang)}</Text>
        </Animated.View>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  detailLayer: { ...StyleSheet.absoluteFillObject, zIndex: 100, elevation: 100, alignItems: "center", justifyContent: "center", padding: 12, backgroundColor: "rgba(3, 9, 6, 0.92)" },
  panel: { overflow: "hidden", borderRadius: 24, borderWidth: 3, backgroundColor: "#141b11", shadowOpacity: 0.55, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 18 },
  glowLine: { position: "absolute", top: -4, left: 42, right: 42, height: 9, borderRadius: 8, opacity: 0.45 },
  content: { alignItems: "center", padding: 14, paddingBottom: 10 },
  topRow: { width: "100%", minHeight: 34, flexDirection: "row", alignItems: "center", gap: 7 },
  rarityBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  rarityText: { fontSize: 10, fontFamily: theme.fonts.heavy, textTransform: "uppercase" },
  festivalBadge: { borderRadius: 10, borderWidth: 1, borderColor: "#ffd873", backgroundColor: "#8d3b85", paddingHorizontal: 9, paddingVertical: 4 },
  festivalBadgeText: { color: "#fff5c9", fontSize: 9, fontFamily: theme.fonts.heavy, textTransform: "uppercase" },
  newBadge: { borderRadius: 9, backgroundColor: "#dc3e35", paddingHorizontal: 8, paddingVertical: 4 },
  newBadgeText: { color: "#fff8dc", fontSize: 9, fontFamily: theme.fonts.heavy },
  closeButton: { marginLeft: "auto", width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderColor: "rgba(231,185,79,0.55)", backgroundColor: "#3a2919" },
  closeText: { color: theme.colors.paper, fontSize: 22, lineHeight: 24, fontFamily: theme.fonts.heavy },
  heroFrame: { width: "100%", height: 235, marginTop: 7, alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 17, borderWidth: 2, backgroundColor: "rgba(7,12,7,0.82)", shadowOpacity: 0.36, shadowRadius: 14 },
  heroHalo: { position: "absolute", width: 190, height: 190, borderRadius: 95, opacity: 0.18 },
  heroArt: { width: "94%", height: 224 },
  heroFallback: { fontSize: 68 },
  title: { marginTop: 12, color: theme.colors.paper, fontSize: 23, lineHeight: 28, fontFamily: theme.fonts.heavy, textAlign: "center" },
  parentName: { marginTop: 2, color: "#c1b28b", fontSize: 10, fontFamily: theme.fonts.bold },
  description: { maxWidth: 330, marginTop: 7, color: "#ddd1b5", fontSize: 12, lineHeight: 17, fontFamily: theme.fonts.bold, textAlign: "center" },
  stateRow: { minHeight: 32, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 10 },
  stateChip: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 5, overflow: "hidden", color: "#f6eed2", fontSize: 10, fontFamily: theme.fonts.heavy },
  ownedChip: { backgroundColor: "#32652a" }, equippedChip: { backgroundColor: "#245d22", color: "#c9ff9d" }, lockedChip: { backgroundColor: "#57472f" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  priceGem: { width: 18, height: 18 },
  price: { color: "#bfeaff", fontSize: 12, fontFamily: theme.fonts.heavy },
  shortfall: { color: "#f2a69d", fontSize: 9, fontFamily: theme.fonts.bold },
  comingSoon: { color: "#ffd98a", fontSize: 10, fontFamily: theme.fonts.heavy },
  sectionTitle: { alignSelf: "flex-start", marginTop: 13, color: "#eadcaf", fontSize: 11, fontFamily: theme.fonts.heavy, textTransform: "uppercase" },
  preview: { width: "100%", height: 120, marginTop: 6, overflow: "hidden", borderRadius: 14, borderWidth: 1, borderColor: "rgba(229,190,101,0.42)", backgroundColor: "#24452b" },
  previewFallback: { flex: 1, backgroundColor: "#315c37" }, previewShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7,22,12,0.18)" },
  previewGround: { position: "absolute", left: 0, right: 0, bottom: 0, height: 34, backgroundColor: "rgba(75,52,28,0.62)" },
  previewAura: { position: "absolute", width: 104, height: 104, left: "50%", bottom: 4, marginLeft: -52, borderRadius: 52, opacity: 0.2 },
  previewMonkeyWrap: { position: "absolute", width: 128, height: 112, bottom: 1, alignSelf: "center", left: "50%", marginLeft: -64 },
  previewMonkey: { width: "100%", height: "100%" },
  previewParticle: { position: "absolute", width: 5, height: 5, borderRadius: 3, shadowOpacity: 0.8, shadowRadius: 5 },
  previewEmoji: { fontSize: 50 },
  sectionHeadingRow: { width: "100%", flexDirection: "row", alignItems: "center" }, skinCount: { marginLeft: "auto", marginTop: 13, color: "#aebc92", fontSize: 10, fontFamily: theme.fonts.heavy },
  skinStrip: { gap: 8, paddingTop: 7, paddingBottom: 3 },
  skinThumb: { width: 86, minHeight: 103, alignItems: "center", borderRadius: 11, borderWidth: 1, borderColor: "rgba(229,190,101,0.28)", backgroundColor: "rgba(37,31,20,0.9)", padding: 5 },
  skinThumbSelected: { borderWidth: 2, borderColor: "#e7b94f" }, skinThumbArt: { width: 68, height: 65 },
  skinThumbName: { width: "100%", color: "#e8ddc2", fontSize: 8, fontFamily: theme.fonts.bold, textAlign: "center" },
  skinThumbState: { marginTop: 2, color: "#aee8ff", fontSize: 8, fontFamily: theme.fonts.heavy }, skinThumbOwned: { color: "#baf397" },
  actions: { flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: "rgba(226,177,90,0.25)", padding: 11, backgroundColor: "rgba(23,25,16,0.98)" },
  actionButton: { flex: 1, minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 8 },
  secondaryButton: { borderColor: "#80663a", backgroundColor: "#33291c" }, secondaryText: { color: "#ded1ad", fontSize: 11, fontFamily: theme.fonts.heavy },
  unlockButton: { borderColor: "#72d3ff", backgroundColor: "#17536e" }, unavailableButton: { borderColor: "#a97a42", backgroundColor: "#62451f" }, equipButton: { borderColor: "#7dc956", backgroundColor: "#2b681f" }, equippedButton: { borderColor: "#568a3f", backgroundColor: "#244e1e" },
  actionText: { color: "#fff7d9", fontSize: 11, fontFamily: theme.fonts.heavy, textAlign: "center" },
  actionGem: { width: 17, height: 17, marginLeft: 4 },
  unlockScrim: { ...StyleSheet.absoluteFillObject, zIndex: 120, elevation: 120, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(3,8,5,0.94)" },
  unlockCard: { width: 275, minHeight: 355, alignItems: "center", justifyContent: "center", overflow: "visible", borderRadius: 24, borderWidth: 2, borderColor: "#f2c95c", backgroundColor: "#192114", padding: 18, shadowColor: "#ffd66c", shadowOpacity: 0.65, shadowRadius: 25, elevation: 20 },
  unlockGlow: { position: "absolute", width: 230, height: 230, borderRadius: 115, backgroundColor: "#ffd76a" },
  particle: { position: "absolute", top: 150, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ffd966" },
  breakLock: { position: "absolute", top: 18, right: 28, fontSize: 34 }, unlockArt: { width: 210, height: 205 },
  unlockedText: { color: "#ffe27a", fontSize: 24, lineHeight: 29, fontFamily: theme.fonts.heavy, textTransform: "uppercase" },
  unlockName: { marginTop: 3, color: theme.colors.paper, fontSize: 14, fontFamily: theme.fonts.heavy, textAlign: "center" },
  equipNowButton: { width: "100%", minHeight: 42, alignItems: "center", justifyContent: "center", marginTop: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#8ed264", backgroundColor: "#2f6e22" },
  skipText: { marginTop: 7, color: "#9d987f", fontSize: 8, fontFamily: theme.fonts.bold }
});
