import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { SpriteSheetImage, type SpriteFrame } from "./SpriteSheetImage";
import { CAMP_MAX_HP } from "../../game/config/constants";
import { getGameAsset } from "../../game/assets/gameAssets";
import type { Buildings, Tile, Unit } from "../../game/types/game";
import { theme } from "../../theme/theme";

type GameBoardProps = {
  tiles: Tile[];
  units: Unit[];
  selectedUnitId: string | null;
  buildings: Buildings;
  playerCampHp: number;
  enemyCampHp: number;
  maxSize?: number;
  feedbackText?: string;
  onCellPress: (tile: Tile, unit?: Unit) => void;
};

type Point = {
  x: number;
  y: number;
};

type SceneItem = {
  key: string;
  center: Point;
  size: number;
  zIndex: number;
  node: ReactNode;
};

const VILLAGE_CENTER: Point = { x: 47, y: 42 };
const ENEMY_ZONE: Point = { x: 79, y: 24 };

const TILE_POINTS: Record<string, Point> = {
  "1,8": VILLAGE_CENTER,
  "1,7": { x: 37, y: 57 },
  "2,8": { x: 32, y: 63 },
  "0,8": { x: 16, y: 77 },
  "3,8": { x: 37, y: 79 },
  "4,7": { x: 62, y: 72 },
  "0,5": { x: 13, y: 55 },
  "2,6": { x: 23, y: 68 },
  "5,3": { x: 69, y: 45 },
  "6,5": { x: 73, y: 62 },
  "7,3": { x: 87, y: 40 },
  "3,5": { x: 16, y: 38 },
  "6,2": { x: 57, y: 17 },
  "8,4": { x: 91, y: 53 },
  "8,1": ENEMY_ZONE,
  "7,1": { x: 69, y: 23 },
  "9,1": { x: 89, y: 24 },
  "8,2": { x: 80, y: 32 },
  "0,0": { x: 10, y: 12 },
  "1,0": { x: 22, y: 11 },
  "9,0": { x: 92, y: 10 },
  "0,9": { x: 11, y: 90 },
  "5,8": { x: 62, y: 86 },
  "9,9": { x: 90, y: 88 }
};

const BUILDING_SLOTS = {
  camp: VILLAGE_CENTER,
  hut: { x: 31, y: 40 },
  trainingNest: { x: 65, y: 48 },
  watchPost: { x: 63, y: 27 },
  campfire: { x: 49, y: 56 }
};

const FENCE_POSTS = [
  { x: 18, y: 45, rotate: -14 },
  { x: 22, y: 33, rotate: -7 },
  { x: 33, y: 24, rotate: 12 },
  { x: 47, y: 21, rotate: 3 },
  { x: 62, y: 24, rotate: -9 },
  { x: 75, y: 35, rotate: -16 },
  { x: 79, y: 50, rotate: 2 },
  { x: 72, y: 65, rotate: 17 },
  { x: 57, y: 75, rotate: 8 },
  { x: 39, y: 74, rotate: -8 },
  { x: 24, y: 65, rotate: -18 },
  { x: 17, y: 55, rotate: -6 }
];

