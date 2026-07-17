import { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { NineSliceFrame } from "./NineSliceFrame";
import { SpringPressable } from "./SpringPressable";
import { WoodButton } from "./WoodButton";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { RAID_CAMPS, campName, strongholdCamp, type RaidCamp } from "../../game/config/camps";
import {
  TROOPS,
  TROOP_TYPES,
  armyPower,
  raidRisk,
  troopCountByType
} from "../../game/config/troops";
import { t } from "../../game/i18n";
import {
  bestRaidArmySelection,
  emptyRaidArmySelection,
  estimatedRaidLossRange,
  raidRiskBand,
  raidSelectionStats
} from "../../game/state/raidArmy";
import type { Lang, RaidArmySelection, TroopType, Unit } from "../../game/types/game";
import { theme } from "../../theme/theme";

type RaidMapScreenProps = {
  units: Unit[];
  housingCapacity: number;
  trainingNestLevel: number;
  raidLevel: number;
  watchTowerLevel: number;
  lang: Lang;
  onAttack: (campId: string, selection: RaidArmySelection) => void;
  onClose: () => void;
};

export function RaidMapScreen({ units, housingCapacity, trainingNestLevel, raidLevel, watchTowerLevel, lang, onAttack, onClose }: RaidMapScreenProps) {
  const [confirmCamp, setConfirmCamp] = useState<RaidCamp | null>(null);
  const [selection, setSelection] = useState<RaidArmySelection>(emptyRaidArmySelection);
  const troopCounts = useMemo(() => troopCountByType(units), [units]);
  const fullArmyPower = useMemo(() => armyPower(units), [units]);
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
              <Text style={styles.scoutingLine}>{t("raidmap.armyPower", lang, { n: fullArmyPower })}</Text>
              <Text style={styles.scoutingLine}>{t("raidmap.enemyPower", lang, { n: camp.enemyPower })}</Text>
              <Text style={styles.scoutingLine}>{t("raidmap.recommendedPower", lang, { n: camp.recommendedPower })}</Text>
              <Text style={styles.riskLine}>{t(`raid.risk.${raidRisk(fullArmyPower, camp.recommendedPower)}`, lang)}</Text>
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
              onPress={() => {
                setSelection(emptyRaidArmySelection());
                setConfirmCamp(camp);
              }}
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
          {confirmCamp ? (
            <ArmySelectionCard
              camp={confirmCamp}
              units={units}
              troopCounts={troopCounts}
              capacity={housingCapacity}
              selection={selection}
              lang={lang}
              onChange={setSelection}
              onCancel={() => setConfirmCamp(null)}
              onContinue={() => {
                const id = confirmCamp.id;
                setConfirmCamp(null);
                onAttack(id, selection);
              }}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function ArmySelectionCard({
  camp,
  units,
  troopCounts,
  capacity,
  selection,
  lang,
  onChange,
  onCancel,
  onContinue
}: {
  camp: RaidCamp;
  units: Unit[];
  troopCounts: Record<TroopType, number>;
  capacity: number;
  selection: RaidArmySelection;
  lang: Lang;
  onChange: (selection: RaidArmySelection) => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const stats = useMemo(() => raidSelectionStats(units, selection), [selection, units]);
  const risk = raidRiskBand(stats.power, camp.recommendedPower);
  const lossRange = estimatedRaidLossRange(
    stats.count,
    stats.power,
    camp.recommendedPower
  );

  function change(type: TroopType, delta: number) {
    const next = Math.max(0, Math.min(troopCounts[type], selection[type] + delta));
    if (delta > 0 && stats.housing + TROOPS[type].housing > capacity) return;
    onChange({ ...selection, [type]: next });
  }

  return (
    <View style={styles.confirmCard}>
      <NineSliceFrame preset="card" cornerSize={26} style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.confirmScroll}
        contentContainerStyle={styles.confirmContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.confirmEyebrow}>{t("raid.confirm.eyebrow", lang)}</Text>
        <Text style={styles.confirmTitle}>{campName(camp.id, lang)}</Text>

        <View style={styles.confirmSummary}>
          <SummaryCell
            label={t("raid.confirm.armyCount", lang)}
            value={`${stats.count} · ${stats.housing}/${capacity}`}
          />
          <SummaryCell label={t("trainingNest.armyPowerLabel", lang)} value={stats.power} />
          <SummaryCell label={t("raid.confirm.enemyPower", lang)} value={camp.enemyPower} />
          <SummaryCell label={t("raid.confirm.recommended", lang)} value={camp.recommendedPower} />
        </View>

        <View style={[styles.riskBadge, styles[`riskBadge_${risk}`]]}>
          <Text style={styles.riskBadgeText}>{t(`raid.riskBand.${risk}`, lang)}</Text>
          <Text style={styles.lossEstimate}>
            {t("raid.confirm.estimatedLoss", lang, {
              min: lossRange.min,
              max: lossRange.max
            })}
          </Text>
        </View>

        <View style={styles.selectorHeader}>
          <Text style={styles.selectorTitle}>{t("raid.confirm.chooseArmy", lang)}</Text>
          <Text style={styles.selectorCapacity}>
            {t("raid.confirm.capacity", lang, { used: stats.housing, max: capacity })}
          </Text>
        </View>

        <View style={styles.selectorList}>
          {TROOP_TYPES.map((type) => {
            const canSubtract = selection[type] > 0;
            const canAdd =
              selection[type] < troopCounts[type] &&
              stats.housing + TROOPS[type].housing <= capacity;
            return (
              <View key={type} style={styles.selectorRow}>
                <AssetImage
                  assetKey={TROOPS[type].artwork}
                  style={styles.selectorIcon}
                  fallback={<View style={styles.selectorIconFallback} />}
                />
                <View style={styles.selectorCopy}>
                  <Text style={styles.selectorName} numberOfLines={1}>
                    {t(`unit.${type}`, lang)}
                  </Text>
                  <Text style={styles.selectorOwned}>
                    {t("raid.confirm.available", lang, { n: troopCounts[type] })} · {TROOPS[type].housing} {t("raid.confirm.space", lang)}
                  </Text>
                </View>
                <CountButton
                  label="−"
                  disabled={!canSubtract}
                  accessibilityLabel={t("raid.confirm.remove", lang, { unit: t(`unit.${type}`, lang) })}
                  onPress={() => change(type, -1)}
                />
                <Text style={styles.selectedCount}>{selection[type]}</Text>
                <CountButton
                  label="+"
                  disabled={!canAdd}
                  accessibilityLabel={t("raid.confirm.add", lang, { unit: t(`unit.${type}`, lang) })}
                  onPress={() => change(type, 1)}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.quickActions}>
          <SpringPressable
            accessibilityRole="button"
            onPress={() => onChange(bestRaidArmySelection(units, capacity))}
            style={styles.quickButton}
          >
            <Text style={styles.quickButtonText}>{t("raid.confirm.bestArmy", lang)}</Text>
          </SpringPressable>
          <SpringPressable
            accessibilityRole="button"
            onPress={() => onChange(emptyRaidArmySelection())}
            style={styles.quickButton}
          >
            <Text style={styles.quickButtonText}>{t("raid.confirm.clear", lang)}</Text>
          </SpringPressable>
        </View>

        <View style={styles.confirmWarningCard}>
          <Text style={styles.confirmWarning}>{t("raid.confirm.warningShort", lang)}</Text>
        </View>

        <View style={styles.confirmActions}>
          <BambooAction label={t("raid.confirm.cancel", lang)} onPress={onCancel} />
          <BambooAction
            label={t("raid.confirm.continue", lang)}
            onPress={onContinue}
            primary
            disabled={stats.count <= 0}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryCell({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function CountButton({
  label,
  disabled,
  accessibilityLabel,
  onPress
}: {
  label: string;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={[styles.countButton, disabled ? styles.countButtonDisabled : null]}
    >
      <Text style={styles.countButtonText}>{label}</Text>
    </SpringPressable>
  );
}

function BambooAction({
  label,
  onPress,
  primary,
  disabled
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <SpringPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.bambooAction,
        primary ? styles.bambooActionPrimary : null,
        disabled ? styles.bambooActionDisabled : null
      ]}
    >
      <NineSliceFrame preset="woodButton" cornerSize={20} style={StyleSheet.absoluteFill} />
      <Text style={styles.bambooActionText} numberOfLines={1}>{label}</Text>
    </SpringPressable>
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
  confirmScrim: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,12,8,0.82)", padding: 12 },
  confirmCard: { width: "100%", maxWidth: 390, maxHeight: "94%", borderRadius: 20, backgroundColor: "#f4df9e", overflow: "hidden" },
  confirmScroll: { width: "100%" },
  confirmContent: { padding: 18, paddingBottom: 16 },
  confirmEyebrow: { color: "#88602b", fontSize: 10, textAlign: "center", letterSpacing: 1.2, fontFamily: theme.fonts.heavy },
  confirmTitle: { marginTop: 2, color: theme.colors.ink, fontSize: 20, textAlign: "center", fontFamily: theme.fonts.heavy },
  confirmSummary: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  summaryCell: { width: "48%", flexGrow: 1, borderRadius: 10, backgroundColor: "rgba(75,51,24,0.10)", paddingHorizontal: 9, paddingVertical: 7 },
  summaryLabel: { color: "#72522c", fontSize: 9, fontFamily: theme.fonts.bold },
  summaryValue: { color: theme.colors.ink, fontSize: 15, fontFamily: theme.fonts.heavy },
  riskBadge: { marginTop: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  riskBadge_safe: { backgroundColor: "rgba(50,130,70,0.14)", borderColor: "rgba(50,130,70,0.42)" },
  riskBadge_balanced: { backgroundColor: "rgba(203,151,45,0.16)", borderColor: "rgba(158,112,24,0.48)" },
  riskBadge_risky: { backgroundColor: "rgba(199,102,34,0.15)", borderColor: "rgba(175,75,24,0.48)" },
  riskBadge_veryRisky: { backgroundColor: "rgba(165,43,34,0.15)", borderColor: "rgba(165,43,34,0.52)" },
  riskBadgeText: { color: "#5a351c", fontSize: 14, textAlign: "center", fontFamily: theme.fonts.heavy },
  lossEstimate: { marginTop: 1, color: "#6a4b2c", fontSize: 10, textAlign: "center", fontFamily: theme.fonts.bold },
  selectorHeader: { marginTop: 11, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  selectorTitle: { flex: 1, color: theme.colors.ink, fontSize: 14, fontFamily: theme.fonts.heavy },
  selectorCapacity: { color: "#76532a", fontSize: 10, fontFamily: theme.fonts.bold },
  selectorList: { marginTop: 5, gap: 5 },
  selectorRow: { minHeight: 52, flexDirection: "row", alignItems: "center", borderRadius: 11, backgroundColor: "rgba(91,61,27,0.11)", paddingHorizontal: 6 },
  selectorIcon: { width: 42, height: 42 },
  selectorIconFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(91,61,27,0.2)" },
  selectorCopy: { flex: 1, minWidth: 0, paddingHorizontal: 5 },
  selectorName: { color: theme.colors.ink, fontSize: 11, fontFamily: theme.fonts.heavy },
  selectorOwned: { marginTop: 1, color: "#765b36", fontSize: 8.5, fontFamily: theme.fonts.bold },
  countButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(83,57,27,0.42)", backgroundColor: "rgba(255,242,190,0.68)" },
  countButtonDisabled: { opacity: 0.32 },
  countButtonText: { color: "#4c3018", fontSize: 22, lineHeight: 25, fontFamily: theme.fonts.heavy },
  selectedCount: { width: 30, color: theme.colors.ink, fontSize: 17, textAlign: "center", fontFamily: theme.fonts.heavy },
  quickActions: { flexDirection: "row", gap: 6, marginTop: 8 },
  quickButton: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "rgba(102,70,30,0.35)", backgroundColor: "rgba(89,125,51,0.15)", paddingHorizontal: 6 },
  quickButtonText: { color: "#4f3a20", fontSize: 10, textAlign: "center", fontFamily: theme.fonts.heavy },
  confirmWarningCard: { marginTop: 8, borderRadius: 9, borderWidth: 1, borderColor: "rgba(170,55,42,0.48)", backgroundColor: "rgba(170,55,42,0.12)", paddingHorizontal: 9, paddingVertical: 6 },
  confirmWarning: { color: "#9b3327", fontSize: 10, textAlign: "center", fontFamily: theme.fonts.heavy },
  confirmActions: { flexDirection: "row", gap: 8, marginTop: 9 },
  bambooAction: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, overflow: "hidden", paddingHorizontal: 8 },
  bambooActionPrimary: { shadowColor: "#5b3518", shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  bambooActionDisabled: { opacity: 0.42 },
  bambooActionText: { color: theme.colors.paper, fontSize: 13, textAlign: "center", fontFamily: theme.fonts.heavy, textShadowColor: "rgba(44,24,9,0.9)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }
});
