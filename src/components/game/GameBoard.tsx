import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { SpriteSheetImage, type SpriteFrame } from "./SpriteSheetImage";
import { BOARD_SIZE, CAMP_MAX_HP } from "../../game/config/constants";
import { getGameAsset, type GameAssetKey } from "../../game/assets/gameAssets";
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
  onCellPress: (tile: Tile, unit?: Unit) => void;
};

type SceneItem = {
  key: string;
  x: number;
  y: number;
  size: number;
  zIndex: number;
  node: ReactNode;
};

type VisualCenter = {
  x: number;
  y: number;
};

const VISUAL_TILE_CENTERS: Record<string, VisualCenter> = {
  "0,0": { x: 12, y: 13 },
  "1,0": { x: 24, y: 11 },
  "9,0": { x: 90, y: 10 },
  "8,1": { x: 77, y: 18 },
  "7,1": { x: 67, y: 19 },
  "9,1": { x: 88, y: 20 },
  "8,2": { x: 77, y: 28 },
  "6,2": { x: 58, y: 13 },
  "5,3": { x: 79, y: 43 },
  "7,3": { x: 88, y: 35 },
  "8,4": { x: 91, y: 51 },
  "0,5": { x: 11, y: 55 },
  "3,5": { x: 17, y: 38 },
  "6,5": { x: 78, y: 61 },
  "2,6": { x: 25, y: 71 },
  "4,7": { x: 63, y: 75 },
  "1,7": { x: 35, y: 55 },
  "0,8": { x: 10, y: 82 },
  "1,8": { x: 50, y: 33 },
  "2,8": { x: 36, y: 64 },
  "3,8": { x: 35, y: 81 },
  "5,8": { x: 62, y: 86 },
  "0,9": { x: 12, y: 93 },
  "9,9": { x: 91, y: 91 }
};

const FENCE_POSTS = [
  { x: 17, y: 42, rotate: -18 },
  { x: 20, y: 32, rotate: -10 },
  { x: 29, y: 22, rotate: 12 },
  { x: 43, y: 18, rotate: 5 },
  { x: 58, y: 19, rotate: -8 },
  { x: 71, y: 27, rotate: -18 },
  { x: 79, y: 40, rotate: -10 },
  { x: 79, y: 55, rotate: 8 },
  { x: 70, y: 70, rotate: 18 },
  { x: 55, y: 78, rotate: 9 },
  { x: 39, y: 77, rotate: -8 },
  { x: 25, y: 68, rotate: -20 },
  { x: 17, y: 56, rotate: -8 }
];

