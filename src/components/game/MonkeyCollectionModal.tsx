import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import {
  PROFILE_MONKEYS,
  PROFILE_SKINS,
  getCosmeticAppearance,
  getProfileMonkey,
  matchesCosmeticFilter,
  skinsForMonkey,
  type CosmeticRarity,
  type CosmeticOwnershipFilter,
  type CosmeticRarityFilter,
  type ProfileMonkey,
  type ProfileSkin
} from "../../game/config/profileMonkeys";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import {
  CosmeticDetailModal,
  CosmeticUnlockFeedback,
  type CosmeticDetailSelection
} from "./CosmeticDetailModal";
import { SpringPressable } from "./SpringPressable";

type MonkeyCollectionModalProps = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
};

const RARITY_THEME: Record<
  CosmeticRarity,
  { border: string; badge: string; glow: string; surface: string; text: string }
> = {
  common: {
    border: "#ae7844",
    badge: "#79502d",
    glow: "#d39a55",
    surface: "rgba(63, 43, 27, 0.96)",
    text: "#ffe2aa"
  },
  rare: {
    border: "#b9cfdf",
    badge: "#536c7d",
    glow: "#d9f2ff",
    surface: "rgba(43, 55, 61, 0.96)",
    text: "#e3f4ff"
  },
  epic: {
    border: "#bb79ff",
    badge: "#6b3299",
    glow: "#ce85ff",
    surface: "rgba(55, 31, 69, 0.97)",
    text: "#f0d6ff"
  },
  legendary: {
    border: "#ffd469",
    badge: "#a66b12",
    glow: "#ffe08a",
    surface: "rgba(75, 50, 18, 0.97)",
    text: "#fff0b3"
  },
  mythic: {
    border: "#ffe27d",
    badge: "#7558a7",
    glow: "#b8f5ff",
    surface: "rgba(55, 40, 62, 0.98)",
    text: "#fff4bd"
  }
};

const RARITY_ICONS: Record<CosmeticRarity, string> = {
  common: "◆",
  rare: "✦",
  epic: "✧",
  legendary: "★",
  mythic: "✺"
};

const GOLD_PARTICLES = [
  { x: -58, y: -48 },
  { x: -32, y: -72 },
  { x: 0, y: -82 },
  { x: 34, y: -68 },
  { x: 59, y: -42 },
  { x: -48, y: -18 },
  { x: 48, y: -14 },
  { x: 0, y: -52 }
] as const;

