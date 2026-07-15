import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { NineSliceFrame } from "./NineSliceFrame";
import { SpringPressable } from "./SpringPressable";
import { WoodButton } from "./WoodButton";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { RAID_CAMPS, campName, strongholdCamp, type RaidCamp } from "../../game/config/camps";
import { TROOP_TYPES, raidRisk } from "../../game/config/troops";
import { t } from "../../game/i18n";
import type { Lang, TroopType } from "../../game/types/game";
import { theme } from "../../theme/theme";

type RaidMapScreenProps = {
  troopCounts: Record<TroopType, number>;
  housingUsed: number;
  housingCapacity: number;
  armyPower: number;
  trainingNestLevel: number;
  raidLevel: number;
  watchTowerLevel: number;
  lang: Lang;
  onAttack: (campId: string) => void;
  onClose: () => void;
};

export function RaidMapScreen({ troopCounts, housingUsed, housingCapacity, armyPower, trainingNestLevel, raidLevel, watchTowerLevel, lang, onAttack, onClose }: RaidMapScreenProps) {
  const [confirmCamp, setConfirmCamp] = useState<RaidCamp | null>(null);
  const fighterCount = Object.values(troopCounts).reduce((sum, count) => sum + count, 0);
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
          const locked = trainingNestLevel < camp.requiredTrainingNestLevel;
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
              <Text style={styles.scoutingLine}>{t("raidmap.armyPower", lang, { n: armyPower })}</Text>
              <Text style={styles.scoutingLine}>{t("raidmap.enemyPower", lang, { n: camp.enemyPower })}</Text>
              <Text style={styles.scoutingLine}>{t("raidmap.recommendedPower", lang, { n: camp.recommendedPower })}</Text>
              <Text style={styles.riskLine}>{t(`raid.risk.${raidRisk(armyPower, camp.recommendedPower)}`, lang)}</Text>
              {locked ? <Text style={styles.scoutingLocked}>{t("raidmap.unlockNest", lang, { level: camp.requiredTrainingNestLevel })}</Text> : null}
              {watchTowerLevel >= 5 ? <Text style={styles.scoutingLine}>{t("raidmap.compositionFull", lang, {
                fighters: camp.defenders.fighter,
                guardians: camp.defenders.shield_guardian,
                archers: camp.defenders.archer,
                crossbows: camp.defenders.crossbowman
              })}</Text> : null}
              {watchTowerLevel >= 4 ? <View style={styles.lootRow}>
                <LootChip assetKey="resourceBanana" amount={camp.loot.bananas} />
                <LootChip assetKey="resourceWood" amount={camp.loot.wood} />
                <LootChip assetKey="resourceStone" amount={camp.loot.stones} />
              </View> : <Text style={styles.scoutingLocked}>{t("raidmap.rewardsLocked", lang)}</Text>}
            </View>

            <SpringPressable
              accessibilityRole="button"
              accessibilityState={{ disabled: noFighters || locked }}
              disabled={noFighters || locked}
              onPress={() => setConfirmCamp(camp)}
              style={[styles.attackButton, noFighters || locked ? styles.attackButtonDisabled : null]}
            >
              <NineSliceFrame preset="attackPlaque" cornerSize={18} style={StyleSheet.absoluteFill} />
              <Text style={styles.attackText} numberOfLines={1} maxFontSizeMultiplier={theme.maxFontScale}>
                {noFighters ? t("raidmap.needFighter", lang) : locked ? t("raidmap.locked", lang) : t("raidmap.attack", lang)}
              </Text>
            </SpringPressable>
          </View>
          </View>
          );
        })}
      </ScrollView>

      <WoodButton label={t("raidmap.close", lang)} onPress={onClose} />
      <Modal visible={confirmCamp !== null} transparent animationType="fade" onRequestClose={() => setConfirmCamp(null)}>
        <View style={styles.confirmScrim}>
          {confirmCamp ? <View style={styles.confirmCard}>
            <NineSliceFrame preset="card" cornerSize={26} style={StyleSheet.absoluteFill} />
            <Text style={styles.confirmTitle}>{campName(confirmCamp.id, lang)}</Text>
            <View style={styles.confirmStats}>
              <Text style={styles.confirmStat}>{t("trainingNest.armyCapacity", lang, { used: housingUsed, max: housingCapacity })}</Text>
              <Text style={styles.confirmStat}>{t("raidmap.armyPower", lang, { n: armyPower })}</Text>
              <Text style={styles.confirmStat}>{t("raidmap.enemyPower", lang, { n: confirmCamp.enemyPower })}</Text>
              <Text style={styles.confirmStat}>{t("raidmap.recommendedPower", lang, { n: confirmCamp.recommendedPower })}</Text>
            </View>
            <Text style={styles.confirmRisk}>{t(`raid.risk.${raidRisk(armyPower, confirmCamp.recommendedPower)}`, lang)}</Text>
            <Text style={styles.confirmWarning}>{t("raid.confirm.warning", lang)}</Text>
            <View style={styles.rosterRow}>
              {TROOP_TYPES.filter((type) => troopCounts[type] > 0).map((type) => <View key={type} style={styles.rosterChip}>
                <AssetImage assetKey={type === "fighter" ? "unitWarrior" : type === "archer" ? "unitArcher" : type === "shield_guardian" ? "unitShieldGuardian" : "unitCrossbowman"} style={styles.rosterIcon} fallback={<View />} />
                <Text style={styles.rosterText}>{troopCounts[type]}× {t(`unit.${type}`, lang)}</Text>
              </View>)}
            </View>
            <View style={styles.confirmActions}>
              <WoodButton label={t("raid.confirm.cancel", lang)} onPress={() => setConfirmCamp(null)} />
              <WoodButton label={t("raid.confirm.continue", lang)} onPress={() => {
                const id = confirmCamp.id;
                setConfirmCamp(null);
                onAttack(id);
              }} primary />
            </View>
          </View> : null}
        </View>
      </Modal>
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
  riskLine: { marginTop: 3, color: "#ffd95a", fontSize: 10.5, fontFamily: theme.fonts.heavy },
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
  },
  confirmScrim: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,12,8,0.82)", padding: 18 },
  confirmCard: { width: "100%", maxWidth: 370, borderRadius: 20, backgroundColor: "#f4df9e", padding: 24, overflow: "hidden" },
  confirmTitle: { color: theme.colors.ink, fontSize: 20, textAlign: "center", fontFamily: theme.fonts.heavy },
  confirmStats: { marginTop: 12, gap: 3 },
  confirmStat: { color: "#4b3b24", fontSize: 13, fontFamily: theme.fonts.bold },
  confirmRisk: { marginTop: 10, color: "#8a2f1e", fontSize: 18, textAlign: "center", fontFamily: theme.fonts.heavy },
  confirmWarning: { marginTop: 4, color: "#5b4930", fontSize: 12, textAlign: "center", fontFamily: theme.fonts.bold },
  rosterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  rosterChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, backgroundColor: "rgba(91,61,27,0.12)", paddingHorizontal: 7, paddingVertical: 4 },
  rosterIcon: { width: 28, height: 28 },
  rosterText: { color: theme.colors.ink, fontSize: 10, fontFamily: theme.fonts.heavy },
  confirmActions: { flexDirection: "row", gap: 8, marginTop: 16 }
});