export function GameBoard({
  tiles,
  units,
  selectedUnitId,
  buildings,
  playerCampHp,
  enemyCampHp,
  maxSize = 430,
  feedbackText,
  onCellPress
}: GameBoardProps) {
  const { width } = useWindowDimensions();
  const sceneWidth = Math.min(width - theme.spacing.lg * 2, maxSize);
  const sceneHeight = sceneWidth * 1.06;
  const aliveUnits = units.filter((unit) => unit.state !== "dead" && unit.hp > 0);
  const selectedUnit = aliveUnits.find((unit) => unit.id === selectedUnitId);
  const decorativeItems = [
    ...resourceItems(tiles, playerCampHp, enemyCampHp),
    ...villageItems(buildings, playerCampHp),
    ...enemyItems(tiles, enemyCampHp)
  ].sort((a, b) => a.zIndex - b.zIndex);
  const unitItems = aliveUnits
    .map((unit) => unitSceneItem(unit, unit.id === selectedUnitId))
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <View style={[styles.scene, { width: sceneWidth, height: sceneHeight }]}>
      <SceneBackground />
      <VillageGround />

      <View style={styles.decorLayer} pointerEvents="none">
        {decorativeItems.map((item) => (
          <SceneSprite item={item} key={item.key} />
        ))}
      </View>

      <View style={styles.hitLayer}>
        {tiles.map((tile) => {
          const tileUnit = aliveUnits.find((unit) => unit.x === tile.x && unit.y === tile.y);
          const selected = tileUnit?.id === selectedUnitId;
          const reachable = Boolean(
            selectedUnit &&
              !tileUnit &&
              Math.abs(selectedUnit.x - tile.x) + Math.abs(selectedUnit.y - tile.y) === 1
          );
          const attackHint = Boolean(
            selectedUnit &&
              (tileUnit?.owner === "enemy" || tile.type === "enemyCamp") &&
              Math.abs(selectedUnit.x - tile.x) + Math.abs(selectedUnit.y - tile.y) <= 2
          );
          const point = pointForTile(tile);

          return (
            <Pressable
              key={`${tile.x}-${tile.y}`}
              onPress={() => onCellPress(tile, tileUnit)}
              style={[
                styles.hitZone,
                {
                  left: `${point.x - 4.8}%`,
                  top: `${point.y - 4.8}%`,
                  width: "9.6%",
                  height: "9.6%"
                }
              ]}
            >
              {reachable ? <View style={styles.moveDot} /> : null}
              {attackHint ? <View style={styles.attackRing} /> : null}
              {selected ? <View style={styles.selectedTileRing} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.unitLayer} pointerEvents="none">
        {unitItems.map((item) => (
          <SceneSprite item={item} key={item.key} />
        ))}
      </View>

      {feedbackText ? (
        <View style={styles.feedbackBanner} pointerEvents="none">
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>
      ) : null}
    </View>
  );
}

function SceneBackground() {
  return (
    <>
      <AssetImage
        assetKey="bgJungleGame"
        resizeMode="cover"
        style={styles.background}
        fallback={<View style={styles.backgroundFallback} />}
      />
      <View style={styles.depthShade} />
      <View style={styles.vignette} />
    </>
  );
}

function VillageGround() {
  return (
    <View style={styles.groundLayer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 106">
        <Ellipse cx="47" cy="48" rx="33" ry="30" fill="rgba(58, 91, 43, 0.2)" />
        <Path
          d="M17 53 C20 33 35 22 52 24 C71 27 82 39 78 57 C74 77 55 84 37 77 C23 72 14 64 17 53 Z"
          fill="rgba(55, 84, 41, 0.18)"
        />
        <Path
          d="M31 46 C41 40 51 39 65 48"
          stroke="rgba(132, 88, 43, 0.62)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M48 44 C46 51 47 58 51 65"
          stroke="rgba(132, 88, 43, 0.58)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M49 42 C54 35 59 30 64 27"
          stroke="rgba(132, 88, 43, 0.48)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M17 53 C20 33 35 22 52 24 C71 27 82 39 78 57 C74 77 55 84 37 77 C23 72 14 64 17 53 Z"
          fill="none"
          stroke="rgba(88, 55, 26, 0.9)"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
        {FENCE_POSTS.map((post) => (
          <Rect
            key={`${post.x}-${post.y}`}
            x={post.x - 1.2}
            y={post.y - 4}
            width="2.4"
            height="8"
            rx="1"
            fill="#8f5b2a"
            stroke="#4d2a13"
            strokeWidth="0.45"
            transform={`rotate(${post.rotate} ${post.x} ${post.y})`}
          />
        ))}
      </Svg>
    </View>
  );
}

function resourceItems(tiles: Tile[], playerCampHp: number, enemyCampHp: number): SceneItem[] {
  return tiles.flatMap((tile) => {
    if (tile.type === "playerCamp" || tile.type === "enemyCamp") {
      return [];
    }

    if (tile.type === "bananaTree") {
      return [
        item(`banana-${tile.x}-${tile.y}`, pointForTile(tile), 16, 30 + pointForTile(tile).y, (
          <AssetImage assetKey="terrainBananaTree" style={styles.full} fallback={<BananaFallback />} />
        ))
      ];
    }

    if (tile.type === "woodGrove") {
      return [
        item(`wood-${tile.x}-${tile.y}`, pointForTile(tile), 21, 28 + pointForTile(tile).y, (
          <AssetImage assetKey="terrainWoodTree" style={styles.full} fallback={<WoodFallback />} />
        ))
      ];
    }

    if (tile.type === "stoneRock") {
      return [
        item(`stone-${tile.x}-${tile.y}`, pointForTile(tile), 11, 28 + pointForTile(tile).y, (
          <AssetImage assetKey="terrainRock" style={styles.full} fallback={<StoneFallback />} />
        ))
      ];
    }

    if (tile.type === "bush") {
      return [
        item(`bush-${tile.x}-${tile.y}`, pointForTile(tile), 12, 24 + pointForTile(tile).y, (
          <AssetImage assetKey="terrainBush" style={styles.full} fallback={<BushFallback />} />
        ))
      ];
    }

    void playerCampHp;
    void enemyCampHp;
    return [];
  });
}

function villageItems(buildings: Buildings, playerCampHp: number): SceneItem[] {
  return [
    item("edge-tree-left", { x: 5, y: 35 }, 23, 20, (
      <AssetImage assetKey="terrainWoodTree" style={styles.full} fallback={<WoodFallback />} />
    )),
    item("edge-tree-right", { x: 95, y: 39 }, 24, 30, (
      <AssetImage assetKey="terrainWoodTree" style={styles.full} fallback={<WoodFallback />} />
    )),
    item("edge-bush-a", { x: 17, y: 31 }, 11, 32, (
      <AssetImage assetKey="terrainBush" style={styles.full} fallback={<BushFallback />} />
    )),
    item("edge-bush-b", { x: 75, y: 70 }, 11, 71, (
      <AssetImage assetKey="terrainBush" style={styles.full} fallback={<BushFallback />} />
    )),
    item("watch-post", BUILDING_SLOTS.watchPost, 20, 38, buildingNode(buildings.watchPost > 0, "buildingWatchPost", <WatchScaffold />)),
    item("hut", BUILDING_SLOTS.hut, 23, 49, buildingNode(buildings.hut > 0, "buildingHut", <ConstructionPad label="Hut" />)),
    item("player-camp", BUILDING_SLOTS.camp, 30, 54, (
      <CampArt player hpPercent={Math.max(0, Math.round((playerCampHp / CAMP_MAX_HP) * 100))} />
    )),
    item(
      "training-nest",
      BUILDING_SLOTS.trainingNest,
      21,
      58,
      buildingNode(buildings.trainingNest > 0, "buildingTrainingNest", <TrainingScaffold />)
    ),
    item("campfire", BUILDING_SLOTS.campfire, 16, 72, <Campfire />),
    item("crate-stack", { x: 24, y: 53 }, 7, 66, <CrateStack />),
    item("barrels", { x: 39, y: 55 }, 7, 67, <BarrelStack />),
    item("banana-basket", { x: 40, y: 66 }, 8, 76, <BananaBasket />),
    item("log-pile", { x: 58, y: 68 }, 10, 78, <LogPile />),
    item("rope-coil", { x: 72, y: 58 }, 7, 72, <RopeCoil />),
    item("village-rocks", { x: 25, y: 76 }, 8, 86, (
      <AssetImage assetKey="terrainRock" style={styles.full} fallback={<StoneFallback />} />
    ))
  ];
}

function enemyItems(tiles: Tile[], enemyCampHp: number): SceneItem[] {
  const enemyTile = tiles.find((tile) => tile.type === "enemyCamp");
  if (!enemyTile) {
    return [];
  }

  return [
    item("enemy-camp", pointForTile(enemyTile), 22, 42, (
      <CampArt player={false} hpPercent={Math.max(0, Math.round((enemyCampHp / CAMP_MAX_HP) * 100))} />
    )),
    item("enemy-rock", { x: 91, y: 34 }, 8, 38, (
      <AssetImage assetKey="terrainRock" style={styles.full} fallback={<StoneFallback />} />
    )),
    item("enemy-bush", { x: 72, y: 35 }, 10, 39, (
      <AssetImage assetKey="terrainBush" style={styles.full} fallback={<BushFallback />} />
    ))
  ];
}

function buildingNode(
  built: boolean,
  assetKey: "buildingHut" | "buildingTrainingNest" | "buildingWatchPost",
  fallback: ReactNode
) {
  return built ? <AssetImage assetKey={assetKey} style={styles.full} fallback={fallback} /> : fallback;
}

function unitSceneItem(unit: Unit, selected: boolean): SceneItem {
  const center = pointForUnit(unit);
  return item(unit.id, center, unit.owner === "player" ? 18 : 17, 80 + center.y, (
    <UnitArt unit={unit} selected={selected} />
  ));
}

function pointForUnit(unit: Unit): Point {
  if (unit.owner === "player" && unit.state === "idle") {
    const spots =
      unit.type === "fighter"
        ? [
            { x: 64, y: 62 },
            { x: 70, y: 57 },
            { x: 58, y: 58 }
          ]
        : [
            { x: 33, y: 62 },
            { x: 39, y: 58 },
            { x: 43, y: 66 }
          ];
    return spots[stableIndex(unit.id, spots.length)] ?? pointForTile(unit);
  }

  return pointForTile(unit);
}

function pointForTile(position: { x: number; y: number }): Point {
  const mapped = TILE_POINTS[`${position.x},${position.y}`];
  if (mapped) {
    return mapped;
  }

  const centerDistance = Math.abs(position.x - 4.5) + Math.abs(position.y - 5);
  return {
    x: 18 + position.x * 7 + Math.sin(position.y * 1.1) * 2.2,
    y: 22 + position.y * 6.7 + Math.cos(position.x * 0.9) * 2.4 + centerDistance * 0.3
  };
}

function item(key: string, center: Point, size: number, zIndex: number, node: ReactNode): SceneItem {
  return { key, center, size, zIndex, node };
}

function SceneSprite({ item }: { item: SceneItem }) {
  return (
    <View
      style={[
        styles.sprite,
        {
          left: `${item.center.x - item.size / 2}%`,
          top: `${item.center.y - item.size * 0.68}%`,
          width: `${item.size}%`,
          height: `${item.size}%`,
          zIndex: item.zIndex
        }
      ]}
    >
      {item.node}
    </View>
  );
}

function stableIndex(value: string, modulo: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash + value.charCodeAt(index) * (index + 1)) % 997;
  }

  return hash % modulo;
}

function CampArt({ player, hpPercent }: { player: boolean; hpPercent: number }) {
  const main = player ? theme.colors.player : theme.colors.enemy;
  const dark = player ? theme.colors.playerDark : theme.colors.enemyDark;
  const banner = player ? "#ffd95a" : "#efdfc6";

  return (
    <View style={styles.artWrap}>
      <AssetImage
        assetKey={player ? "buildingPlayerCamp" : "buildingEnemyCamp"}
        style={styles.full}
        fallback={<CampFallback main={main} dark={dark} banner={banner} />}
      />
      <HealthBar percent={hpPercent} enemy={!player} large />
    </View>
  );
}

function UnitArt({ unit, selected }: { unit: Unit; selected: boolean }) {
  const player = unit.owner === "player";
  const hpPercent = Math.max(0, Math.round((unit.hp / unit.maxHp) * 100));
  const sheet = getGameAsset("unitMonkeySheet");

  return (
    <View style={styles.unitWrap}>
      {selected ? <View style={[styles.selectionRing, { borderColor: player ? theme.colors.banana : "#f8efe4" }]} /> : null}
      <SpriteSheetImage
        source={sheet.source}
        sheetWidth={1341}
        sheetHeight={1173}
        frame={unitSpriteFrame(unit)}
        style={styles.unitSprite}
        fallback={<UnitFallback player={player} fighter={unit.type === "fighter"} />}
      />
      <HealthBar percent={hpPercent} enemy={!player} />
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

function unitSpriteFrame(unit: Unit): SpriteFrame {
  const row =
    unit.owner === "enemy"
      ? 3
      : unit.type === "fighter"
        ? 1
        : unit.type === "worker"
          ? 0
          : 2;

  return {
    x: 1084,
    y: row * 293 + 18,
    width: 230,
    height: 256
  };
}

function Campfire() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Circle cx="32" cy="42" r="20" fill="rgba(255, 145, 36, 0.22)" />
      <Line x1="17" y1="48" x2="47" y2="35" stroke="#6a3b1d" strokeWidth="6" strokeLinecap="round" />
      <Line x1="18" y1="35" x2="48" y2="49" stroke="#7b4b24" strokeWidth="6" strokeLinecap="round" />
      <Path d="M32 38 C22 30 34 20 31 11 C43 22 44 31 36 39 Z" fill="#ff8c1a" />
      <Path d="M31 39 C27 32 35 27 34 20 C42 31 37 37 33 43 Z" fill="#ffd95a" />
    </Svg>
  );
}

function ConstructionPad({ label }: { label: string }) {
  return (
    <View style={styles.padArt}>
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Ellipse cx="32" cy="48" rx="23" ry="9" fill="rgba(59, 37, 18, 0.35)" />
        <Path d="M14 42 L29 26 L50 36 L36 51 Z" fill="#8a6032" opacity="0.76" />
        <Line x1="18" y1="42" x2="49" y2="36" stroke="#d2a35f" strokeWidth="4" strokeLinecap="round" />
        <Line x1="29" y1="27" x2="36" y2="51" stroke="#5d3518" strokeWidth="3" strokeLinecap="round" />
        <Circle cx="20" cy="39" r="3" fill="#e6c176" />
        <Circle cx="46" cy="37" r="3" fill="#e6c176" />
      </Svg>
      <Text style={styles.padText}>{label}</Text>
    </View>
  );
}

function TrainingScaffold() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Ellipse cx="32" cy="50" rx="22" ry="8" fill="rgba(59, 37, 18, 0.36)" />
      <Line x1="17" y1="50" x2="25" y2="18" stroke="#7b4b24" strokeWidth="5" strokeLinecap="round" />
      <Line x1="47" y1="50" x2="39" y2="18" stroke="#7b4b24" strokeWidth="5" strokeLinecap="round" />
      <Line x1="21" y1="26" x2="43" y2="26" stroke="#c18b45" strokeWidth="5" strokeLinecap="round" />
      <Circle cx="32" cy="36" r="11" fill="#d7bd86" />
      <Circle cx="32" cy="36" r="7" fill="#b34a35" />
      <Circle cx="32" cy="36" r="3" fill="#f8efd2" />
    </Svg>
  );
}

