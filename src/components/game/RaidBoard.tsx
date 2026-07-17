import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import Svg, { Circle, Ellipse, Line, Path } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { SpringPressable } from "./SpringPressable";
import { WoodButton } from "./WoodButton";
import { LivelyUnit } from "./LivelyUnit";
import { Confetti, SparkBurst } from "./Vfx";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { t } from "../../game/i18n";
import type { Lang, RaidArmyResult, RaidGemRewardReason, RaidPenalty, RaidStatus, Resources, TroopType, Unit } from "../../game/types/game";
import { calculateTroopPower, isTroopType } from "../../game/config/troops";
import { theme } from "../../theme/theme";

type RaidBoardProps = {
  units: Unit[];
  enemyCampHp: number;
  enemyCampMaxHp: number;
  raidStatus: RaidStatus;
  stars: number;
  loot: Resources;
  discardedLoot: Resources;
  rewardMultiplier: number;
  gemReward: number;
  gemRewardReason: RaidGemRewardReason;
  activeRaidUnitIds: string[];
  penalty: RaidPenalty | null;
  armyResult: RaidArmyResult | null;
  playerIdentityAsset: GameAssetKey;
  lang: Lang;
  feedbackText?: string;
  maxSize?: number;
  /** New stronghold level after a stronghold win; shows the level-up callout. */
  strongholdLevelUp?: number | null;
  /** Camp tier — higher-level camps render visibly bigger. */
  campLevel?: number;
  onReturn: () => void;
  onRetreat: () => void;
};

type Spot = { x: number; y: number };

type DamageMarker = {
  id: number;
  x: number;
  y: number;
  amount: number;
  tone: "ally" | "enemy" | "camp";
};

const fighterSpots: Spot[] = [
  { x: 24, y: 66 },
  { x: 34, y: 72 },
  { x: 28, y: 82 },
  { x: 42, y: 78 }, { x: 18, y: 75 }, { x: 38, y: 62 }, { x: 48, y: 70 },
  { x: 20, y: 88 }, { x: 35, y: 90 }, { x: 50, y: 86 }, { x: 12, y: 65 }, { x: 46, y: 58 }
];

const enemySpots: Spot[] = [
  { x: 72, y: 42 },
  { x: 82, y: 53 },
  { x: 67, y: 60 }, { x: 88, y: 40 }, { x: 76, y: 62 }, { x: 60, y: 48 },
  { x: 90, y: 65 }, { x: 58, y: 68 }, { x: 82, y: 30 }
];

const CAMP_CENTER: Spot = { x: 73, y: 37 };
const STRIKE_WINDOW_MS = 220;
const DAMAGE_X_OFFSETS = [-5, 4, -2, 6, 0] as const;