export function GameBoard({
  tiles,
  units,
  selectedUnitId,
  buildings,
  playerCampHp,
  enemyCampHp,
  maxSize = 430,
  onCellPress
}: GameBoardProps) {
  const { width } = useWindowDimensions();
  const sceneSize = Math.min(width - theme.spacing.lg * 2, maxSize);
  const aliveUnits = units.filter((unit) => unit.state !== "dead" && unit.hp > 0);
  const selectedUnit = aliveUnits.find((unit) => unit.id === selectedUnitId);
  const sceneItems = [
    ...villageBuildingItems(buildings),
    ...villageDecorItems(),
    ...tiles.flatMap((tile) => visualItemsForTile(tile, playerCampHp, enemyCampHp)),
    ...aliveUnits.map((unit) => visualItemForUnit(unit, unit.id === selectedUnitId))
  ].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <View style={[styles.sceneWrap, { width: sceneSize, height: sceneSize }]}>
      <AssetImage
        assetKey="bgJungleGame"
        resizeMode="cover"
        style={styles.sceneBackground}
        fallback={<View style={styles.sceneFallback} />}
      />
      <View style={styles.sceneVignette} pointerEvents="none" />
      <View style={styles.terrainTextureLayer} pointerEvents="none">
        {tiles.map((tile) => (
          <View
            key={`texture-${tile.x}-${tile.y}`}
            style={[
              styles.terrainTexture,
              {
                left: `${(tile.x / BOARD_SIZE) * 100}%`,
                top: `${(tile.y / BOARD_SIZE) * 100}%`,
                width: `${100 / BOARD_SIZE}%`,
                height: `${100 / BOARD_SIZE}%`
              }
            ]}
          >
            <AssetImage
              assetKey={terrainTileAssetKey(tile.type)}
              resizeMode="cover"
              style={styles.fullAsset}
              fallback={<View style={styles.emptyTextureFallback} />}
            />
          </View>
        ))}
      </View>
      <VillagePathLayer />
      <CampFence />
      <Campfire />

      <View style={styles.visualLayer} pointerEvents="none">
        {sceneItems.map((item) => (
          <View
            key={item.key}
            style={[
              styles.sceneItem,
              {
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${item.size}%`,
                height: `${item.size}%`,
                zIndex: item.zIndex
              }
            ]}
          >
            {item.node}
          </View>
        ))}
      </View>

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

        return (
          <Pressable
            key={`${tile.x}-${tile.y}`}
            onPress={() => onCellPress(tile, tileUnit)}
            style={[
              styles.hitTile,
              {
                left: `${(tile.x / BOARD_SIZE) * 100}%`,
                top: `${(tile.y / BOARD_SIZE) * 100}%`,
                width: `${100 / BOARD_SIZE}%`,
                height: `${100 / BOARD_SIZE}%`
              }
            ]}
          >
            {reachable ? <View style={styles.reachableHint} /> : null}
            {attackHint ? <View style={styles.attackHint} /> : null}
            {selected ? <View style={styles.selectedHint} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function villageBuildingItems(buildings: Buildings): SceneItem[] {
  const items: SceneItem[] = [];

  items.push({
    key: "built-hut",
    ...scenePositionFromCenter({ x: 31, y: 41 }, 23),
    zIndex: 38,
    node:
      buildings.hut > 0 ? (
        <AssetImage assetKey="buildingHut" style={styles.fullAsset} fallback={<CampFallback main="#2fa866" dark="#1f7047" banner="#ffd95a" />} />
      ) : (
        <ConstructionPad label="Hut" />
      )
  });

  items.push({
    key: "built-training-nest",
    ...scenePositionFromCenter({ x: 65, y: 45 }, 20),
    zIndex: 45,
    node:
      buildings.trainingNest > 0 ? (
        <AssetImage assetKey="buildingTrainingNest" style={styles.fullAsset} fallback={<TargetFallback />} />
      ) : (
        <TrainingScaffold />
      )
  });

  items.push({
    key: "built-watch-post",
    ...scenePositionFromCenter({ x: 66, y: 25 }, 20),
    zIndex: 31,
    node:
      buildings.watchPost > 0 ? (
        <AssetImage assetKey="buildingWatchPost" style={styles.fullAsset} fallback={<TowerFallback />} />
      ) : (
        <WatchScaffold />
      )
  });

  return items;
}

function villageDecorItems(): SceneItem[] {
  return [
    decorItem("crate-left", { x: 24, y: 51 }, 7, 51, <CrateStack />),
    decorItem("barrel-hut", { x: 39, y: 48 }, 6, 49, <BarrelStack />),
    decorItem("banana-basket", { x: 42, y: 61 }, 8, 62, <BananaBasket />),
    decorItem("log-pile", { x: 57, y: 62 }, 10, 63, <LogPile />),
    decorItem("rope-training", { x: 73, y: 52 }, 7, 54, <RopeCoil />),
    decorItem("crate-watch", { x: 59, y: 32 }, 6, 36, <CrateStack />),
    decorItem("rock-scatter-a", { x: 22, y: 78 }, 8, 79, <AssetImage assetKey="terrainRock" style={styles.fullAsset} fallback={<StoneFallback />} />),
    decorItem("rock-scatter-b", { x: 74, y: 74 }, 7, 75, <AssetImage assetKey="terrainRock" style={styles.fullAsset} fallback={<StoneFallback />} />),
    decorItem("bush-hut-a", { x: 22, y: 39 }, 9, 40, <AssetImage assetKey="terrainBush" style={styles.fullAsset} fallback={<BushFallback />} />),
    decorItem("bush-hut-b", { x: 39, y: 37 }, 8, 40, <AssetImage assetKey="terrainBush" style={styles.fullAsset} fallback={<BushFallback />} />),
    decorItem("bush-training", { x: 73, y: 42 }, 9, 45, <AssetImage assetKey="terrainBush" style={styles.fullAsset} fallback={<BushFallback />} />),
    decorItem("edge-tree-left", { x: 4, y: 30 }, 22, 28, <AssetImage assetKey="terrainWoodTree" style={styles.fullAsset} fallback={<WoodFallback />} />),
    decorItem("edge-tree-right", { x: 95, y: 31 }, 23, 31, <AssetImage assetKey="terrainWoodTree" style={styles.fullAsset} fallback={<WoodFallback />} />),
    decorItem("edge-tree-bottom", { x: 88, y: 87 }, 20, 88, <AssetImage assetKey="terrainWoodTree" style={styles.fullAsset} fallback={<WoodFallback />} />)
  ];
}

function decorItem(
  key: string,
  center: VisualCenter,
  size: number,
  zIndex: number,
  node: ReactNode
): SceneItem {
  return {
    key,
    ...scenePositionFromCenter(center, size),
    zIndex,
    node
  };
}

function terrainTileAssetKey(type: Tile["type"]): GameAssetKey {
  if (type === "jungle" || type === "bush") {
    return "terrainJungleTile";
  }

  if (type === "mudPath") {
    return "terrainMudPathTile";
  }

  if (type === "empty") {
    return "terrainGrassTile";
  }

  return "terrainGrassTile";
}

function visualItemsForTile(tile: Tile, playerCampHp: number, enemyCampHp: number): SceneItem[] {
  if (tile.type === "bananaTree") {
    return [
      {
        key: `banana-${tile.x}-${tile.y}`,
        ...scenePosition(tile.x, tile.y, 15),
        zIndex: tile.y * 10,
        node: <AssetImage assetKey="terrainBananaTree" style={styles.fullAsset} fallback={<BananaFallback />} />
      }
    ];
  }

  if (tile.type === "stoneRock") {
    return [
      {
        key: `stone-${tile.x}-${tile.y}`,
        ...scenePosition(tile.x, tile.y, 10),
        zIndex: tile.y * 10,
        node: <AssetImage assetKey="terrainRock" style={styles.fullAsset} fallback={<StoneFallback />} />
      }
    ];
  }

  if (tile.type === "woodGrove" || tile.type === "bush") {
    return [
      {
        key: `wood-${tile.x}-${tile.y}`,
        ...scenePosition(tile.x, tile.y, tile.type === "bush" ? 11 : 19),
        zIndex: tile.y * 10,
        node:
          tile.type === "bush" ? (
            <AssetImage assetKey="terrainBush" style={styles.fullAsset} fallback={<BushFallback />} />
          ) : (
            <AssetImage assetKey="terrainWoodTree" style={styles.fullAsset} fallback={<WoodFallback />} />
          )
      }
    ];
  }

  if (tile.type === "playerCamp" || tile.type === "enemyCamp") {
    const player = tile.type === "playerCamp";
    const hp = player ? playerCampHp : enemyCampHp;
    return [
      {
        key: `camp-${tile.type}`,
        ...scenePosition(tile.x, tile.y, player ? 24 : 18),
        zIndex: player ? 34 : tile.y * 10 + 2,
        node: (
          <CampArt
            player={player}
            hpPercent={Math.max(0, Math.round((hp / CAMP_MAX_HP) * 100))}
          />
        )
      }
    ];
  }

  return [];
}

function visualItemForUnit(unit: Unit, selected: boolean): SceneItem {
  const unitSize = unit.owner === "player" ? 17 : 16;
  const center = visualCenterForUnit(unit);
  return {
    key: unit.id,
    ...scenePositionFromCenter(center, unitSize),
    zIndex: Math.round(center.y) + 8,
    node: <UnitArt unit={unit} selected={selected} />
  };
}

function scenePosition(x: number, y: number, size: number) {
  const center = visualCenterForTile(x, y);
  return scenePositionFromCenter(center, size);
}

function scenePositionFromCenter(center: VisualCenter, size: number) {
  return {
    x: center.x - size / 2,
    y: center.y - size * 0.64,
    size
  };
}

function visualCenterForTile(x: number, y: number): VisualCenter {
  const mapped = VISUAL_TILE_CENTERS[`${x},${y}`];
  if (mapped) {
    return mapped;
  }

  return {
    x: 18 + x * 7.2 + Math.sin(y * 1.7) * 2.6,
    y: 20 + y * 6.8 + Math.cos(x * 1.3) * 2.2
  };
}

function visualCenterForUnit(unit: Unit): VisualCenter {
  if (unit.owner === "player" && unit.state === "idle") {
    const workerSpots = [
      { x: 31, y: 58 },
      { x: 37, y: 54 },
      { x: 43, y: 62 }
    ];
    const fighterSpots = [
      { x: 64, y: 58 },
      { x: 70, y: 53 },
      { x: 58, y: 55 }
    ];
    const spots = unit.type === "fighter" ? fighterSpots : workerSpots;
    return spots[stableIndex(unit.id, spots.length)] ?? visualCenterForTile(unit.x, unit.y);
  }

  return visualCenterForTile(unit.x, unit.y);
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
    <View style={styles.campArt}>
      <AssetImage
        assetKey={player ? "buildingPlayerCamp" : "buildingEnemyCamp"}
        style={styles.fullAsset}
        fallback={<CampFallback main={main} dark={dark} banner={banner} />}
      />
      <View style={styles.campHpTrack}>
        <View
          style={[
            styles.hpFill,
            {
              width: `${hpPercent}%`,
              backgroundColor: player ? theme.colors.player : theme.colors.enemy
            }
          ]}
        />
      </View>
    </View>
  );
}

function CampFence() {
  return (
    <View style={styles.fenceLayer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Path
          d="M18 48 C20 27 35 16 53 18 C72 20 83 35 80 55 C77 75 58 83 38 77 C23 73 15 62 18 48 Z"
          fill="rgba(75, 102, 45, 0.08)"
        />
        <Path
          d="M18 48 C20 27 35 16 53 18 C72 20 83 35 80 55 C77 75 58 83 38 77 C23 73 15 62 18 48 Z"
          fill="none"
          stroke="rgba(96, 61, 29, 0.9)"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        {FENCE_POSTS.map((post) => (
          <Rect
            key={`${post.x}-${post.y}`}
            x={post.x - 1.3}
            y={post.y - 4}
            width="2.6"
            height="8"
            rx="1.1"
            fill="#8b5a2b"
            stroke="#4e2d16"
            strokeWidth="0.45"
            transform={`rotate(${post.rotate} ${post.x} ${post.y})`}
          />
        ))}
      </Svg>
    </View>
  );
}

function VillagePathLayer() {
  return (
    <View style={styles.pathLayer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Path
          d="M28 54 C37 45 45 42 50 43 C56 43 63 47 72 55"
          stroke="rgba(127, 87, 45, 0.56)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M50 43 C47 52 48 58 53 66"
          stroke="rgba(127, 87, 45, 0.5)"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M50 43 C58 36 62 31 68 25"
          stroke="rgba(127, 87, 45, 0.48)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <Ellipse cx="50" cy="54" rx="25" ry="22" fill="none" stroke="rgba(169, 116, 57, 0.32)" strokeWidth="5" strokeDasharray="4 6" />
      </Svg>
    </View>
  );
}

function Campfire() {
  return (
    <View style={styles.campfire} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Circle cx="32" cy="42" r="18" fill="rgba(255, 163, 40, 0.2)" />
        <Line x1="17" y1="48" x2="47" y2="35" stroke="#6a3b1d" strokeWidth="6" strokeLinecap="round" />
        <Line x1="18" y1="35" x2="48" y2="49" stroke="#7b4b24" strokeWidth="6" strokeLinecap="round" />
        <Path d="M32 38 C22 30 34 20 31 11 C43 22 44 31 36 39 Z" fill="#ff8c1a" />
        <Path d="M31 39 C27 32 35 27 34 20 C42 31 37 37 33 43 Z" fill="#ffd95a" />
      </Svg>
    </View>
  );
}

function UnitArt({ unit, selected }: { unit: Unit; selected: boolean }) {
  const player = unit.owner === "player";
  const body = player ? "#8b5e35" : "#62321f";
  const face = player ? "#d9a86c" : "#c38452";
  const ring = player ? theme.colors.banana : "#f0ebe5";
  const hpPercent = Math.max(0, Math.round((unit.hp / unit.maxHp) * 100));
  const sheet = getGameAsset("unitMonkeySheet");

  return (
    <View style={styles.unitArt}>
      {selected ? <View style={[styles.selectionRing, { borderColor: ring }]} /> : null}
      <AssetImage
        assetKey={unitAssetKey(unit)}
        style={styles.unitAsset}
        fallback={
          <SpriteSheetImage
            source={sheet.source}
            sheetWidth={1341}
            sheetHeight={1173}
            frame={unitSpriteFrame(unit)}
            style={styles.unitAsset}
            fallback={
              <UnitFallback
                selected={false}
                ring={ring}
                body={body}
                face={face}
                player={player}
                fighter={unit.type === "fighter"}
              />
            }
          />
        }
      />
      <View style={styles.hpTrack}>
        <View
          style={[
            styles.hpFill,
            {
              width: `${hpPercent}%`,
              backgroundColor: player ? theme.colors.player : theme.colors.enemy
            }
          ]}
        />
      </View>
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

function unitAssetKey(unit: Unit): GameAssetKey {
  if (unit.owner === "enemy") {
    return "unitEnemyFighter";
  }

  return unit.type === "fighter" ? "unitFighter" : "unitWorker";
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

function TargetFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Rect x="14" y="35" width="36" height="16" rx="4" fill="#7b4b24" />
      <Circle cx="32" cy="28" r="16" fill="#e9d5a2" />
      <Circle cx="32" cy="28" r="10" fill="#c84a3a" />
      <Circle cx="32" cy="28" r="4" fill="#f6f0d2" />
      <Line x1="48" y1="12" x2="34" y2="28" stroke="#d6a46b" strokeWidth="4" />
    </Svg>
  );
}

function TowerFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Rect x="22" y="25" width="20" height="28" rx="3" fill="#7b4b24" />
      <Polygon points="16,28 32,12 48,28" fill="#c84a3a" />
      <Rect x="28" y="37" width="8" height="16" rx="2" fill="#4c2b18" />
      <Line x1="18" y1="18" x2="10" y2="9" stroke="#efe3bb" strokeWidth="4" />
      <Line x1="46" y1="18" x2="54" y2="9" stroke="#efe3bb" strokeWidth="4" />
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

function UnitFallback({
  selected,
  ring,
  body,
  face,
  player,
  fighter
}: {
  selected: boolean;
  ring: string;
  body: string;
  face: string;
  player: boolean;
  fighter: boolean;
}) {
  return (
    <Svg width="88%" height="88%" viewBox="0 0 64 64">
      {selected ? <Circle cx="32" cy="33" r="29" fill="none" stroke={ring} strokeWidth="5" /> : null}
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
  sceneWrap: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(93, 145, 70, 0.55)",
    backgroundColor: "#18331f",
    shadowColor: "#000",
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  sceneBackground: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  sceneFallback: {
    flex: 1,
    backgroundColor: "#24442b"
  },
  sceneVignette: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(16, 34, 20, 0.08)"
  },
  terrainTextureLayer: {
    position: "absolute",
    top: "10%",
    right: "8%",
    bottom: "8%",
    left: "8%",
    opacity: 0.16,
    overflow: "hidden",
    borderRadius: 120
  },
  terrainTexture: {
    position: "absolute"
  },
  emptyTextureFallback: {
    flex: 1,
    backgroundColor: "rgba(101, 160, 67, 0.2)"
  },
  fenceLayer: {
    position: "absolute",
    top: "8%",
    right: "4%",
    bottom: "6%",
    left: "5%"
  },
  campfire: {
    position: "absolute",
    left: "42%",
    top: "44%",
    width: "16%",
    height: "16%",
    zIndex: 52
  },
  pathLayer: {
    position: "absolute",
    top: "4%",
    right: "3%",
    bottom: "4%",
    left: "3%",
    opacity: 0.96
  },
  visualLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  sceneItem: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  hitTile: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  fullAsset: {
    width: "100%",
    height: "100%"
  },
  campArt: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  campHpTrack: {
    position: "absolute",
    left: "18%",
    right: "18%",
    top: "3%",
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(23, 48, 34, 0.55)",
    overflow: "hidden"
  },
  unitArt: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  unitAsset: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  padArt: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.82
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
  },
  selectionRing: {
    position: "absolute",
    bottom: "11%",
    width: "70%",
    height: "23%",
    borderRadius: 999,
    borderWidth: 3,
    backgroundColor: "rgba(55, 219, 85, 0.22)"
  },
  hpTrack: {
    position: "absolute",
    left: "16%",
    right: "16%",
    top: "7%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(23, 48, 34, 0.55)",
    overflow: "hidden"
  },
  hpFill: {
    height: "100%"
  },
  reachableHint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(100, 255, 112, 0.62)"
  },
  attackHint: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255, 248, 217, 0.82)",
    backgroundColor: "rgba(200, 74, 58, 0.55)"
  },
  selectedHint: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(138, 255, 98, 0.9)"
  }
});