function WatchScaffold() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Ellipse cx="32" cy="53" rx="20" ry="7" fill="rgba(59, 37, 18, 0.34)" />
      <Line x1="22" y1="52" x2="27" y2="20" stroke="#75451f" strokeWidth="5" strokeLinecap="round" />
      <Line x1="42" y1="52" x2="37" y2="20" stroke="#75451f" strokeWidth="5" strokeLinecap="round" />
      <Rect x="21" y="17" width="22" height="12" rx="3" fill="#a66b32" />
      <Path d="M18 18 L32 8 L46 18 Z" fill="#c84a3a" />
    </Svg>
  );
}

function CrateStack() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Ellipse cx="33" cy="51" rx="22" ry="7" fill="rgba(45, 28, 14, 0.32)" />
      <Rect x="12" y="30" width="20" height="18" rx="3" fill="#9c6530" stroke="#4d2a13" strokeWidth="2" />
      <Rect x="31" y="25" width="21" height="23" rx="3" fill="#b17635" stroke="#4d2a13" strokeWidth="2" />
      <Line x1="15" y1="33" x2="29" y2="46" stroke="#d6a45b" strokeWidth="2" />
      <Line x1="49" y1="28" x2="34" y2="46" stroke="#d6a45b" strokeWidth="2" />
    </Svg>
  );
}