export function RaidBoard({
  units,
  enemyCampHp,
  enemyCampMaxHp,
  raidStatus,
  stars,
  loot,
  discardedLoot,
  rewardMultiplier,
  gemReward,
  gemRewardReason,
  activeRaidUnitIds,
  penalty,
  armyResult,
  playerIdentityAsset,
  lang,
  feedbackText,
  maxSize = 430,
  strongholdLevelUp,
  campLevel = 1,
  onReturn,
  onRetreat
}: RaidBoardProps) {
  const { width } = useWindowDimensions();
  const sceneWidth = Math.min(width - theme.spacing.lg * 2, maxSize);
  const sceneHeight = sceneWidth * 1.06;
  const activeRaidIds = new Set(activeRaidUnitIds);
  const deployed = units.filter(
    (unit) => unit.owner === "player" && activeRaidIds.has(unit.id) && isTroopType(unit.type)
  );
  const fighters = units.filter(
    (unit) =>
      unit.owner === "player" &&
      activeRaidIds.has(unit.id) &&
      isTroopType(unit.type) &&
      unit.state !== "dead" &&
      unit.hp > 0
  );
  const enemies = units.filter(
    (unit) => unit.owner === "enemy" && unit.state !== "dead" && unit.hp > 0
  );
  const raidPower = fighters.reduce(
    (total, unit) => total + calculateTroopPower(unit.type as TroopType, unit),
    0
  );
  const armyHp = deployed.reduce((total, unit) => total + Math.max(0, unit.hp), 0);
  const armyMaxHp = deployed.reduce((total, unit) => total + unit.maxHp, 0);
  const resultVisible =
    raidStatus === "victory" || raidStatus === "defeat" || raidStatus === "retreat";
  const victory = raidStatus === "victory";
  const retreated = raidStatus === "retreat";

  // Map each visible unit to its screen spot so damage feedback can be placed.
  const spotRef = useRef<Record<string, Spot>>({});
  fighters.forEach((unit, index) => {
    spotRef.current[unit.id] = fighterSpots[index % fighterSpots.length] ?? { x: 24, y: 66 };
  });
  enemies.forEach((unit, index) => {
    spotRef.current[unit.id] = enemySpots[index % enemySpots.length] ?? { x: 72, y: 42 };
  });

  const prevHpRef = useRef<Record<string, number>>({});
  const prevCampRef = useRef(enemyCampHp);
  const markerSeq = useRef(0);
  const [markers, setMarkers] = useState<DamageMarker[]>([]);

  const campFlash = useRef(new Animated.Value(0)).current;
  const campShake = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  // Units deploy with lastActionAt = now, so skip strike glows briefly to
  // avoid every unit flashing at once on the first frame of the raid.
  const mountedAtRef = useRef(Date.now());
  const settled = Date.now() - mountedAtRef.current > 300;

  const removeMarker = useCallback((id: number) => {
    setMarkers((current) => current.filter((marker) => marker.id !== id));
  }, []);

  const punchCamp = useCallback(() => {
    campFlash.setValue(0.85);
    Animated.timing(campFlash, { toValue: 0, duration: 380, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(campShake, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(campShake, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(campShake, { toValue: 0, duration: 55, useNativeDriver: true })
    ]).start();
  }, [campFlash, campShake]);

  // Detect HP drops between ticks and spawn floating damage numbers.
  useEffect(() => {
    const fresh: DamageMarker[] = [];

    for (const unit of units) {
      const previous = prevHpRef.current[unit.id];
      prevHpRef.current[unit.id] = unit.hp;

      if (previous === undefined || unit.hp >= previous) {
        continue;
      }

      const spot = spotRef.current[unit.id];
      if (spot) {
        markerSeq.current += 1;
        const xOffset = DAMAGE_X_OFFSETS[markerSeq.current % DAMAGE_X_OFFSETS.length] ?? 0;
        fresh.push({
          id: markerSeq.current,
          x: spot.x + xOffset,
          y: spot.y - 7,
          amount: previous - unit.hp,
          tone: unit.owner === "player" ? "ally" : "enemy"
        });
      }
    }

    if (enemyCampHp < prevCampRef.current) {
      markerSeq.current += 1;
      const xOffset = DAMAGE_X_OFFSETS[markerSeq.current % DAMAGE_X_OFFSETS.length] ?? 0;
      fresh.push({
        id: markerSeq.current,
        x: CAMP_CENTER.x + xOffset,
        y: CAMP_CENTER.y - 4,
        amount: prevCampRef.current - enemyCampHp,
        tone: "camp"
      });
      punchCamp();
    }
    prevCampRef.current = enemyCampHp;

    if (fresh.length > 0) {
      setMarkers((current) => [...current, ...fresh].slice(-24));
    }
  }, [units, enemyCampHp, punchCamp]);

  // Animate the result panel in when the raid ends.
  useEffect(() => {
    if (resultVisible) {
      resultAnim.setValue(0);
      Animated.timing(resultAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true
      }).start();
    }
  }, [resultVisible, resultAnim]);

  const campTranslate = campShake.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] });
  // Sv 1 patrol stays small; each camp tier grows ~7%, capped at +42%.
  const campScale = 1 + Math.min(Math.max(campLevel - 1, 0), 6) * 0.07;
  const resultScale = resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });

  return (
    <View style={[styles.scene, { width: sceneWidth, height: sceneHeight }]}>
      <AssetImage
        assetKey="bgJungleGame"
        resizeMode="cover"
        style={styles.background}
        fallback={<View style={styles.backgroundFallback} />}
      />
      <View style={styles.depthShade} />
      <BattleGround />

      <Animated.View
        style={[
          styles.enemyCamp,
          { transform: [{ translateX: campTranslate }, { scale: campScale }] }
        ]}
      >
        <AssetImage assetKey="buildingEnemyCamp" style={styles.full} fallback={<CampFallback />} />
        <Animated.View style={[styles.campFlash, { opacity: campFlash }]} pointerEvents="none" />
        <HealthBar percent={Math.max(0, Math.round((enemyCampHp / enemyCampMaxHp) * 100))} enemy large />
      </Animated.View>

      {fighters.map((unit, index) => {
        const spot = fighterSpots[index % fighterSpots.length] ?? { x: 24, y: 66 };
        const striking = settled && Date.now() - unit.lastActionAt < STRIKE_WINDOW_MS;
        return (
          <View
            key={unit.id}
            style={[
              styles.unit,
              {
                left: `${spot.x - 8}%`,
                top: `${spot.y - 12}%`
              },
              striking ? styles.unitStriking : null
            ]}
          >
            {striking ? <View style={styles.strikeGlow} pointerEvents="none" /> : null}
            <LivelyUnit seed={index} amplitude={4} style={styles.full}>
              <AssetImage
                assetKey={troopBattleAsset(unit.type as TroopType)}
                style={styles.full}
                fallback={<MonkeyFallback fighter />}
              />
            </LivelyUnit>
            <HealthBar percent={Math.max(0, Math.round((unit.hp / unit.maxHp) * 100))} />
          </View>
        );
      })}

      {enemies.map((unit, index) => {
        const spot = enemySpots[index % enemySpots.length] ?? { x: 72, y: 42 };
        const striking = settled && Date.now() - unit.lastActionAt < STRIKE_WINDOW_MS;
        return (
          <View
            key={unit.id}
            style={[
              styles.enemyUnit,
              {
                left: `${spot.x - 7}%`,
                top: `${spot.y - 11}%`
              },
              striking ? styles.unitStriking : null
            ]}
          >
            {striking ? <View style={[styles.strikeGlow, styles.strikeGlowEnemy]} pointerEvents="none" /> : null}
            <LivelyUnit seed={index + 3} amplitude={4} style={styles.full}>
              <AssetImage
                assetKey={unit.type === "archer" ? "unitEnemyArcher" : unit.type === "fighter" ? "unitEnemyWarrior" : troopBattleAsset(unit.type as TroopType)}
                style={styles.full}
                fallback={<MonkeyFallback fighter enemy />}
              />
            </LivelyUnit>
            <HealthBar percent={Math.max(0, Math.round((unit.hp / unit.maxHp) * 100))} enemy />
          </View>
        );
      })}

      <View style={styles.combatLines} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 100 106">
          {fighters.length > 0 ? (
            <>
              <Line x1="36" y1="70" x2="69" y2="49" stroke="rgba(255, 230, 145, 0.5)" strokeWidth="1.2" strokeDasharray="4 5" />
              <Circle cx="69" cy="49" r="4" fill="rgba(255, 102, 66, 0.32)" />
            </>
          ) : null}
        </Svg>
      </View>

      <View style={styles.markerLayer} pointerEvents="none">
        {markers.map((marker) => (
          <View key={marker.id} style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.sparkAnchor, { left: `${marker.x}%`, top: `${marker.y + 6}%` }]}>
              <SparkBurst color={marker.tone === "ally" ? "#ff8a5c" : "#ffd95a"} />
            </View>
            <FloatingNumber marker={marker} onDone={removeMarker} />
          </View>
        ))}
      </View>

      <View style={styles.raidHud}>
        <View style={styles.hudSide}>
          <Text style={styles.hudLabel}>{t("raid.hud.troops", lang)}</Text>
          <Text style={styles.hudValue}>{fighters.length}/{deployed.length}</Text>
          <Text style={styles.hudSubvalue}>{t("raid.hud.hp", lang)} {Math.round(armyHp)}/{Math.round(armyMaxHp)}</Text>
        </View>
        <View style={styles.hudPower}>
          <AssetImage assetKey="resourcePopulation" style={styles.hudPowerIcon} fallback={<View style={styles.hudPowerFallback} />} />
          <Text style={styles.hudPowerValue}>{raidPower}</Text>
        </View>
        <View style={[styles.hudSide, styles.hudSideEnemy]}>
          <Text style={styles.hudLabel}>{t("raid.hud.camp", lang)}</Text>
          <Text style={[styles.hudValue, styles.hudEnemyValue]}>{Math.max(0, Math.round(enemyCampHp))}/{enemyCampMaxHp}</Text>
        </View>
      </View>

      {feedbackText ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>
      ) : null}

      {resultVisible ? (
        <View style={styles.resultScrim} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.resultPanel,
              victory ? styles.resultPanelWin : styles.resultPanelLose,
              { opacity: resultAnim, transform: [{ scale: resultScale }] }
            ]}
          >
            <View style={[styles.resultEmblem, victory ? styles.resultEmblemWin : styles.resultEmblemLose]}>
              <AssetImage assetKey={playerIdentityAsset} style={styles.resultIdentity} resizeMode="contain" fallback={<Text style={styles.resultEmblemText}>{victory ? "V" : "!"}</Text>} />
            </View>
            <ScrollView
              style={styles.resultScroll}
              contentContainerStyle={styles.resultContent}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.resultTitle}>
                {victory
                  ? t("raid.victory", lang)
                  : retreated
                    ? t("raid.retreatResult", lang)
                    : t("raid.defeat", lang)}
              </Text>
              {victory ? (
                <View style={styles.starRow}>
                  {[1, 2, 3].map((slot) => <StarIcon key={slot} filled={slot <= stars} />)}
                </View>
              ) : null}
              {victory && gemRewardReason === "first-victory" ? (
                <View style={styles.firstVictoryBadge}>
                  <Text style={styles.firstVictoryBadgeText}>{t("raid.firstVictoryBadge", lang)}</Text>
                </View>
              ) : null}
              {victory && strongholdLevelUp ? (
                <StrongholdCallout level={strongholdLevelUp} lang={lang} />
              ) : null}
              <Text style={styles.resultText}>
                {victory
                  ? t("raid.victoryText", lang)
                  : retreated
                    ? t("raid.retreatText", lang)
                    : t("raid.defeatText", lang)}
              </Text>
              {victory ? (
                <>
                  <Text style={styles.rewardMultiplier}>
                    {rewardMultiplier === 1
                      ? t("raid.firstVictoryReward", lang)
                      : t("raid.repeatReward", lang, {
                          percent: Math.round(rewardMultiplier * 100)
                        })}
                  </Text>
                  {gemReward > 0 ? (
                    <Text style={styles.gemReason}>
                      {gemRewardReason === "first-repeat"
                        ? t("raid.gemReason.firstRepeat", lang)
                        : t("raid.gemReason.firstVictory", lang, { stars, gems: gemReward })}
                    </Text>
                  ) : null}
                  <Text style={styles.rewardSectionLabel}>{t("raid.lootReceived", lang)}</Text>
                  <View style={styles.rewardGrid}>
                    <RewardChip assetKey="resourceBananaPile" amount={loot.bananas} />
                    <RewardChip assetKey="resourceWoodBundle" amount={loot.wood} />
                    <RewardChip assetKey="resourceStonePile" amount={loot.stones} />
                    {gemReward > 0 ? <RewardChip assetKey="resourceJungleGem" amount={gemReward} /> : null}
                  </View>
                  {discardedLoot.bananas + discardedLoot.stones + discardedLoot.wood > 0 ? (
                    <>
                      <Text style={[styles.rewardSectionLabel, styles.discardedLabel]}>
                        {t("raid.lootNotReceived", lang)}
                      </Text>
                      <View style={styles.rewardGrid}>
                        {discardedLoot.bananas > 0 ? <RewardChip assetKey="resourceBananaPile" amount={discardedLoot.bananas} discarded /> : null}
                        {discardedLoot.wood > 0 ? <RewardChip assetKey="resourceWoodBundle" amount={discardedLoot.wood} discarded /> : null}
                        {discardedLoot.stones > 0 ? <RewardChip assetKey="resourceStonePile" amount={discardedLoot.stones} discarded /> : null}
                      </View>
                    </>
                  ) : null}
                </>
              ) : null}
              {!victory && penalty ? (
                <PenaltySummary penalty={penalty} lang={lang} />
              ) : null}
              {armyResult ? (
                <View style={styles.armyResultRow}>
                  <View style={[styles.armyResultCard, styles.armyResultCardSurvivors]}>
                    <Text style={styles.armyResultSurvivors}>{t("raid.result.survivors", lang, { n: armyResult.survivors })}</Text>
                  </View>
                  <View style={[styles.armyResultCard, styles.armyResultCardLosses]}>
                    <Text style={styles.armyResultLosses}>{t("raid.result.losses", lang, { n: armyResult.losses })}</Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.returnButtonWrap}>
                <WoodButton label={t("raid.return", lang)} onPress={onReturn} primary />
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      ) : (
        <SpringPressable
          accessibilityRole="button"
          sound="close"
          onPress={onRetreat}
          style={styles.retreatButton}
        >
          <Text style={styles.retreatText}>{t("raid.retreat", lang)}</Text>
        </SpringPressable>
      )}

      {victory && resultVisible ? <Confetti width={sceneWidth} height={sceneHeight} /> : null}
    </View>
  );
}

