import { StyleSheet, Text, View } from "react-native";
import {
  FESTIVAL_CHEST_LAUNCH_PRICE,
  FESTIVAL_CHEST_REGULAR_PRICE,
  FESTIVAL_RARITIES,
  FESTIVAL_RARITY_RULES,
  effectiveFestivalRarityOdds,
  eligibleFestivalSkins,
  festivalFragmentRequirement,
  unfinishedFestivalSkins
} from "../../game/config/festivalCollection";
import {
  FESTIVAL_PROFILE_SKINS,
  getCosmeticAppearance,
  getProfileMonkey,
  type CosmeticRarity,
  type ProfileSkin
} from "../../game/config/profileMonkeys";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";
import { FestivalFragmentIcon } from "./FestivalFragmentIcon";

const RARITY_COLORS: Record<CosmeticRarity, string> = {
  common: "#c48b4e",
  rare: "#bfe9ff",
  epic: "#c879ff",
  legendary: "#ffd261",
  mythic: "#fff08a"
};

const DEV_RARITY_SEEDS: Record<CosmeticRarity, number> = {
  common: 1,
  rare: 553,
  epic: 1327,
  legendary: 1765,
  mythic: 1946
};

export function FestivalCollectionPanel({
  lang,
  onSelectSkin,
  onInsufficient
}: {
  lang: Lang;
  onSelectSkin: (skin: ProfileSkin) => void;
  onInsufficient: () => void;
}) {
  const gems = useGameStore((state) => state.gems);
  const fragments = useGameStore((state) => state.festivalFragments);
  const owned = useGameStore((state) => state.ownedProfileSkins);
  const unlockedMonkeys = useGameStore((state) => state.unlockedProfileMonkeys);
  const equippedSkin = useGameStore((state) => state.equippedProfileSkin);
  const pending = useGameStore((state) => state.pendingFestivalChest);
  const seed = useGameStore((state) => state.festivalChestRngSeed);
  const openChest = useGameStore((state) => state.openFestivalChest);
  const addTestBalance = useGameStore((state) => state.addFestivalTestBalance);
  const resetProgress = useGameStore((state) => state.resetFestivalProgress);
  const seedRng = useGameStore((state) => state.seedFestivalChestRng);
  const unfinished = unfinishedFestivalSkins(fragments, owned);
  const eligible = eligibleFestivalSkins(fragments, owned, unlockedMonkeys);
  const completed = unfinished.length === 0;
  const effectiveOdds = effectiveFestivalRarityOdds(fragments, owned, unlockedMonkeys);

  function open(free = false, forcedSeed?: number) {
    const result = openChest({ free, seed: forcedSeed });
    if (result.status === "insufficient") onInsufficient();
  }

  return (
    <>
      <View style={styles.chestCard}>
        <View style={styles.eventRow}>
          <Text style={styles.eventBadge}>{t("festival.chest.launchEvent", lang)}</Text>
          <Text style={styles.discountBadge}>{t("festival.chest.discount", lang)}</Text>
        </View>
        <View style={styles.chestBody}>
          <View style={styles.chestArtFrame}>
            <View style={styles.chestGlow} />
            <AssetImage assetKey="propCrate" style={styles.chestArt} resizeMode="contain" fallback={<Text style={styles.chestFallback}>🎁</Text>} hideFallbackOnLoad />
          </View>
          <View style={styles.chestCopy}>
            <Text style={styles.chestName}>{t("festival.chest.name", lang)}</Text>
            <Text style={styles.poolText}>{t("festival.chest.eligible", lang, { count: eligible.length })}</Text>
            <View style={styles.priceRow}>
              <View style={styles.pricePill}>
                <AssetImage assetKey="resourceJungleGem" style={styles.gemIcon} fallback={<View />} hideFallbackOnLoad />
                <Text style={styles.regularPrice}>{FESTIVAL_CHEST_REGULAR_PRICE}</Text>
              </View>
              <View style={styles.pricePill}>
                <AssetImage assetKey="resourceJungleGem" style={styles.gemIcon} fallback={<View />} hideFallbackOnLoad />
                <Text style={styles.launchPrice}>{FESTIVAL_CHEST_LAUNCH_PRICE}</Text>
              </View>
            </View>
          </View>
        </View>
        <SpringPressable
          disabled={completed}
          onPress={() => open(false)}
          style={[styles.openButton, completed ? styles.disabledButton : null]}
        >
          <Text style={styles.openButtonText}>
            {completed
              ? t("festival.chest.completed", lang)
              : pending
                ? t("festival.chest.pending", lang)
                : t("festival.chest.open", lang)}
          </Text>
        </SpringPressable>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>{t("festival.chest.details", lang)}</Text>
        {FESTIVAL_RARITIES.map((rarity) => {
          const rule = FESTIVAL_RARITY_RULES[rarity];
          const effective = effectiveOdds.find((entry) => entry.rarity === rarity)?.percent ?? 0;
          const fragmentRange = rule.fragmentMin === rule.fragmentMax
            ? `${rule.fragmentMin}`
            : `${rule.fragmentMin}–${rule.fragmentMax}`;
          return (
            <View key={rarity} style={styles.oddsRow}>
              <Text style={[styles.oddsRarity, { color: RARITY_COLORS[rarity] }]}>{t(`collection.rarity.${rarity}`, lang)}</Text>
              <Text style={styles.oddsValue}>
                {rule.weight}%{Math.abs(effective - rule.weight) > 0.05 ? ` → ${effective.toFixed(1)}%` : ""} • {fragmentRange} {t("festival.chest.fragments", lang)}
              </Text>
            </View>
          );
        })}
        <Text style={styles.poolRule}>{t("festival.chest.poolRule", lang)}</Text>
      </View>

      <View style={styles.collectionHeader}>
        <Text style={styles.collectionTitle}>{t("festival.collection.title", lang)}</Text>
        <Text style={styles.collectionCount}>{FESTIVAL_PROFILE_SKINS.length - unfinished.length}/{FESTIVAL_PROFILE_SKINS.length}</Text>
      </View>
      <View style={styles.grid}>
        {FESTIVAL_PROFILE_SKINS.map((skin) => {
          const required = festivalFragmentRequirement(skin.id);
          const current = Math.min(required, fragments[skin.id] ?? 0);
          const isOwned = owned.includes(skin.id);
          const isEquipped = equippedSkin === skin.id;
          const monkey = getProfileMonkey(skin.monkeyId);
          const parentOwned = unlockedMonkeys.includes(skin.monkeyId);
          const appearance = getCosmeticAppearance(skin.monkeyId, skin.id);
          return (
            <SpringPressable key={skin.id} onPress={() => onSelectSkin(skin)} style={[styles.skinCard, { borderColor: RARITY_COLORS[skin.rarity] }]}>
              <View style={[styles.skinArtFrame, { borderColor: RARITY_COLORS[skin.rarity] }]}>
                <AssetImage assetKey={appearance.portraitAsset} style={styles.skinArt} resizeMode="contain" fallback={<Text style={styles.skinFallback}>🐵</Text>} hideFallbackOnLoad />
                {!isOwned ? <View style={styles.lockShade}><Text style={styles.lockIcon}>🔒</Text></View> : null}
              </View>
              <Text style={[styles.rarity, { color: RARITY_COLORS[skin.rarity] }]}>{t(`collection.rarity.${skin.rarity}`, lang)}</Text>
              <Text style={styles.skinName} numberOfLines={2}>{t(skin.nameKey, lang)}</Text>
              <Text style={styles.parentName} numberOfLines={1}>{monkey ? t(monkey.nameKey, lang) : ""}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${required > 0 ? (current / required) * 100 : 0}%`, backgroundColor: RARITY_COLORS[skin.rarity] }]} />
              </View>
              <View style={styles.fragmentProgressRow}>
                <FestivalFragmentIcon size={15} tint={RARITY_COLORS[skin.rarity]} />
                <Text style={styles.progressText}>{t("festival.progress", lang, { current, required })}</Text>
              </View>
              <Text style={[styles.status, isEquipped ? styles.equipped : null]}>
                {!parentOwned
                  ? t("collection.requiresNamedMonkey", lang, {
                      name: monkey ? t(monkey.nameKey, lang) : ""
                    })
                  : isEquipped
                    ? t("collection.equipped", lang)
                    : isOwned
                      ? t("collection.owned", lang)
                      : t("collection.locked", lang)}
              </Text>
            </SpringPressable>
          );
        })}
      </View>

      {__DEV__ ? (
        <View style={styles.devCard}>
          <Text style={styles.devTitle}>{t("festival.dev.title", lang)} • {seed}</Text>
          <View style={styles.devButtons}>
            <DevButton label={t("festival.dev.balance", lang)} onPress={addTestBalance} />
            <DevButton label={t("festival.dev.open", lang)} onPress={() => open(true)} />
            <DevButton label={t("festival.dev.seed", lang)} onPress={() => seedRng(123456789)} />
            <DevButton label={t("festival.dev.reset", lang)} onPress={resetProgress} />
          </View>
          <View style={styles.devButtons}>
            {FESTIVAL_RARITIES.map((rarity) => (
              <DevButton
                key={rarity}
                label={`${t("festival.dev.force", lang)} ${t(`collection.rarity.${rarity}`, lang)}`}
                onPress={() => open(true, DEV_RARITY_SEEDS[rarity])}
              />
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

function DevButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <SpringPressable onPress={onPress} style={styles.devButton}><Text style={styles.devButtonText}>{label}</Text></SpringPressable>;
}

const styles = StyleSheet.create({
  chestCard: { width: "100%", borderRadius: 18, borderWidth: 2, borderColor: "#f1b957", backgroundColor: "rgba(73, 33, 77, 0.96)", padding: 12, shadowColor: "#ff78cf", shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  eventRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  eventBadge: { color: "#fff2bd", fontSize: 12, fontFamily: theme.fonts.heavy },
  discountBadge: { color: "#32102d", backgroundColor: "#ffd65d", borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontFamily: theme.fonts.heavy },
  chestBody: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 8 },
  chestArtFrame: { width: 94, height: 90, alignItems: "center", justifyContent: "center" },
  chestGlow: { position: "absolute", width: 78, height: 78, borderRadius: 39, backgroundColor: "rgba(255, 116, 211, 0.3)" },
  chestArt: { width: 90, height: 84 },
  chestFallback: { fontSize: 50 },
  chestCopy: { flex: 1, minWidth: 0 },
  chestName: { color: "#fff7d6", fontSize: 18, fontFamily: theme.fonts.heavy },
  poolText: { color: "#e5c9e7", marginTop: 2, fontSize: 10, fontFamily: theme.fonts.bold },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 7 },
  pricePill: { flexDirection: "row", alignItems: "center", gap: 3 },
  gemIcon: { width: 18, height: 18 },
  regularPrice: { color: "#bca7b6", fontSize: 11, fontFamily: theme.fonts.bold, textDecorationLine: "line-through" },
  launchPrice: { color: "#9fe9ff", fontSize: 15, fontFamily: theme.fonts.heavy },
  openButton: { minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, borderColor: "#ffe07a", backgroundColor: "#a25b18" },
  disabledButton: { opacity: 0.55, backgroundColor: "#4e4b42" },
  openButtonText: { color: "#fff6cd", fontSize: 12, fontFamily: theme.fonts.heavy, textAlign: "center" },
  detailsCard: { width: "100%", borderRadius: 14, borderWidth: 1, borderColor: "rgba(244, 187, 94, 0.4)", backgroundColor: "rgba(35, 27, 38, 0.94)", padding: 10 },
  detailsTitle: { color: "#ffe09a", fontSize: 13, fontFamily: theme.fonts.heavy, marginBottom: 5 },
  oddsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 22 },
  oddsRarity: { fontSize: 10, fontFamily: theme.fonts.heavy },
  oddsValue: { color: "#ded5c8", fontSize: 9.5, fontFamily: theme.fonts.bold },
  poolRule: { marginTop: 6, color: "#bdaebc", fontSize: 9, lineHeight: 13, fontFamily: theme.fonts.bold },
  collectionHeader: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  collectionTitle: { color: "#fff0b5", fontSize: 15, fontFamily: theme.fonts.heavy },
  collectionCount: { color: "#fface1", fontSize: 11, fontFamily: theme.fonts.heavy },
  grid: { width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 9 },
  skinCard: { width: "48.5%", minHeight: 272, borderRadius: 15, borderWidth: 1.5, backgroundColor: "rgba(37, 26, 39, 0.98)", padding: 8, overflow: "hidden" },
  skinArtFrame: { width: "100%", height: 126, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 1, backgroundColor: "rgba(7, 12, 9, 0.72)", overflow: "hidden" },
  skinArt: { width: "100%", height: "100%" },
  skinFallback: { fontSize: 52 },
  lockShade: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(6, 7, 7, 0.48)" },
  lockIcon: { fontSize: 24 },
  rarity: { marginTop: 5, fontSize: 8.5, fontFamily: theme.fonts.heavy, textTransform: "uppercase" },
  skinName: { minHeight: 30, color: "#fff3cf", fontSize: 11, lineHeight: 14, fontFamily: theme.fonts.heavy },
  parentName: { color: "#b8a6b8", fontSize: 8.5, fontFamily: theme.fonts.bold },
  progressTrack: { height: 7, marginTop: 7, borderRadius: 4, backgroundColor: "rgba(4, 7, 6, 0.8)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  fragmentProgressRow: { minHeight: 18, flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  progressText: { color: "#e3d7c7", fontSize: 8.5, fontFamily: theme.fonts.bold },
  status: { marginTop: 5, color: "#c7b9c5", fontSize: 8.5, fontFamily: theme.fonts.heavy },
  equipped: { color: "#85f2aa" },
  devCard: { width: "100%", borderRadius: 12, borderWidth: 1, borderColor: "#5e87a3", backgroundColor: "rgba(16, 35, 48, 0.9)", padding: 9 },
  devTitle: { color: "#bfe9ff", fontSize: 10, fontFamily: theme.fonts.heavy, marginBottom: 7 },
  devButtons: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  devButton: { minHeight: 30, justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#80b4d2", backgroundColor: "#274d63", paddingHorizontal: 8 },
  devButtonText: { color: "#e8f7ff", fontSize: 8.5, fontFamily: theme.fonts.heavy }
});