function BarrelStack() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Ellipse cx="32" cy="51" rx="20" ry="7" fill="rgba(45, 28, 14, 0.32)" />
      <Rect x="16" y="20" width="18" height="28" rx="7" fill="#8a4f25" stroke="#4d2a13" strokeWidth="2" />
      <Rect x="32" y="27" width="17" height="22" rx="7" fill="#a4632c" stroke="#4d2a13" strokeWidth="2" />
      <Line x1="17" y1="28" x2="34" y2="28" stroke="#d3a25b" strokeWidth="3" />
      <Line x1="33" y1="34" x2="48" y2="34" stroke="#d3a25b" strokeWidth="3" />
      <Line x1="17" y1="41" x2="34" y2="41" stroke="#5a3117" strokeWidth="3" />
    </Svg>
  );
}

function LogPile() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Ellipse cx="32" cy="50" rx="24" ry="8" fill="rgba(45, 28, 14, 0.32)" />
      <Rect x="10" y="32" width="40" height="8" rx="4" fill="#8a4f25" transform="rotate(-9 30 36)" />
      <Rect x="15" y="40" width="40" height="8" rx="4" fill="#b06c32" transform="rotate(8 35 44)" />
      <Circle cx="13" cy="35" r="4" fill="#d49a54" />
      <Circle cx="52" cy="45" r="4" fill="#d49a54" />
    </Svg>
  );
}