function troopBattleAsset(type: TroopType): GameAssetKey {
  if (type === "archer") return "unitArcher";
  if (type === "shield_guardian") return "unitShieldGuardian";
  if (type === "crossbowman") return "unitCrossbowman";
  return "unitWarrior";
}

function StrongholdCallout({ level, lang }: { level: number; lang: Lang }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay: 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <Animated.View style={[styles.strongholdCallout, { opacity: anim, transform: [{ translateY }] }]}>
      <Text style={styles.strongholdCalloutText}>{t("raid.strongholdReturn", lang)}</Text>
      <View style={styles.strongholdLevelChip}>
        <Text style={styles.strongholdLevelText}>{t("raid.newLevel", lang, { n: level })}</Text>
      </View>
    </Animated.View>
  );
}

function FloatingNumber({ marker, onDone }: { marker: DamageMarker; onDone: (id: number) => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        onDone(marker.id);
      }
    });
  }, [marker.id, onDone, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const opacity = progress.interpolate({ inputRange: [0, 0.12, 0.7, 1], outputRange: [0, 1, 1, 0] });
  const color = marker.tone === "camp" ? "#ffd95a" : marker.tone === "ally" ? "#ff8c6b" : "#ffe9b0";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.marker,
        { left: `${marker.x - 8}%`, top: `${marker.y - 4}%`, opacity, transform: [{ translateY }] }
      ]}
    >
      <Text style={[styles.markerText, marker.tone === "camp" ? styles.markerTextCamp : null, { color }]}>
        -{marker.amount}
      </Text>
    </Animated.View>
  );
}