export function MonkeyCollectionModal({
  visible,
  lang,
  onClose
}: MonkeyCollectionModalProps) {
  const { width, height } = useWindowDimensions();
  const gems = useGameStore((state) => state.gems);
  const unlocked = useGameStore((state) => state.unlockedProfileMonkeys);
  const equipped = useGameStore((state) => state.equippedProfileMonkey);
  const ownedSkins = useGameStore((state) => state.ownedProfileSkins);
  const equippedSkin = useGameStore((state) => state.equippedProfileSkin);
  const newMonkeys = useGameStore((state) => state.newProfileMonkeys);
  const newSkins = useGameStore((state) => state.newProfileSkins);
  const unlock = useGameStore((state) => state.unlockProfileMonkey);
  const equip = useGameStore((state) => state.equipProfileMonkey);
  const unlockSkin = useGameStore((state) => state.unlockProfileSkin);
  const equipSkin = useGameStore((state) => state.equipProfileSkin);
  const markMonkeySeen = useGameStore((state) => state.markProfileMonkeySeen);
  const markSkinSeen = useGameStore((state) => state.markProfileSkinSeen);
  const [pending, setPending] = useState<ProfileMonkey | null>(null);
  const [pendingSkin, setPendingSkin] = useState<ProfileSkin | null>(null);
  const [showInsufficient, setShowInsufficient] = useState(false);
  const [showRequiresMonkey, setShowRequiresMonkey] = useState(false);
  const [celebratingId, setCelebratingId] = useState<ProfileMonkey["id"] | null>(null);
  const [detailSelection, setDetailSelection] = useState<CosmeticDetailSelection | null>(null);
  const [unlockFeedback, setUnlockFeedback] = useState<CosmeticDetailSelection | null>(null);
  const [activeTab, setActiveTab] = useState<"monkeys" | "skins" | "shop">("monkeys");
  const [selectedSkinMonkey, setSelectedSkinMonkey] = useState(equipped);
  const [ownershipFilter, setOwnershipFilter] = useState<CosmeticOwnershipFilter>("all");
  const [rarityFilter, setRarityFilter] = useState<CosmeticRarityFilter>("all");
  const [visibleSkinCount, setVisibleSkinCount] = useState(12);
  const compact = width < 360;
  const collected = unlocked.length;
  const completion = Math.round(((collected + ownedSkins.length) / (PROFILE_MONKEYS.length + PROFILE_SKINS.length)) * 100);

  useEffect(() => {
    if (!celebratingId) {
      return;
    }
    const timer = setTimeout(() => setCelebratingId(null), 1650);
    return () => clearTimeout(timer);
  }, [celebratingId]);

  useEffect(() => setVisibleSkinCount(12), [selectedSkinMonkey]);

  function closeCollection() {
    setPending(null);
    setPendingSkin(null);
    setShowInsufficient(false);
    setShowRequiresMonkey(false);
    setCelebratingId(null);
    setDetailSelection(null);
    setUnlockFeedback(null);
    onClose();
  }

  function selectMonkey(monkey: ProfileMonkey) {
    const wasNew = newMonkeys.includes(monkey.id);
    setDetailSelection({ kind: "monkey", item: monkey, wasNew });
    if (wasNew) markMonkeySeen(monkey.id);
  }

  function confirmUnlock() {
    if (!pending) {
      return;
    }
    const result = unlock(pending.id);
    const unlockedId = pending.id;
    setPending(null);
    if (result === "insufficient") {
      setShowInsufficient(true);
    } else if (result === "unlocked") {
      setCelebratingId(unlockedId);
      setUnlockFeedback({ kind: "monkey", item: pending, wasNew: true });
    }
  }

  function selectSkin(skin: ProfileSkin) {
    const wasNew = newSkins.includes(skin.id);
    setDetailSelection({ kind: "skin", item: skin, wasNew });
    if (wasNew) markSkinSeen(skin.id);
  }

  function confirmSkinUnlock() {
    if (!pendingSkin) return;
    const result = unlockSkin(pendingSkin.id);
    const skinId = pendingSkin.id;
    setPendingSkin(null);
    if (result === "insufficient") setShowInsufficient(true);
    if (result === "requires_monkey") setShowRequiresMonkey(true);
    if (result === "unlocked") {
      setCelebratingId(skinId);
      setUnlockFeedback({ kind: "skin", item: pendingSkin, wasNew: true });
    }
  }

  const filteredMonkeys = PROFILE_MONKEYS.filter((item) =>
    matchesCosmeticFilter(unlocked.includes(item.id), item.rarity, ownershipFilter, rarityFilter)
  );
  const selectedMonkeySkins = skinsForMonkey(selectedSkinMonkey).filter((item) =>
    matchesCosmeticFilter(ownedSkins.includes(item.id), item.rarity, ownershipFilter, rarityFilter)
  );
  const featuredMonkeys = PROFILE_MONKEYS.filter((item) => item.featured).slice(0, 2);
  const featuredSkins = PROFILE_SKINS.filter((item) => item.featured).slice(0, 2);
  const bestValueMonkeys = PROFILE_MONKEYS.filter((item) => item.id === "profile_monkey_scout" || item.id === "profile_monkey_warrior");

  const detailOwned = detailSelection?.kind === "monkey"
    ? unlocked.includes(detailSelection.item.id)
    : detailSelection?.kind === "skin"
      ? ownedSkins.includes(detailSelection.item.id)
      : false;
  const detailEquipped = detailSelection?.kind === "monkey"
    ? equipped === detailSelection.item.id && equippedSkin === detailSelection.item.availableSkinIds[0]
    : detailSelection?.kind === "skin"
      ? equippedSkin === detailSelection.item.id
      : false;

  function requestDetailUnlock() {
    if (!detailSelection) return;
    if (detailSelection.kind === "monkey") setPending(detailSelection.item);
    else setPendingSkin(detailSelection.item);
  }

  function equipDetail() {
    if (!detailSelection) return;
    if (detailSelection.kind === "monkey") equip(detailSelection.item.id);
    else equipSkin(detailSelection.item.id);
  }

  function equipUnlockedNow() {
    if (!unlockFeedback) return;
    if (unlockFeedback.kind === "monkey") equip(unlockFeedback.item.id);
    else equipSkin(unlockFeedback.item.id);
    setUnlockFeedback(null);
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeCollection}
      >
        <View style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCollection} />
          <View
            style={[
              styles.album,
              { width: Math.min(width - 24, 410), height: Math.min(height - 32, 740) }
            ]}
          >
            <View style={styles.albumEdge} pointerEvents="none" />
            <View style={styles.header}>
              <View style={styles.headerTopRow}>
                <Text style={styles.title} maxFontSizeMultiplier={theme.maxFontScale}>
                  {t("collection.title", lang)}
                </Text>
                <SpringPressable
                  accessibilityRole="button"
                  accessibilityLabel={t("settings.close", lang)}
                  onPress={closeCollection}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeText}>×</Text>
                </SpringPressable>
              </View>
              <Text style={styles.subtitle} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("collection.subtitle", lang)}
              </Text>
              <View style={[styles.summaryRow, compact ? styles.summaryRowCompact : null]}>
                <View style={styles.progressSummary}>
                  <Text style={styles.summaryLabel} maxFontSizeMultiplier={theme.maxFontScale}>
                    {t("collection.collected", lang)}
                  </Text>
                  <Text style={styles.summaryValue} maxFontSizeMultiplier={theme.maxFontScale}>
                    {t("collection.progress.monkeysOwned", lang, { owned: collected, total: PROFILE_MONKEYS.length })}
                  </Text>
                  <Text style={styles.skinProgressText} maxFontSizeMultiplier={theme.maxFontScale}>
                    {t("collection.progress.skinsOwned", lang, { owned: ownedSkins.length, total: PROFILE_SKINS.length })}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${completion}%` }]} />
                  </View>
                  <Text style={styles.completionText} maxFontSizeMultiplier={theme.maxFontScale}>
                    {t("collection.completion", lang, { percent: completion })}
                  </Text>
                </View>
                <View style={styles.diamondPanel}>
                  <Text style={styles.diamondLabel} maxFontSizeMultiplier={theme.maxFontScale}>
                    {t("collection.diamonds", lang)}
                  </Text>
                  <View style={styles.gemPill}>
                    <AssetImage
                      assetKey="resourceJungleGem"
                      style={styles.gemIcon}
                      fallback={<View style={styles.gemFallback} />}
                      hideFallbackOnLoad
                    />
                    <Text style={styles.gemText} maxFontSizeMultiplier={theme.maxFontScale}>
                      {gems}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.primaryTabs}>
                {(["monkeys", "skins", "shop"] as const).map((tab) => (
                  <SpringPressable
                    key={tab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === tab }}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.primaryTab, activeTab === tab ? styles.primaryTabActive : null]}
                  >
                    <Text style={[styles.primaryTabText, activeTab === tab ? styles.primaryTabTextActive : null]}>
                      {t(`collection.tab.${tab}`, lang)}
                    </Text>
                  </SpringPressable>
                ))}
              </View>
            </View>

            {visible ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {activeTab !== "shop" ? (
                  <FilterControls
                    lang={lang}
                    ownership={ownershipFilter}
                    rarity={rarityFilter}
                    onOwnership={setOwnershipFilter}
                    onRarity={setRarityFilter}
                  />
                ) : null}
                {activeTab === "monkeys" ? filteredMonkeys.map((monkey) => (
                    <CollectionCard
                      key={monkey.id}
                      monkey={monkey}
                      lang={lang}
                      compact={compact}
                      owned={unlocked.includes(monkey.id)}
                      equipped={equipped === monkey.id}
                      isNew={newMonkeys.includes(monkey.id)}
                      unlockCelebrating={celebratingId === monkey.id}
                      onPress={() => selectMonkey(monkey)}
                    />
                  )) : null}
                {activeTab === "monkeys" && filteredMonkeys.length === 0 ? <Text style={styles.emptyText}>{t("collection.filter.empty", lang)}</Text> : null}
                {activeTab === "skins" ? (
                  <View style={styles.fullWidthSection}>
                    <Text style={styles.sectionTitle}>{t("collection.skinsTitle", lang)}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monkeyPicker}>
                      {PROFILE_MONKEYS.map((monkey) => (
                        <SpringPressable
                          key={monkey.id}
                          onPress={() => setSelectedSkinMonkey(monkey.id)}
                          style={[styles.monkeyPickerItem, selectedSkinMonkey === monkey.id ? styles.monkeyPickerItemActive : null]}
                        >
                          <AssetImage assetKey={monkey.portraitAsset} style={styles.monkeyPickerArt} fallback={<Text>🐵</Text>} hideFallbackOnLoad />
                          <Text numberOfLines={1} style={styles.monkeyPickerText}>{t(monkey.nameKey, lang)}</Text>
                        </SpringPressable>
                      ))}
                    </ScrollView>
                    <View style={styles.skinGrid}>
                      {selectedMonkeySkins.slice(0, visibleSkinCount).map((skin) => (
                        <SkinCard key={skin.id} skin={skin} lang={lang} compact={compact} owned={ownedSkins.includes(skin.id)} equipped={equippedSkin === skin.id} monkeyOwned={unlocked.includes(skin.monkeyId)} isNew={newSkins.includes(skin.id)} celebrating={celebratingId === skin.id} onPress={() => selectSkin(skin)} />
                      ))}
                    </View>
                    {selectedMonkeySkins.length === 0 ? <Text style={styles.emptyText}>{t("collection.filter.empty", lang)}</Text> : null}
                    {visibleSkinCount < selectedMonkeySkins.length ? <SpringPressable onPress={() => setVisibleSkinCount((count) => count + 12)} style={styles.loadMoreButton}><Text style={styles.loadMoreText}>{t("collection.showMore", lang)}</Text></SpringPressable> : null}
                  </View>
                ) : null}
                {activeTab === "shop" ? (
                  <View style={styles.fullWidthSection}>
                    <Text style={styles.sectionTitle}>{t("collection.shop.title", lang)}</Text>
                    <Text style={styles.shopSectionTitle}>{t("collection.shop.featuredMonkey", lang)}</Text>
                    <View style={styles.skinGrid}>
                      {featuredMonkeys.map((monkey) => (
                        <ShopTile key={monkey.id} name={t(monkey.nameKey, lang)} asset={monkey.portraitAsset} rarity={monkey.rarity} price={monkey.price} owned={unlocked.includes(monkey.id)} equipped={equipped === monkey.id} isNew={newMonkeys.includes(monkey.id)} onPress={() => selectMonkey(monkey)} lang={lang} />
                      ))}
                    </View>
                    <Text style={styles.shopSectionTitle}>{t("collection.shop.featuredSkin", lang)}</Text>
                    <View style={styles.skinGrid}>
                      {featuredSkins.map((skin) => (
                        <ShopTile key={skin.id} name={t(skin.nameKey, lang)} asset={getCosmeticAppearance(skin.monkeyId, skin.id).portraitAsset} rarity={skin.rarity} price={skin.price} owned={ownedSkins.includes(skin.id)} equipped={equippedSkin === skin.id} isNew={newSkins.includes(skin.id)} onPress={() => selectSkin(skin)} lang={lang} />
                      ))}
                    </View>
                    <Text style={styles.shopSectionTitle}>{t("collection.shop.bestValue", lang)}</Text>
                    <View style={styles.skinGrid}>
                      {bestValueMonkeys.map((monkey) => (
                        <ShopTile key={monkey.id} name={t(monkey.nameKey, lang)} asset={monkey.portraitAsset} rarity={monkey.rarity} price={monkey.price} owned={unlocked.includes(monkey.id)} equipped={equipped === monkey.id} isNew={newMonkeys.includes(monkey.id)} onPress={() => selectMonkey(monkey)} lang={lang} />
                      ))}
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
          <CosmeticDetailModal
            selection={detailSelection}
            lang={lang}
            gems={gems}
            owned={detailOwned}
            equipped={detailEquipped}
            ownedSkinIds={ownedSkins}
            onClose={() => setDetailSelection(null)}
            onUnlock={requestDetailUnlock}
            onEquip={equipDetail}
            onOpenSkin={selectSkin}
          />
          <CosmeticUnlockFeedback
            selection={unlockFeedback}
            lang={lang}
            onDismiss={() => setUnlockFeedback(null)}
            onEquipNow={equipUnlockedNow}
          />
        </View>
      </Modal>

      <Modal
        visible={pending != null || pendingSkin != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { setPending(null); setPendingSkin(null); }}
      >
        <View style={styles.dialogScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setPending(null); setPendingSkin(null); }} />
          <View style={styles.dialog}>
            <Text style={styles.dialogIcon}>🐵</Text>
            <Text style={styles.dialogTitle} maxFontSizeMultiplier={theme.maxFontScale}>
              {pending ? t(pending.nameKey, lang) : pendingSkin ? t(pendingSkin.nameKey, lang) : ""}
            </Text>
            <Text style={styles.dialogMessage} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("collection.unlockPrompt", lang, { price: pending?.price ?? pendingSkin?.price ?? 0 })}
            </Text>
            <View style={styles.dialogActions}>
              <SpringPressable
                accessibilityRole="button"
                onPress={() => { setPending(null); setPendingSkin(null); }}
                style={[styles.dialogButton, styles.cancelButton]}
              >
                <Text style={styles.cancelText} maxFontSizeMultiplier={theme.maxFontScale}>
                  {t("collection.cancel", lang)}
                </Text>
              </SpringPressable>
              <SpringPressable
                accessibilityRole="button"
                onPress={pendingSkin ? confirmSkinUnlock : confirmUnlock}
                style={[styles.dialogButton, styles.unlockButton]}
              >
                <Text style={styles.unlockText} maxFontSizeMultiplier={theme.maxFontScale}>
                  {t("collection.unlock", lang)}
                </Text>
              </SpringPressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRequiresMonkey} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowRequiresMonkey(false)}>
        <View style={styles.dialogScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowRequiresMonkey(false)} />
          <View style={styles.notice}>
            <Text style={styles.dialogIcon}>🔒</Text>
            <Text style={styles.dialogMessage}>{t("collection.requiresMonkey", lang)}</Text>
            <SpringPressable onPress={() => setShowRequiresMonkey(false)} style={[styles.dialogButton, styles.unlockButton, styles.noticeButton]}><Text style={styles.unlockText}>{t("collection.ok", lang)}</Text></SpringPressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInsufficient}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowInsufficient(false)}
      >
        <View style={styles.dialogScrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowInsufficient(false)} />
          <View style={styles.notice}>
            <AssetImage
              assetKey="resourceJungleGem"
              style={styles.noticeGem}
              fallback={<Text style={styles.dialogIcon}>💎</Text>}
              hideFallbackOnLoad
            />
            <Text style={styles.dialogMessage} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("collection.notEnoughDiamonds", lang)}
            </Text>
            <SpringPressable
              accessibilityRole="button"
              onPress={() => setShowInsufficient(false)}
              style={[styles.dialogButton, styles.unlockButton, styles.noticeButton]}
            >
              <Text style={styles.unlockText} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("collection.ok", lang)}
              </Text>
            </SpringPressable>
          </View>
        </View>
      </Modal>

    </>
  );
}

function CollectionCard({
  monkey,
  lang,
  compact,
  owned,
  equipped,
  isNew,
  unlockCelebrating,
  onPress
}: {
  monkey: ProfileMonkey;
  lang: Lang;
  compact: boolean;
  owned: boolean;
  equipped: boolean;
  isNew: boolean;
  unlockCelebrating: boolean;
  onPress: () => void;
}) {
  const rarity = RARITY_THEME[monkey.rarity];
  const unlockAnim = useRef(new Animated.Value(1)).current;
  const equipAnim = useRef(new Animated.Value(equipped ? 1 : 0)).current;
  const [displayEquipped, setDisplayEquipped] = useState(equipped);
  const status = equipped
    ? t("collection.equipped", lang)
    : owned
      ? t("collection.owned", lang)
      : t("collection.locked", lang);

  useEffect(() => {
    if (!unlockCelebrating) {
      return;
    }
    unlockAnim.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(unlockAnim, {
        toValue: 0.5,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(unlockAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.back(1.25)),
        useNativeDriver: true
      })
    ]);
    animation.start();
    return () => animation.stop();
  }, [unlockAnim, unlockCelebrating]);

  useEffect(() => {
    if (equipped) {
      setDisplayEquipped(true);
      equipAnim.setValue(0);
      Animated.spring(equipAnim, {
        toValue: 1,
        speed: 15,
        bounciness: 9,
        useNativeDriver: true
      }).start();
      return;
    }
    if (displayEquipped) {
      Animated.timing(equipAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }).start(() => setDisplayEquipped(false));
    }
  }, [displayEquipped, equipAnim, equipped]);

  const cardFlip = unlockAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "88deg", "0deg"]
  });

  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={`${t(monkey.nameKey, lang)}. ${status}`}
      accessibilityState={{ selected: equipped }}
      onPress={onPress}
      pressedScale={0.975}
      style={[
        styles.monkeyCard,
        compact ? styles.monkeyCardCompact : null,
        {
          borderColor: rarity.border,
          backgroundColor: rarity.surface,
          shadowColor: rarity.glow
        },
        equipped ? styles.monkeyCardEquipped : null
      ]}
    >
      {isNew ? <View pointerEvents="none" style={styles.newCorner}><Text style={styles.newCornerText}>NEW</Text></View> : null}
      <AnimatedRarityFx rarity={monkey.rarity} color={rarity.glow} />
      <Animated.View style={[styles.cardContent, { transform: [{ rotateY: cardFlip }] }]}>
      <View
        style={[
          styles.artFrame,
          compact ? styles.artFrameCompact : null,
          { borderColor: rarity.border }
        ]}
      >
        <View style={[styles.artHalo, { backgroundColor: rarity.glow }]} />
        <AssetImage
          assetKey={monkey.portraitAsset}
          style={[styles.monkeyArt, compact ? styles.monkeyArtCompact : null]}
          resizeMode="contain"
          fallback={<Text style={styles.artFallback}>🐵</Text>}
          hideFallbackOnLoad
        />
        {!owned ? <View style={styles.lockShade} pointerEvents="none" /> : null}
      </View>

      <View style={[styles.rarityBadge, { backgroundColor: rarity.badge }]}>
        <Text style={[styles.rarityIcon, { color: rarity.text }]}>{RARITY_ICONS[monkey.rarity]}</Text>
        <Text style={[styles.rarityText, { color: rarity.text }]} maxFontSizeMultiplier={theme.maxFontScale}>
          {t(`collection.rarity.${monkey.rarity}`, lang)}
        </Text>
      </View>
      <Text style={styles.monkeyName} maxFontSizeMultiplier={theme.maxFontScale}>
        {t(monkey.nameKey, lang)}
      </Text>
      <Text style={styles.description} maxFontSizeMultiplier={theme.maxFontScale}>
        {t(monkey.descriptionKey, lang)}
      </Text>

      <View style={styles.statusRow}>
        {displayEquipped ? (
          <Animated.View
            style={{
              opacity: equipAnim,
              transform: [
                {
                  scale: equipAnim.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] })
                }
              ]
            }}
          >
            <Text style={[styles.statusText, styles.equippedText]} maxFontSizeMultiplier={theme.maxFontScale}>
              {t("collection.equipped", lang)}
            </Text>
          </Animated.View>
        ) : (
          <Text style={styles.statusText} maxFontSizeMultiplier={theme.maxFontScale}>
            {owned ? t("collection.owned", lang) : t("collection.locked", lang)}
          </Text>
        )}
      </View>

      {!owned ? (
        <View style={styles.priceButton}>
          <AssetImage
            assetKey="resourceJungleGem"
            style={styles.priceGem}
            fallback={<View style={styles.gemFallback} />}
            hideFallbackOnLoad
          />
          <Text style={styles.priceText} maxFontSizeMultiplier={theme.maxFontScale}>
            {monkey.price}
          </Text>
        </View>
      ) : !equipped ? (
        <View style={styles.equipButton}>
          <Text style={styles.equipText} maxFontSizeMultiplier={theme.maxFontScale}>
            {t("collection.equip", lang)}
          </Text>
        </View>
      ) : (
        <View style={[styles.equipButton, styles.equippedButton]}>
          <Text style={styles.equipText} maxFontSizeMultiplier={theme.maxFontScale}>
            ✓
          </Text>
        </View>
      )}
      </Animated.View>
      {unlockCelebrating ? (
        <UnlockCelebration progress={unlockAnim} lang={lang} />
      ) : null}
    </SpringPressable>
  );
}

function UnlockCelebration({ progress, lang }: { progress: Animated.Value; lang: Lang }) {
  const particleOpacity = progress.interpolate({
    inputRange: [0, 0.12, 0.72, 1],
    outputRange: [0, 1, 0.9, 0]
  });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.unlockGlow,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.35, 0.75, 1],
              outputRange: [0, 0.88, 0.45, 0]
            }),
            transform: [
              {
                scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.35] })
              }
            ]
          }
        ]}
      />
      <Animated.Text
        style={[
          styles.breakingLock,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.3, 0.58],
              outputRange: [1, 1, 0],
              extrapolate: "clamp"
            }),
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 0.42, 0.7],
                  outputRange: [0.8, 1.3, 0.6],
                  extrapolate: "clamp"
                })
              },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 0.58],
                  outputRange: ["0deg", "-12deg"],
                  extrapolate: "clamp"
                })
              }
            ]
          }
        ]}
      >
        🔓
      </Animated.Text>
      {GOLD_PARTICLES.map((particle, index) => (
        <Animated.View
          key={`${particle.x}-${particle.y}`}
          style={[
            styles.goldParticle,
            {
              opacity: particleOpacity,
              transform: [
                {
                  translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.x] })
                },
                {
                  translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.y] })
                },
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.25, 1],
                    outputRange: [0.2, 1 + (index % 2) * 0.25, 0.45]
                  })
                }
              ]
            }
          ]}
        />
      ))}
      <Animated.View
        style={[
          styles.unlockedBanner,
          {
            opacity: progress.interpolate({ inputRange: [0, 0.58, 0.75, 1], outputRange: [0, 0, 1, 1] }),
            transform: [
              {
                scale: progress.interpolate({ inputRange: [0, 0.62, 1], outputRange: [0.75, 0.75, 1] })
              }
            ]
          }
        ]}
      >
        <Text style={styles.unlockedText} maxFontSizeMultiplier={theme.maxFontScale}>
          {t("collection.unlocked", lang)}
        </Text>
      </Animated.View>
    </View>
  );
}

function AnimatedRarityFx({
  rarity,
  color
}: {
  rarity: CosmeticRarity;
  color: string;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const premium = rarity === "epic" || rarity === "legendary" || rarity === "mythic";
  const glowPeak = rarity === "epic" ? 0.34 : 0.7;

  useEffect(() => {
    if (!premium) {
      return;
    }
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );
    pulseLoop.start();

    let shimmerLoop: Animated.CompositeAnimation | null = null;
    if (rarity === "mythic") {
      shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 2300,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.delay(1000)
        ])
      );
      shimmerLoop.start();
    }

    return () => {
      pulseLoop.stop();
      shimmerLoop?.stop();
    };
  }, [premium, pulse, rarity, shimmer]);

  if (!premium) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.glowOutline,
          {
            borderColor: color,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, glowPeak] })
          }
        ]}
      />
      {rarity === "mythic" ? (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [
                {
                  translateX: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-220, 220]
                  })
                },
                { rotate: "18deg" }
              ]
            }
          ]}
        />
      ) : null}
    </View>
  );
}

function SkinCard({
  skin,
  lang,
  compact,
  owned,
  equipped,
  monkeyOwned,
  isNew,
  celebrating,
  onPress
}: {
  skin: ProfileSkin;
  lang: Lang;
  compact: boolean;
  owned: boolean;
  equipped: boolean;
  monkeyOwned: boolean;
  isNew: boolean;
  celebrating: boolean;
  onPress: () => void;
}) {
  const rarity = RARITY_THEME[skin.rarity];
  const appearance = getCosmeticAppearance(skin.monkeyId, skin.id);
  const monkey = getProfileMonkey(skin.monkeyId);
  const unlockAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!celebrating) return;
    unlockAnim.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(unlockAnim, { toValue: 0.5, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(unlockAnim, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.25)), useNativeDriver: true })
    ]);
    animation.start();
    return () => animation.stop();
  }, [celebrating, unlockAnim]);
  const cardFlip = unlockAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["0deg", "88deg", "0deg"] });
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityState={{ selected: equipped, disabled: !monkeyOwned }}
      onPress={onPress}
      pressedScale={0.975}
      style={[styles.skinCard, compact ? styles.skinCardCompact : null, { borderColor: rarity.border, backgroundColor: rarity.surface, shadowColor: rarity.glow }, equipped ? styles.monkeyCardEquipped : null]}
    >
      {isNew ? <View pointerEvents="none" style={styles.newCorner}><Text style={styles.newCornerText}>NEW</Text></View> : null}
      <AnimatedRarityFx rarity={skin.rarity} color={rarity.glow} />
      <Animated.View style={[styles.skinArtFrame, { borderColor: rarity.border, transform: [{ rotateY: cardFlip }] }]}>
        <View style={[styles.artHalo, { backgroundColor: rarity.glow }]} />
        <AssetImage assetKey={appearance.portraitAsset} style={styles.skinArt} resizeMode="contain" fallback={<Text style={styles.artFallback}>🐵</Text>} hideFallbackOnLoad />
        {!owned ? <View style={styles.lockShade} pointerEvents="none" /> : null}
      </Animated.View>
      <View style={[styles.rarityBadge, { backgroundColor: rarity.badge }]}>
        <Text style={[styles.rarityIcon, { color: rarity.text }]}>{RARITY_ICONS[skin.rarity]}</Text>
        <Text style={[styles.rarityText, { color: rarity.text }]}>{t(`collection.rarity.${skin.rarity}`, lang)}</Text>
      </View>
      <Text style={styles.skinName} numberOfLines={2}>{t(skin.nameKey, lang)}</Text>
      <Text style={styles.skinMonkeyName} numberOfLines={1}>{monkey ? t(monkey.nameKey, lang) : ""}</Text>
      <Text style={styles.skinDescription} numberOfLines={3}>{t(skin.descriptionKey, lang)}</Text>
      <Text style={[styles.statusText, equipped ? styles.equippedText : null]}>
        {!monkeyOwned ? t("collection.requiresMonkeyShort", lang) : equipped ? t("collection.equipped", lang) : owned ? t("collection.owned", lang) : t("collection.locked", lang)}
      </Text>
      {!owned ? (
        <View style={styles.priceButton}><AssetImage assetKey="resourceJungleGem" style={styles.priceGem} fallback={<View />} /><Text style={styles.priceText}>{skin.price}</Text></View>
      ) : !equipped ? (
        <View style={styles.equipButton}><Text style={styles.equipText}>{t("collection.equip", lang)}</Text></View>
      ) : (
        <View style={[styles.equipButton, styles.equippedButton]}><Text style={styles.equipText}>✓</Text></View>
      )}
      {celebrating ? <UnlockCelebration progress={unlockAnim} lang={lang} /> : null}
    </SpringPressable>
  );
}

function ShopTile({ name, asset, rarity, price, owned, equipped, isNew, onPress, lang }: {
  name: string;
  asset: import("../../game/assets/gameAssets").GameAssetKey;
  rarity: CosmeticRarity;
  price: number;
  owned: boolean;
  equipped: boolean;
  isNew: boolean;
  onPress: () => void;
  lang: Lang;
}) {
  const colors = RARITY_THEME[rarity];
  return (
    <SpringPressable onPress={onPress} style={[styles.shopTile, { borderColor: colors.border, backgroundColor: colors.surface, shadowColor: colors.glow }]}>
      {isNew ? <View pointerEvents="none" style={styles.newCorner}><Text style={styles.newCornerText}>NEW</Text></View> : null}
      <AssetImage assetKey={asset} style={styles.shopTileArt} resizeMode="contain" fallback={<Text style={styles.artFallback}>🐵</Text>} hideFallbackOnLoad />
      <View style={[styles.shopRarityDot, { backgroundColor: colors.border }]} />
      <Text style={styles.shopTileName} numberOfLines={2}>{name}</Text>
      <Text style={[styles.shopTileStatus, equipped ? styles.equippedText : null]}>
        {equipped ? t("collection.equipped", lang) : owned ? t("collection.owned", lang) : `💎 ${price}`}
      </Text>
    </SpringPressable>
  );
}

function FilterControls({
  lang,
  ownership,
  rarity,
  onOwnership,
  onRarity
}: {
  lang: Lang;
  ownership: CosmeticOwnershipFilter;
  rarity: CosmeticRarityFilter;
  onOwnership: (value: CosmeticOwnershipFilter) => void;
  onRarity: (value: CosmeticRarityFilter) => void;
}) {
  return (
    <View style={styles.filterPanel}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(["all", "owned", "locked"] as const).map((value) => (
          <SpringPressable key={value} onPress={() => onOwnership(value)} style={[styles.filterChip, ownership === value ? styles.filterChipActive : null]}>
            <Text style={[styles.filterChipText, ownership === value ? styles.filterChipTextActive : null]}>{t(`collection.filter.${value}`, lang)}</Text>
          </SpringPressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(["all", "common", "rare", "epic", "legendary", "mythic"] as const).map((value) => (
          <SpringPressable key={value} onPress={() => onRarity(value)} style={[styles.rarityFilterChip, rarity === value ? styles.rarityFilterChipActive : null]}>
            <Text style={[styles.rarityFilterText, rarity === value ? styles.filterChipTextActive : null]}>
              {value === "all" ? t("collection.filter.allRarities", lang) : `${RARITY_ICONS[value]} ${t(`collection.rarity.${value}`, lang)}`}
            </Text>
          </SpringPressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4, 11, 7, 0.84)",
    padding: 12
  },
  album: {
    maxWidth: 410,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#d6a44d",
    backgroundColor: "rgba(21, 27, 17, 0.99)",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.65,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18
  },
  albumEdge: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 226, 139, 0.18)"
  },
  header: {
    gap: 7,
    paddingHorizontal: 2,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 177, 90, 0.25)"
  },
  primaryTabs: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2
  },
  primaryTab: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.25)",
    backgroundColor: "rgba(35, 29, 19, 0.72)",
    paddingHorizontal: 4
  },
  primaryTabActive: {
    borderColor: "#e7b94f",
    backgroundColor: "rgba(97, 67, 24, 0.96)"
  },
  primaryTabText: {
    color: "#bfb28f",
    fontSize: 10,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  primaryTabTextActive: {
    color: "#fff0b3"
  },
  headerTopRow: {
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
  subtitle: {
    color: "#cdbf9a",
    fontSize: 11,
    lineHeight: 15,
    fontFamily: theme.fonts.bold
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8
  },
  summaryRowCompact: {
    gap: 5
  },
  progressSummary: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.34)",
    backgroundColor: "rgba(48, 36, 22, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  summaryLabel: {
    color: "#c7b581",
    fontSize: 9,
    lineHeight: 11,
    fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  summaryValue: {
    color: theme.colors.paper,
    fontSize: 13,
    lineHeight: 16,
    fontFamily: theme.fonts.heavy
  },
  progressTrack: {
    height: 5,
    marginTop: 5,
    borderRadius: 3,
    backgroundColor: "rgba(5, 10, 6, 0.72)",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#e7b94f"
  },
  completionText: {
    marginTop: 3,
    color: "#d7c998",
    fontSize: 9,
    lineHeight: 11,
    fontFamily: theme.fonts.bold
  },
  skinProgressText: {
    marginTop: 2,
    color: "#a9d2df",
    fontSize: 8.5,
    lineHeight: 11,
    fontFamily: theme.fonts.bold
  },
  diamondPanel: {
    minWidth: 94,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(116, 205, 244, 0.5)",
    backgroundColor: "rgba(9, 26, 35, 0.82)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    shadowColor: "#65c9f4",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3
  },
  diamondLabel: {
    color: "#8fcce6",
    fontSize: 9,
    lineHeight: 11,
    fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  gemPill: {
    minWidth: 58,
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(126, 208, 255, 0.5)",
    backgroundColor: "rgba(6, 19, 27, 0.92)",
    paddingHorizontal: 8
  },
  gemIcon: {
    width: 17,
    height: 17
  },
  gemFallback: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#65c9f4"
  },
  gemText: {
    color: "#c9efff",
    fontSize: 13,
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
  scroll: {
    flex: 1,
    marginTop: 10
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 8
  },
  filterPanel: {
    width: "100%",
    gap: 6,
    marginBottom: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.2)",
    backgroundColor: "rgba(31, 28, 19, 0.76)",
    paddingVertical: 7
  },
  filterRow: {
    gap: 6,
    paddingHorizontal: 7
  },
  filterChip: {
    minHeight: 29,
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(223, 190, 116, 0.24)",
    backgroundColor: "rgba(45, 38, 25, 0.9)",
    paddingHorizontal: 12
  },
  filterChipActive: {
    borderColor: "#e7b94f",
    backgroundColor: "#76501d"
  },
  filterChipText: {
    color: "#c7bea2",
    fontSize: 9.5,
    fontFamily: theme.fonts.heavy
  },
  filterChipTextActive: {
    color: "#fff0b3"
  },
  rarityFilterChip: {
    minHeight: 27,
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(171, 170, 151, 0.2)",
    backgroundColor: "rgba(23, 27, 20, 0.86)",
    paddingHorizontal: 10
  },
  rarityFilterChipActive: {
    borderColor: "#cab47c",
    backgroundColor: "#50452d"
  },
  rarityFilterText: {
    color: "#aca78e",
    fontSize: 8.5,
    fontFamily: theme.fonts.bold
  },
  newCorner: {
    position: "absolute",
    zIndex: 8,
    top: 7,
    right: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffbc7a",
    backgroundColor: "#d83e31",
    paddingHorizontal: 7,
    paddingVertical: 3,
    shadowColor: "#ff764f",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 7
  },
  newCornerText: {
    color: "#fff8dc",
    fontSize: 8,
    lineHeight: 10,
    fontFamily: theme.fonts.heavy
  },
  fullWidthSection: {
    width: "100%"
  },
  sectionTitle: {
    color: theme.colors.paper,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: theme.fonts.heavy,
    marginBottom: 8
  },
  shopSectionTitle: {
    marginTop: 12,
    marginBottom: 7,
    color: "#dcc789",
    fontSize: 11,
    lineHeight: 15,
    fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  emptyText: {
    width: "100%",
    marginTop: 20,
    color: "#b9ae91",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  monkeyPicker: {
    gap: 8,
    paddingBottom: 10
  },
  monkeyPickerItem: {
    width: 82,
    minHeight: 90,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.24)",
    backgroundColor: "rgba(37, 31, 21, 0.88)",
    padding: 5
  },
  monkeyPickerItemActive: {
    borderWidth: 2,
    borderColor: "#e7b94f",
    backgroundColor: "rgba(88, 62, 25, 0.95)"
  },
  monkeyPickerArt: {
    width: 58,
    height: 58
  },
  monkeyPickerText: {
    width: "100%",
    color: "#e8dec4",
    fontSize: 8.5,
    lineHeight: 11,
    textAlign: "center",
    fontFamily: theme.fonts.bold
  },
  skinGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10
  },
  skinCard: {
    position: "relative",
    width: "48.4%",
    minHeight: 304,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    padding: 9,
    overflow: "hidden",
    shadowOpacity: 0.38,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7
  },
  skinCardCompact: {
    width: "100%",
    minHeight: 320
  },
  skinArtFrame: {
    width: "100%",
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    backgroundColor: "rgba(8, 13, 8, 0.58)",
    overflow: "hidden"
  },
  skinArt: {
    width: "100%",
    height: 112
  },
  skinName: {
    minHeight: 36,
    marginTop: 7,
    color: theme.colors.paper,
    fontSize: 13,
    lineHeight: 17,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  skinMonkeyName: {
    width: "100%",
    color: "#bcae8b",
    fontSize: 8,
    lineHeight: 11,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  skinDescription: {
    minHeight: 40,
    marginTop: 4,
    color: "#d8ccb0",
    fontSize: 9.5,
    lineHeight: 13,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  shopTabs: {
    gap: 7,
    paddingBottom: 10
  },
  shopTab: {
    minHeight: 32,
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.3)",
    backgroundColor: "rgba(38, 31, 20, 0.9)",
    paddingHorizontal: 13
  },
  shopTabActive: {
    borderColor: "#e7b94f",
    backgroundColor: "#76501d"
  },
  shopTabText: {
    color: "#f1dfaf",
    fontSize: 10,
    fontFamily: theme.fonts.heavy
  },
  shopTile: {
    width: "48.4%",
    minHeight: 190,
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 2,
    padding: 8,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  shopTileArt: {
    width: "100%",
    height: 118
  },
  shopRarityDot: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginTop: 3
  },
  shopTileName: {
    minHeight: 32,
    marginTop: 5,
    color: theme.colors.paper,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  shopTileStatus: {
    color: "#bdeaff",
    fontSize: 10,
    fontFamily: theme.fonts.heavy
  },
  futurePanel: {
    marginTop: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(226, 177, 90, 0.24)",
    backgroundColor: "rgba(40, 33, 22, 0.76)",
    padding: 10
  },
  loadMoreButton: {
    alignSelf: "center",
    minWidth: 130,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d6a44d",
    backgroundColor: "rgba(92, 63, 25, 0.95)",
    paddingHorizontal: 16
  },
  loadMoreText: {
    color: "#fff0b3",
    fontSize: 10,
    fontFamily: theme.fonts.heavy
  },
  futureTitle: {
    color: "#dbc78f",
    fontSize: 10,
    fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  futureChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 7
  },
  futureChip: {
    color: "#9e987f",
    fontSize: 9,
    fontFamily: theme.fonts.bold,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  monkeyCard: {
    position: "relative",
    width: "48.4%",
    minHeight: 350,
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 2,
    padding: 10,
    overflow: "hidden",
    shadowOpacity: 0.34,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7
  },
  monkeyCardCompact: {
    width: "100%",
    minHeight: 374
  },
  monkeyCardEquipped: {
    borderWidth: 3,
    shadowOpacity: 0.62,
    shadowRadius: 12,
    elevation: 8
  },
  cardContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    backfaceVisibility: "hidden"
  },
  glowOutline: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    borderWidth: 5
  },
  shimmer: {
    position: "absolute",
    top: -80,
    bottom: -80,
    width: 44,
    backgroundColor: "rgba(170, 239, 255, 0.14)"
  },
  artFrame: {
    width: "100%",
    height: 144,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(8, 13, 8, 0.58)",
    overflow: "hidden"
  },
  artFrameCompact: {
    height: 164
  },
  artHalo: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: 62,
    opacity: 0.16
  },
  monkeyArt: {
    width: "100%",
    height: 140
  },
  monkeyArtCompact: {
    height: 160
  },
  artFallback: {
    fontSize: 56
  },
  lockShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 9, 6, 0.42)"
  },
  rarityBadge: {
    alignSelf: "center",
    minWidth: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: -9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  rarityIcon: {
    fontSize: 8,
    lineHeight: 11,
    fontFamily: theme.fonts.heavy
  },
  rarityText: {
    fontSize: 9,
    lineHeight: 12,
    fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  monkeyName: {
    minHeight: 42,
    marginTop: 8,
    color: theme.colors.paper,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  description: {
    flexGrow: 1,
    width: "100%",
    marginTop: 5,
    paddingHorizontal: 2,
    color: "#d8ccb0",
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  statusRow: {
    minHeight: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
    marginBottom: 5
  },
  statusText: {
    color: "#d9caa2",
    fontSize: 11,
    lineHeight: 14,
    fontFamily: theme.fonts.heavy
  },
  equippedText: {
    color: "#bff69b"
  },
  priceButton: {
    width: "100%",
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(114, 211, 255, 0.8)",
    backgroundColor: "rgba(22, 70, 92, 0.96)",
    shadowColor: "#65c9f4",
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  priceGem: {
    width: 17,
    height: 17
  },
  priceText: {
    color: "#cef1ff",
    fontSize: 13,
    fontFamily: theme.fonts.heavy
  },
  equipButton: {
    width: "100%",
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(141, 211, 92, 0.75)",
    backgroundColor: "rgba(53, 115, 45, 0.94)"
  },
  equippedButton: {
    backgroundColor: "rgba(39, 81, 34, 0.8)"
  },
  equipText: {
    color: "#eefedc",
    fontSize: 12,
    fontFamily: theme.fonts.heavy
  },
  unlockGlow: {
    position: "absolute",
    top: 78,
    left: "50%",
    width: 132,
    height: 132,
    marginLeft: -66,
    borderRadius: 66,
    backgroundColor: "rgba(255, 213, 91, 0.34)",
    shadowColor: "#ffd45e",
    shadowOpacity: 0.8,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 }
  },
  breakingLock: {
    position: "absolute",
    top: 118,
    left: "50%",
    width: 72,
    marginLeft: -36,
    fontSize: 44,
    textAlign: "center"
  },
  goldParticle: {
    position: "absolute",
    top: 151,
    left: "50%",
    width: 7,
    height: 7,
    marginLeft: -3.5,
    borderRadius: 4,
    backgroundColor: "#ffd55c",
    shadowColor: "#fff1a1",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 }
  },
  unlockedBanner: {
    position: "absolute",
    top: 176,
    left: 18,
    right: 18,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ffe08a",
    backgroundColor: "rgba(83, 56, 15, 0.96)",
    shadowColor: "#ffd35e",
    shadowOpacity: 0.65,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10
  },
  unlockedText: {
    color: "#fff3b5",
    fontSize: 17,
    lineHeight: 21,
    fontFamily: theme.fonts.heavy,
    textTransform: "uppercase"
  },
  dialogScrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(3, 8, 5, 0.82)",
    padding: 20
  },
  dialog: {
    width: "100%",
    maxWidth: 330,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: "#d6a44d",
    backgroundColor: "#171d12",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18
  },
  notice: {
    width: "100%",
    maxWidth: 310,
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
  dialogIcon: {
    fontSize: 42
  },
  noticeGem: {
    width: 54,
    height: 54,
    marginBottom: 8
  },
  dialogTitle: {
    marginTop: 4,
    color: theme.colors.paper,
    fontSize: 18,
    lineHeight: 23,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  dialogMessage: {
    marginTop: 8,
    color: "#e9ddbd",
    fontSize: 14,
    lineHeight: 19,
    fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  dialogActions: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    marginTop: 18
  },
  dialogButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 10
  },
  cancelButton: {
    borderColor: "rgba(226, 177, 90, 0.4)",
    backgroundColor: "rgba(61, 46, 27, 0.9)"
  },
  unlockButton: {
    borderColor: "rgba(155, 225, 105, 0.75)",
    backgroundColor: "rgba(56, 125, 46, 0.96)"
  },
  cancelText: {
    color: "#e0d0aa",
    fontSize: 13,
    fontFamily: theme.fonts.heavy
  },
  unlockText: {
    color: "#f0ffdf",
    fontSize: 13,
    fontFamily: theme.fonts.heavy
  },
  noticeButton: {
    flex: 0,
    width: 130,
    marginTop: 18
  }
});