function RopeCoil() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Ellipse cx="32" cy="51" rx="20" ry="6" fill="rgba(45, 28, 14, 0.28)" />
      <Circle cx="32" cy="34" r="18" fill="none" stroke="#d6a45b" strokeWidth="6" />
      <Circle cx="32" cy="34" r="10" fill="none" stroke="#8d5a2b" strokeWidth="5" />
      <Path d="M43 45 C50 48 52 53 48 58" stroke="#d6a45b" strokeWidth="4" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function BananaBasket() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Ellipse cx="32" cy="52" rx="19" ry="6" fill="rgba(45, 28, 14, 0.3)" />
      <Path d="M16 35 H49 L44 52 H21 Z" fill="#9b5d2b" stroke="#4d2a13" strokeWidth="2" />
      <Path d="M21 34 C24 18 39 18 43 34" fill="none" stroke="#d6a45b" strokeWidth="4" />
      <Path d="M24 29 C30 26 34 31 28 37" stroke="#ffd95a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path d="M34 27 C42 29 42 37 33 39" stroke="#f3c739" strokeWidth="5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function BananaFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Rect x="28" y="26" width="9" height="26" rx="4" fill="#7b4b24" />
      <Ellipse cx="20" cy="25" rx="20" ry="9" fill="#236f3d" transform="rotate(-30 20 25)" />
      <Ellipse cx="43" cy="25" rx="20" ry="9" fill="#2f9850" transform="rotate(29 43 25)" />
      <Ellipse cx="32" cy="18" rx="19" ry="9" fill="#47b35e" />
      <Path d="M36 31 C45 31 48 40 39 45" stroke="#ffd43b" strokeWidth="4.5" fill="none" />
    </Svg>
  );
}

function StoneFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Polygon points="13,45 23,22 43,16 54,34 45,51 23,53" fill="#7f898f" />
      <Polygon points="23,22 33,34 13,45" fill="#b7c0c4" />
      <Line x1="33" y1="24" x2="43" y2="45" stroke="#636c71" strokeWidth="3" />
    </Svg>
  );
}

function WoodFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Rect x="18" y="22" width="8" height="30" rx="3" fill="#70431f" />
      <Rect x="38" y="18" width="8" height="34" rx="3" fill="#875329" />
      <Circle cx="22" cy="20" r="14" fill="#2e7d43" />
      <Circle cx="42" cy="17" r="15" fill="#3b9b52" />
      <Circle cx="34" cy="26" r="13" fill="#256c3b" />
    </Svg>
  );
}

function BushFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Circle cx="22" cy="38" r="14" fill="#286c3d" />
      <Circle cx="36" cy="34" r="17" fill="#3a8d4d" />
      <Circle cx="48" cy="41" r="12" fill="#236238" />
      <Circle cx="40" cy="30" r="3" fill="#f4d35e" />
    </Svg>
  );
}

function CampFallback({ main, dark, banner }: { main: string; dark: string; banner: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Rect x="15" y="28" width="34" height="24" rx="5" fill={main} />
      <Polygon points="9,31 32,10 55,31" fill={dark} />
      <Rect x="28" y="39" width="9" height="13" rx="2" fill="#5a341f" />
      <Line x1="50" y1="15" x2="50" y2="44" stroke="#54321b" strokeWidth="4" />
      <Path d="M50 16 L60 21 L50 27 Z" fill={banner} />
      <Circle cx="20" cy="20" r="4" fill={banner} />
    </Svg>
  );
}

