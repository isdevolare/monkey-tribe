import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { NineSliceFrame } from "./NineSliceFrame";
import { SpringPressable } from "./SpringPressable";
import { WoodButton } from "./WoodButton";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { RAID_CAMPS, campName, strongholdCamp } from "../../game/config/camps";
import { t } from "../../game/i18n";
import type { Lang } from "../../game/types/game";
import { theme } from "../../theme/theme";

type RaidMapScreenProps = {
  fighterCount: number;
  raidLevel: number;
  watchTowerLevel: number;
  lang: Lang;
  onAttack: (campId: string) => void;
  onClose: () => void;
};

export function RaidMapScreen({ fighterCount, raidLevel, watchTowerLevel, lang, onAttack, onClose }: RaidMapScreenProps) {
  const noFighters = fighterCount <= 0;
  // The endless stronghold sits after the handcrafted camps and levels up
  // every time the player razes it.
  const camps = [...RAID_CAMPS, strongholdCamp(raidLevel)];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("raidmap.title", lang)}</Text>
        <Text style={styles.subtitle}>{t("raidmap.ready", lang, { n: fighterCount })}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {camps.map((camp, index) => {
          const endless = camp.id.startsWith("stronghold-");
          const tier2 = camp.tier === 2;
          const firstTier2 = tier2 && camps[index - 1]?.tier !== 2;
          // Same tier language as the village: higher camps loom larger.
          const artScale = 0.82 + Math.min(camp.level, 7) * 0.05;
          return (
          <View key={camp.id}>
          {firstTier2 ? (
            <View style={styles.tierDivider}>
              <Text style={styles.tierDividerText} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("raidmap.tier2", lang)}
              </Text>
              <Text style={styles.tierDividerNote} maxFontSizeMultiplier={theme.maxFontScale}>
                {t("raidmap.tier2Note", lang)}
              </Text>
            </View>
          ) : null}
          <View style={[styles.card, tier2 ? styles.cardTier2 : null, endless ? styles.cardEndless : null]}>
            <View style={styles.cardArt}>
              {endless ? <View style={styles.artGlow} /> : null}
              <AssetImage
                assetKey="buildingEnemyCamp"
                style={[styles.cardArtImage, { transform: [{ scale: artScale }] }]}
                fallback={<View style={styles.cardArtFallback} />}
              />
              {camp.level >= 2 ? <WarBanner right={4} /> : null}
              {camp.level >= 5 ? <WarBanner right={17} small /> : null}
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText}>{t("common.levelShort", lang)} {camp.level}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text
                style={styles.campName}
                numberOfLines={2}
                maxFontSizeMultiplier={theme.maxFontScale}
              >
                {campName(camp.id, lang)}
              </Text>
              {endless ? (
                <Text
                  style={styles.endlessNote}
                  numberOfLines={2}
                  maxFontSizeMultiplier={theme.maxFontScale}
                >
                  {t("raidmap.endless", lang)}
                </Text>
              ) : null}
              {watchTowerLevel >= 3 ? <Text style={styles.scoutingLine}>{t("raidmap.recommendedPower", lang, { n: Math.round(camp.campHp + camp.enemyCount * camp.enemyHp) })}</Text> : null}
              {watchTowerLevel >= 5 ? <Text style={styles.scoutingLine}>{t("raidmap.composition", lang, { melee: Math.max(0, camp.enemyCount - (camp.archerCount ?? 0)), archers: camp.archerCount ?? 0 })}</Text> : null}
              {watchTowerLevel >= 4 ? <View style={styles.lootRow}>
                <LootChip assetKey="resourceBanana" amount={camp.loot.bananas} />
                <LootChip assetKey="resourceWood" amount={camp.loot.wood} />
                <LootChip assetKey="resourceStone" amount={camp.loot.stones} />
              </View> : <Text style={styles.scoutingLocked}>{t("raidmap.rewardsLocked", lang)}</Text>}
            </View>

            <SpringPressable
              accessibilityRole="button"
              accessibilityState={{ disabled: noFighters }}
              disabled={noFighters}
              onPress={() => onAttack(camp.id)}
              style={[styles.attackButton, noFighters ? styles.attackButtonDisabled : null]}
            >
              <NineSliceFrame preset="attackPlaque" cornerSize={18} style={StyleSheet.absoluteFill} />
              <Text style={styles.attackText} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
                {noFighters ? t("raidmap.needFighter", lang) : t("raidmap.attack", lang)}
              </Text>
            </SpringPressable>
          </View>
          </View>
          );
        })}
      </ScrollView>

      <WoodButton label={t("raidmap.close", lang)} onPress={onClose} />
    </View>
  );
}