function RewardChip({ assetKey, amount, discarded = false }: { assetKey: GameAssetKey; amount: number; discarded?: boolean }) {
  return (
    <View style={[styles.rewardChip, discarded ? styles.rewardChipDiscarded : null]}>
      <AssetImage assetKey={assetKey} style={styles.rewardIcon} fallback={<View style={styles.rewardIconFallback} />} />
      <Text style={[styles.rewardText, discarded ? styles.rewardTextDiscarded : null]}>
        {discarded ? "−" : "+"}{amount}
      </Text>
    </View>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <Svg width={25} height={25} viewBox="0 0 24 24" accessibilityLabel={filled ? "star" : undefined}>
      <Path
        d="M12 2.4l2.82 5.72 6.31.92-4.56 4.45 1.08 6.28L12 16.8l-5.65 2.97 1.08-6.28-4.56-4.45 6.31-.92L12 2.4z"
        fill={filled ? "#ffd95a" : "rgba(255,255,255,0.12)"}
        stroke={filled ? "#fff0a0" : "rgba(255,255,255,0.32)"}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PenaltySummary({ penalty, lang }: { penalty: RaidPenalty; lang: Lang }) {
  const entries = [
    { key: "bananas" as const, assetKey: "resourceBananaPile" as const },
    { key: "wood" as const, assetKey: "resourceWoodBundle" as const },
    { key: "stones" as const, assetKey: "resourceStonePile" as const }
  ].filter(({ key }) => penalty.amounts[key] > 0);

  return (
    <View style={styles.penaltyBlock}>
      <Text style={styles.penaltyLabel}>
        {entries.length > 0 ? t("raid.resourcesLost", lang) : t("raid.resourcesProtected", lang)}
      </Text>
      {entries.length > 0 ? (
        <View style={styles.rewardGrid}>
          {entries.map(({ key, assetKey }) => (
            <PenaltyChip key={key} assetKey={assetKey} amount={penalty.amounts[key]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PenaltyChip({ assetKey, amount }: { assetKey: GameAssetKey; amount: number }) {
  return (
    <View style={[styles.rewardChip, styles.penaltyChip]}>
      <AssetImage assetKey={assetKey} style={styles.rewardIcon} fallback={<View style={styles.rewardIconFallback} />} />
      <Text style={styles.penaltyText}>-{amount}</Text>
    </View>
  );
}

function BattleGround() {
  return (
    <View style={styles.ground} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 106">
        <Path d="M16 80 C32 70 47 68 66 53 C78 44 84 34 92 22" stroke="rgba(132, 88, 43, 0.58)" strokeWidth="14" strokeLinecap="round" fill="none" />
        <Ellipse cx="75" cy="48" rx="23" ry="20" fill="rgba(78, 44, 29, 0.22)" />
        <Ellipse cx="30" cy="76" rx="26" ry="19" fill="rgba(52, 93, 45, 0.18)" />
      </Svg>
    </View>
  );
}

function HealthBar({ percent, enemy, large }: { percent: number; enemy?: boolean; large?: boolean }) {
  // Tween toward the new value instead of snapping (layout prop, so this
  // animates on the JS thread — the bars are tiny, it stays cheap).
  const animated = useRef(new Animated.Value(percent)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: percent,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false
    }).start();
  }, [animated, percent]);

  const width = animated.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"]
  });

  return (
    <View style={[styles.hpTrack, large ? styles.hpTrackLarge : null]}>
      <Animated.View
        style={[
          styles.hpFill,
          {
            width,
            backgroundColor: enemy ? theme.colors.enemy : theme.colors.player
          }
        ]}
      />
    </View>
  );
}

function CampFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Path d="M10 32 L32 11 L55 32 L48 54 H16 Z" fill="#8f2f25" />
      <Path d="M10 32 L32 11 L55 32" stroke="#4d2018" strokeWidth="5" fill="none" />
      <Circle cx="32" cy="38" r="8" fill="#3a1914" />
    </Svg>
  );
}

function MonkeyFallback({ fighter, enemy }: { fighter?: boolean; enemy?: boolean }) {
  const body = enemy ? "#62321f" : "#8b5e35";
  return (
    <Svg width="88%" height="88%" viewBox="0 0 64 64">
      <Circle cx="20" cy="25" r="8" fill={body} />
      <Circle cx="44" cy="25" r="8" fill={body} />
      <Circle cx="32" cy="34" r="19" fill={body} />
      <Ellipse cx="32" cy="40" rx="12" ry="9" fill="#d9a86c" />
      <Circle cx="25" cy="32" r="3" fill="#1d1612" />
      <Circle cx="39" cy="32" r="3" fill="#1d1612" />
      {fighter ? <Line x1="47" y1="47" x2="59" y2="35" stroke="#efe3bb" strokeWidth="4" /> : null}
    </Svg>
  );
}

const styles = StyleSheet.create({
  scene: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(122, 170, 83, 0.46)",
    backgroundColor: "#18331f",
    shadowColor: "#000",
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  background: {
    ...StyleSheet.absoluteFillObject
  },
  backgroundFallback: {
    flex: 1,
    backgroundColor: "#24442b"
  },
  depthShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 10, 8, 0.18)"
  },
  ground: {
    ...StyleSheet.absoluteFillObject
  },
  full: {
    width: "100%",
    height: "100%"
  },
  enemyCamp: {
    position: "absolute",
    left: "58%",
    top: "22%",
    width: "30%",
    height: "30%",
    alignItems: "center",
    justifyContent: "center"
  },
  campFlash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: "rgba(255, 86, 56, 0.9)"
  },
  unit: {
    position: "absolute",
    width: "18%",
    height: "18%",
    alignItems: "center",
    justifyContent: "center"
  },
  enemyUnit: {
    position: "absolute",
    width: "16%",
    height: "16%",
    alignItems: "center",
    justifyContent: "center"
  },
  unitStriking: {
    transform: [{ scale: 1.12 }]
  },
  strikeGlow: {
    position: "absolute",
    width: "78%",
    height: "78%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 224, 130, 0.45)",
    shadowColor: "#ffe082",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  },
  strikeGlowEnemy: {
    backgroundColor: "rgba(255, 120, 96, 0.4)",
    shadowColor: "#ff7860"
  },
  combatLines: {
    ...StyleSheet.absoluteFillObject
  },
  sparkAnchor: {
    position: "absolute",
    marginLeft: -17,
    marginTop: -17
  },
  markerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 400
  },
  marker: {
    position: "absolute",
    width: "16%",
    alignItems: "center"
  },
  markerText: {
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textShadowColor: "rgba(0, 0, 0, 0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  markerTextCamp: {
    fontSize: 19
  },
  hpTrack: {
    position: "absolute",
    left: "18%",
    right: "18%",
    top: "6%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(21, 37, 25, 0.78)",
    overflow: "hidden"
  },
  hpTrackLarge: {
    top: "4%",
    height: 6
  },
  hpFill: {
    height: "100%"
  },
  raidHud: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(226,177,90,0.28)",
    backgroundColor: "rgba(17, 20, 14, 0.84)",
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  hudSide: {
    flex: 1,
    minWidth: 0
  },
  hudSideEnemy: { alignItems: "flex-end" },
  hudLabel: { color: "#cabd9e", fontSize: 8.5, fontFamily: theme.fonts.bold },
  hudValue: { color: "#a9e6a8", fontSize: 14, lineHeight: 16, fontFamily: theme.fonts.heavy },
  hudEnemyValue: { color: "#ffab96" },
  hudSubvalue: { color: "#ddd0b1", fontSize: 7.5, fontFamily: theme.fonts.bold },
  hudPower: { minWidth: 66, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, borderLeftWidth: 1, borderRightWidth: 1, borderColor: "rgba(226,177,90,0.22)" },
  hudPowerIcon: { width: 22, height: 22 },
  hudPowerFallback: { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(255,217,90,0.35)" },
  hudPowerValue: { color: "#ffd95a", fontSize: 14, fontFamily: theme.fonts.heavy },
  feedbackBanner: {
    position: "absolute",
    left: "15%",
    right: "15%",
    bottom: "14%",
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "rgba(44, 31, 15, 0.84)",
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  feedbackText: {
    color: "#ffe28b",
    fontSize: 10,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  retreatButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(255, 179, 137, 0.72)",
    backgroundColor: "rgba(139, 45, 34, 0.94)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6
  },
  retreatText: {
    color: theme.colors.paper,
    fontSize: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  resultScrim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8, 14, 9, 0.55)",
    padding: 10,
    zIndex: 500
  },
  resultPanel: {
    width: "100%",
    maxWidth: 340,
    maxHeight: "94%",
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "rgba(17, 20, 14, 0.95)",
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0
  },
  resultPanelWin: {
    borderColor: "rgba(122, 200, 110, 0.65)"
  },
  resultPanelLose: {
    borderColor: "rgba(200, 86, 70, 0.6)"
  },
  resultEmblem: {
    position: "absolute",
    top: -22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "rgba(17, 20, 14, 0.95)"
  },
  resultEmblemWin: {
    backgroundColor: "#3f9c52"
  },
  resultEmblemLose: {
    backgroundColor: "#a8392c"
  },
  resultEmblemText: {
    color: theme.colors.paper,
    fontSize: 22,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  resultIdentity: {
    width: 39,
    height: 39
  },
  resultScroll: { width: "100%" },
  resultContent: { alignItems: "center", paddingTop: 26, paddingBottom: 14, paddingHorizontal: 14 },
  resultTitle: {
    color: theme.colors.paper,
    fontSize: 24,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  starRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 5
  },
  firstVictoryBadge: { marginTop: 5, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,217,90,0.55)", backgroundColor: "rgba(255,217,90,0.13)", paddingHorizontal: 10, paddingVertical: 3 },
  firstVictoryBadgeText: { color: "#ffe78d", fontSize: 9.5, letterSpacing: 0.4, fontFamily: theme.fonts.heavy },
  resultText: {
    marginTop: 8,
    color: "#d8ccb0",
    fontSize: 13,
    fontWeight: "800", fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  rewardGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9
  },
  rewardMultiplier: {
    color: "#f7dda0",
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center"
  },
  rewardSectionLabel: {
    marginTop: 8,
    color: "#d8ccb0",
    fontSize: 10,
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  discardedLabel: { color: "#efa58f" },
  gemReason: { marginTop: 3, color: "#8bd4ff", fontSize: 10, textAlign: "center", fontFamily: theme.fonts.bold },
  armyResultRow: { width: "100%", flexDirection: "row", gap: 7, marginTop: 9 },
  armyResultCard: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 9, borderWidth: 1, paddingHorizontal: 5 },
  armyResultCardSurvivors: { borderColor: "rgba(102,190,104,0.42)", backgroundColor: "rgba(70,150,76,0.13)" },
  armyResultCardLosses: { borderColor: "rgba(218,100,78,0.42)", backgroundColor: "rgba(190,72,54,0.13)" },
  armyResultSurvivors: { color: "#9be39a", fontSize: 10, textAlign: "center", fontFamily: theme.fonts.heavy },
  armyResultLosses: { color: "#f2a08d", fontSize: 10, textAlign: "center", fontFamily: theme.fonts.heavy },
  penaltyBlock: {
    alignItems: "center",
    marginTop: 12
  },
  penaltyLabel: {
    color: "#f2b29d",
    fontSize: 12,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  penaltyChip: {
    backgroundColor: "rgba(190, 72, 54, 0.18)"
  },
  penaltyText: {
    color: "#ffb29d",
    fontSize: 14,
    fontWeight: "900",
    fontFamily: theme.fonts.heavy
  },
  rewardChip: {
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255, 224, 151, 0.12)",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  rewardChipDiscarded: { backgroundColor: "rgba(190, 72, 54, 0.16)" },
  rewardIcon: {
    width: 30,
    height: 30
  },
  rewardIconFallback: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: "rgba(255, 224, 151, 0.4)"
  },
  rewardText: {
    color: "#ffe9ad",
    fontSize: 14,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  rewardTextDiscarded: { color: "#f2a08d" },
  strongholdCallout: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.55)",
    backgroundColor: "rgba(74, 48, 16, 0.5)",
    paddingVertical: 9,
    paddingHorizontal: 12
  },
  strongholdCalloutText: {
    color: "#ffe9ad",
    fontSize: 12.5,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  strongholdLevelChip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#f3d27a",
    backgroundColor: "#6b3f16",
    paddingHorizontal: 12,
    paddingVertical: 2
  },
  strongholdLevelText: {
    color: "#fff4d6",
    fontSize: 13,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  returnButtonWrap: {
    alignSelf: "stretch",
    marginTop: 16
  }
});
