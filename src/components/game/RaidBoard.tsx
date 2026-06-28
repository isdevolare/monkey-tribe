import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, Line, Path } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { CAMP_MAX_HP } from "../../game/config/constants";
import type { RaidStatus, Unit } from "../../game/types/game";
import { theme } from "../../theme/theme";

type RaidBoardProps = {
  units: Unit[];
  enemyCampHp: number;
  raidStatus: RaidStatus;
  feedbackText?: string;
  maxSize?: number;
  onReturn: () => void;
};

const fighterSpots = [
  { x: 24, y: 66 },
  { x: 34, y: 72 },
  { x: 28, y: 82 },
  { x: 42, y: 78 }
];

const enemySpots = [
  { x: 72, y: 42 },
  { x: 82, y: 53 },
  { x: 67, y: 60 }
];

export function RaidBoard({
  units,
  enemyCampHp,
  raidStatus,
  feedbackText,
  maxSize = 430,
  onReturn
}: RaidBoardProps) {
  const { width } = useWindowDimensions();
  const sceneWidth = Math.min(width - theme.spacing.lg * 2, maxSize);
  const sceneHeight = sceneWidth * 1.06;
  const fighters = units.filter(
    (unit) => unit.owner === "player" && unit.type === "fighter" && unit.state !== "dead" && unit.hp > 0
  );
  const enemies = units.filter(
    (unit) => unit.owner === "enemy" && unit.state !== "dead" && unit.hp > 0
  );
  const raidPower = fighters.reduce((total, unit) => total + unit.attack, 0);
  const resultVisible = raidStatus === "victory" || raidStatus === "defeat";

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

      <View style={styles.enemyCamp}>
        <AssetImage
          assetKey="buildingEnemyCamp"
          style={styles.full}
          fallback={<CampFallback />}
        />
        <HealthBar percent={Math.max(0, Math.round((enemyCampHp / CAMP_MAX_HP) * 100))} enemy large />
      </View>

      {fighters.map((unit, index) => {
        const spot = fighterSpots[index % fighterSpots.length] ?? { x: 24, y: 66 };
        return (
          <View
            key={unit.id}
            style={[
              styles.unit,
              {
                left: `${spot.x - 8}%`,
                top: `${spot.y - 12}%`
              }
            ]}
          >
            <AssetImage assetKey="unitFighter" style={styles.full} fallback={<MonkeyFallback fighter />} />
            <HealthBar percent={Math.max(0, Math.round((unit.hp / unit.maxHp) * 100))} />
          </View>
        );
      })}

      {enemies.map((unit, index) => {
        const spot = enemySpots[index % enemySpots.length] ?? { x: 72, y: 42 };
        return (
          <View
            key={unit.id}
            style={[
              styles.enemyUnit,
              {
                left: `${spot.x - 7}%`,
                top: `${spot.y - 11}%`
              }
            ]}
          >
            <AssetImage assetKey="unitEnemyFighter" style={styles.full} fallback={<MonkeyFallback fighter enemy />} />
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

      <View style={styles.raidHud}>
        <Text style={styles.raidTitle}>Raid Battle</Text>
        <Text style={styles.raidStat}>Enemy Camp HP {Math.max(0, enemyCampHp)} / {CAMP_MAX_HP}</Text>
        <Text style={styles.raidStat}>Raid Power {raidPower}</Text>
      </View>

      {feedbackText ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>
      ) : null}

      {resultVisible ? (
        <View style={styles.resultPanel}>
          <Text style={styles.resultTitle}>{raidStatus === "victory" ? "Raid Victory" : "Raid Failed"}</Text>
          <Text style={styles.resultText}>
            {raidStatus === "victory"
              ? "Rewards were added to your village stores."
              : "Return to the village and train more fighters."}
          </Text>
          <Pressable accessibilityRole="button" onPress={onReturn} style={styles.returnButton}>
            <Text style={styles.returnText}>Return to Village</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={onReturn} style={styles.retreatButton}>
          <Text style={styles.retreatText}>Retreat</Text>
        </Pressable>
      )}
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
  combatLines: {
    ...StyleSheet.absoluteFillObject
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
    fontWeight: "900"
  },
  raidStat: {
    marginTop: 2,
    color: "#d8ccb0",
    fontSize: 12,
    fontWeight: "800"
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
    fontWeight: "900",
    textAlign: "center"
  },
  retreatButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 10,
    backgroundColor: "rgba(42, 38, 29, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  retreatText: {
    color: theme.colors.paper,
    fontSize: 13,
    fontWeight: "900"
  },
  resultPanel: {
    position: "absolute",
    left: "9%",
    right: "9%",
    top: "31%",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "rgba(17, 20, 14, 0.92)",
    padding: 16
  },
  resultTitle: {
    color: theme.colors.paper,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center"
  },
  resultText: {
    marginTop: 8,
    color: "#d8ccb0",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  returnButton: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: "#d96516",
    paddingHorizontal: 18,
    paddingVertical: 11
  },
  returnText: {
    color: theme.colors.paper,
    fontSize: 14,
    fontWeight: "900"
  }
});
