import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
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
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { t } from "../../game/i18n";
import type { Lang, RaidStatus, Resources, Unit } from "../../game/types/game";
import { theme } from "../../theme/theme";

type RaidBoardProps = {
  units: Unit[];
  enemyCampHp: number;
  enemyCampMaxHp: number;
  raidStatus: RaidStatus;
  stars: number;
  loot: Resources;
  lang: Lang;
  feedbackText?: string;
  maxSize?: number;
  /** New stronghold level after a stronghold win; shows the level-up callout. */
  strongholdLevelUp?: number | null;
  onReturn: () => void;
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
  { x: 42, y: 78 }
];

const enemySpots: Spot[] = [
  { x: 72, y: 42 },
  { x: 82, y: 53 },
  { x: 67, y: 60 }
];

const CAMP_CENTER: Spot = { x: 73, y: 37 };
const STRIKE_WINDOW_MS = 220;

export function RaidBoard({
  units,
  enemyCampHp,
  enemyCampMaxHp,
  raidStatus,
  stars,
  loot,
  lang,
  feedbackText,
  maxSize = 430,
  strongholdLevelUp,
  onReturn
}: RaidBoardProps) {
  const { width } = useWindowDimensions();
  const sceneWidth = Math.min(width - theme.spacing.lg * 2, maxSize);
  const sceneHeight = sceneWidth * 1.06;
  const fighters = units.filter(
    (unit) =>
      unit.owner === "player" &&
      (unit.type === "fighter" || unit.type === "archer") &&
      unit.state !== "dead" &&
      unit.hp > 0
  );
  const enemies = units.filter(
    (unit) => unit.owner === "enemy" && unit.state !== "dead" && unit.hp > 0
  );
  const raidPower = fighters.reduce((total, unit) => total + unit.attack, 0);
  const resultVisible = raidStatus === "victory" || raidStatus === "defeat";
  const victory = raidStatus === "victory";

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
        fresh.push({
          id: markerSeq.current,
          x: spot.x,
          y: spot.y - 7,
          amount: previous - unit.hp,
          tone: unit.owner === "player" ? "ally" : "enemy"
        });
      }
    }

    if (enemyCampHp < prevCampRef.current) {
      markerSeq.current += 1;
      fresh.push({
        id: markerSeq.current,
        x: CAMP_CENTER.x,
        y: CAMP_CENTER.y - 4,
        amount: prevCampRef.current - enemyCampHp,
        tone: "camp"
      });
      punchCamp();
    }
    prevCampRef.current = enemyCampHp;

    if (fresh.length > 0) {
      setMarkers((current) => [...current, ...fresh]);
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

      <Animated.View style={[styles.enemyCamp, { transform: [{ translateX: campTranslate }] }]}>
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
                assetKey={unit.type === "archer" ? "unitArcher" : "unitWarrior"}
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
                assetKey={unit.type === "archer" ? "unitEnemyArcher" : "unitEnemyWarrior"}
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
          <FloatingNumber key={marker.id} marker={marker} onDone={removeMarker} />
        ))}
      </View>

      <View style={styles.raidHud}>
        <Text style={styles.raidTitle}>{t("raid.title", lang)}</Text>
        <Text style={styles.raidStat}>{t("raid.campHp", lang)} {Math.max(0, Math.round(enemyCampHp))} / {enemyCampMaxHp}</Text>
        <Text style={styles.raidStat}>{t("raid.power", lang)} {raidPower}</Text>
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
              <Text style={styles.resultEmblemText}>{victory ? "★" : "!"}</Text>
            </View>
            <Text style={styles.resultTitle}>{victory ? t("raid.victory", lang) : t("raid.defeat", lang)}</Text>
            {victory ? (
              <View style={styles.starRow}>
                {[1, 2, 3].map((slot) => (
                  <Text key={slot} style={[styles.star, slot <= stars ? styles.starOn : styles.starOff]}>
                    ★
                  </Text>
                ))}
              </View>
            ) : null}
            {victory && strongholdLevelUp ? (
              <StrongholdCallout level={strongholdLevelUp} lang={lang} />
            ) : null}
            <Text style={styles.resultText}>
              {victory ? t("raid.victoryText", lang) : t("raid.defeatText", lang)}
            </Text>
            {victory ? (
              <View style={styles.rewardRow}>
                <RewardChip assetKey="resourceBananaPile" amount={loot.bananas} />
                <RewardChip assetKey="resourceWoodBundle" amount={loot.wood} />
                <RewardChip assetKey="resourceStonePile" amount={loot.stones} />
              </View>
            ) : null}
            <View style={styles.returnButtonWrap}>
              <WoodButton label={t("raid.return", lang)} onPress={onReturn} primary />
            </View>
          </Animated.View>
        </View>
      ) : (
        <SpringPressable
          accessibilityRole="button"
          sound="close"
          onPress={onReturn}
          style={styles.retreatButton}
        >
          <Text style={styles.retreatText}>{t("raid.retreat", lang)}</Text>
        </SpringPressable>
      )}
    </View>
  );
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

function RewardChip({ assetKey, amount }: { assetKey: GameAssetKey; amount: number }) {
  return (
    <View style={styles.rewardChip}>
      <AssetImage assetKey={assetKey} style={styles.rewardIcon} fallback={<View style={styles.rewardIconFallback} />} />
      <Text style={styles.rewardText}>+{amount}</Text>
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
  return (
    <View style={[styles.hpTrack, large ? styles.hpTrackLarge : null]}>
      <View
        style={[
          styles.hpFill,
          {
            width: `${percent}%`,
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
    borderRadius: 12,
    backgroundColor: "rgba(17, 20, 14, 0.82)",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  raidTitle: {
    color: theme.colors.paper,
    fontSize: 17,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  raidStat: {
    marginTop: 2,
    color: "#d8ccb0",
    fontSize: 12,
    fontWeight: "800", fontFamily: theme.fonts.bold
  },
  feedbackBanner: {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: "15%",
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(44, 31, 15, 0.84)",
    paddingHorizontal: 12
  },
  feedbackText: {
    color: "#ffe28b",
    fontSize: 12,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  retreatButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(226, 177, 90, 0.45)",
    backgroundColor: "rgba(20, 16, 9, 0.92)",
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    padding: 18,
    zIndex: 500
  },
  resultPanel: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "rgba(17, 20, 14, 0.95)",
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: 18
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
  resultTitle: {
    color: theme.colors.paper,
    fontSize: 24,
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
  starRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8
  },
  star: {
    fontSize: 30,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  starOn: {
    color: "#ffd95a",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  starOff: {
    color: "rgba(255, 255, 255, 0.22)"
  },
  resultText: {
    marginTop: 8,
    color: "#d8ccb0",
    fontSize: 13,
    fontWeight: "800", fontFamily: theme.fonts.bold,
    textAlign: "center"
  },
  rewardRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255, 224, 151, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
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