function UnitFallback({ player, fighter }: { player: boolean; fighter: boolean }) {
  const body = player ? "#8b5e35" : "#62321f";
  const face = player ? "#d9a86c" : "#c38452";
  return (
    <Svg width="88%" height="88%" viewBox="0 0 64 64">
      <Circle cx="20" cy="25" r="8" fill={body} />
      <Circle cx="44" cy="25" r="8" fill={body} />
      <Circle cx="32" cy="34" r="19" fill={body} />
      <Ellipse cx="32" cy="40" rx="12" ry="9" fill={face} />
      <Circle cx="25" cy="32" r="3" fill="#1d1612" />
      <Circle cx="39" cy="32" r="3" fill="#1d1612" />
      <Path d="M26 42 Q32 47 38 42" stroke="#1d1612" strokeWidth="3" fill="none" />
      {fighter ? (
        <>
          <Rect x="17" y="15" width="30" height="8" rx="4" fill={player ? "#ef473a" : "#2b1a13"} />
          <Line x1="47" y1="47" x2="59" y2="35" stroke="#efe3bb" strokeWidth="4" />
        </>
      ) : null}
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
    backgroundColor: "rgba(12, 25, 14, 0.12)"
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 18,
    borderColor: "rgba(0, 0, 0, 0.2)"
  },
  groundLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.98
  },
  decorLayer: {
    ...StyleSheet.absoluteFillObject
  },
  hitLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300
  },
  unitLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 250
  },
  sprite: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  hitZone: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  full: {
    width: "100%",
    height: "100%"
  },
  artWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  unitWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible"
  },
  unitSprite: {
    width: "100%",
    height: "100%",
    overflow: "visible",
    zIndex: 1
  },
  selectionRing: {
    position: "absolute",
    bottom: "10%",
    width: "74%",
    height: "24%",
    borderRadius: 999,
    borderWidth: 3,
    backgroundColor: "rgba(56, 228, 85, 0.22)"
  },
  hpTrack: {
    position: "absolute",
    left: "18%",
    right: "18%",
    top: "7%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(21, 37, 25, 0.78)",
    overflow: "hidden",
    zIndex: 2
  },
  hpTrackLarge: {
    left: "19%",
    right: "19%",
    top: "4%",
    height: 5
  },
  hpFill: {
    height: "100%"
  },
  moveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(105, 255, 114, 0.72)",
    shadowColor: "#85ff70",
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 }
  },
  attackRing: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(255, 238, 196, 0.92)",
    backgroundColor: "rgba(204, 67, 45, 0.48)"
  },
  selectedTileRing: {
    position: "absolute",
    width: 27,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(150, 255, 105, 0.95)",
    backgroundColor: "rgba(49, 198, 67, 0.18)"
  },
  feedbackBanner: {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: "5%",
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 226, 139, 0.62)",
    backgroundColor: "rgba(44, 31, 15, 0.84)",
    paddingHorizontal: 12,
    zIndex: 500
  },
  feedbackText: {
    color: "#ffe28b",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  padArt: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.86
  },
  padText: {
    position: "absolute",
    bottom: "8%",
    color: "#f3d891",
    fontSize: 7,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1
  }
});