// Small enemy war pennant planted on tougher camps.
function WarBanner({ right, small }: { right: number; small?: boolean }) {
  return (
    <View style={[styles.warBanner, { right, width: small ? 11 : 14, height: small ? 22 : 28 }]}>
      <Svg width="100%" height="100%" viewBox="0 0 20 34">
        <Line x1="4" y1="2" x2="4" y2="32" stroke="#3a1c12" strokeWidth="2.6" />
        <Path d="M5 3 L18 7.5 L5 12 Z" fill="#c84a3a" stroke="#7f2d25" strokeWidth="1" />
      </Svg>
    </View>
  );
}

function LootChip({ assetKey, amount }: { assetKey: GameAssetKey; amount: number }) {
  return (
    <View style={styles.lootChip}>
      <AssetImage assetKey={assetKey} style={styles.lootIcon} fallback={<View style={styles.lootIconFallback} />} />
      <Text style={styles.lootText} maxFontSizeMultiplier={theme.maxFontScale}>{amount}</Text>
    </View>
  );
}

const glass = "rgba(17, 20, 14, 0.82)";

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.4)",
    backgroundColor: "rgba(60, 22, 16, 0.88)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
  },
  title: {
    color: theme.colors.paper,
    fontSize: 16,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  subtitle: {
    color: "#e7b9a0",
    fontSize: 12,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  list: {
    gap: theme.spacing.sm,
    paddingBottom: 2
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.32)",
    backgroundColor: glass,
    padding: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  cardEndless: {
    borderColor: "rgba(216, 106, 84, 0.6)",
    backgroundColor: "rgba(46, 18, 13, 0.86)"
  },
  cardTier2: {
    borderColor: "rgba(200, 74, 58, 0.5)",
    backgroundColor: "rgba(38, 16, 12, 0.82)"
  },
  tierDivider: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: "rgba(200, 74, 58, 0.45)"
  },
  tierDividerText: {
    color: "#f0a381",
    fontSize: 13,
    letterSpacing: 1.2,
    fontFamily: theme.fonts.heavy
  },
  tierDividerNote: {
    marginTop: 1,
    color: "#c9a68b",
    fontSize: 11,
    fontFamily: theme.fonts.bold
  },
  endlessNote: {
    marginTop: 1,
    color: "#e7b9a0",
    fontSize: 10.5,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  scoutingLine: { marginTop: 2, color: "#d9c58e", fontSize: 9.5, fontFamily: theme.fonts.bold },
  scoutingLocked: { marginTop: 5, color: "#9d8d75", fontSize: 9.5, fontFamily: theme.fonts.bold },
  cardArt: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.45)",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.25)"
  },
  cardArtImage: {
    width: "100%",
    height: "100%"
  },
  cardArtFallback: {
    flex: 1,
    backgroundColor: "#7f2d25"
  },
  artGlow: {
    position: "absolute",
    left: "10%",
    right: "10%",
    top: "30%",
    bottom: "4%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 120, 40, 0.22)",
    shadowColor: "#ff7828",
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 }
  },
  warBanner: {
    position: "absolute",
    top: 1
  },
  levelTag: {
    position: "absolute",
    left: 3,
    top: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(243, 210, 122, 0.8)",
    backgroundColor: "rgba(20, 12, 4, 0.78)",
    paddingHorizontal: 5,
    paddingVertical: 1
  },
  levelTagText: {
    color: "#ffd95a",
    fontSize: 10,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  cardBody: {
    flex: 1,
    minWidth: 0
  },
  campName: {
    color: theme.colors.paper,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  lootRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6
  },
  lootChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  lootIcon: {
    width: 18,
    height: 18
  },
  lootIconFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 224, 151, 0.4)"
  },
  lootText: {
    color: "#ffe9ad",
    fontSize: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  attackButton: {
    minWidth: 96,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(122, 52, 14, 0.95)",
    backgroundColor: "#a34a10",
    overflow: "hidden",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
  },
  attackButtonDisabled: {
    opacity: 0.55
  },
  // Crop the attack plaque art to its stone body (the source PNG carries a
  // baked-in backdrop and a totem crest that don't fit a small button).
  attackArt: {
    position: "absolute",
    top: "-62%",
    left: "-11%",
    width: "122%",
    height: "196%"
  },
  attackArtFallback: {
    flex: 1,
    backgroundColor: "transparent"
  },
  attackText: {
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textShadowColor: "rgba(60, 20, 4, 0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2
  }
});
