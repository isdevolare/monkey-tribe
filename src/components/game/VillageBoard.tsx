import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { WanderingUnit } from "./LivelyUnit";
import type { GameAssetKey } from "../../game/assets/gameAssets";
import { buildingName } from "../../game/config/buildings";
import { t } from "../../game/i18n";
import type { Lang, Tile, Unit, VillageBuilding, VillageBuildingType } from "../../game/types/game";
import { theme } from "../../theme/theme";

type VillageBoardProps = {
  tiles: Tile[];
  units: Unit[];
  buildings: VillageBuilding[];
  lang: Lang;
  maxSize?: number;
  feedbackText?: string;
  selectedType?: VillageBuildingType | null;
  onBuildingPress: (type: VillageBuildingType) => void;
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
  "8,1": { x: 79, y: 24 },
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

const CAMPFIRE_SLOT: Point = { x: 47, y: 52 };

// Where each building sits on the painted scene + which sprite represents it.
const BUILDING_LAYOUT: Record<
  VillageBuildingType,
  { point: Point; size: number; asset: GameAssetKey }
> = {
  clanHall: { point: { x: 47, y: 38 }, size: 30, asset: "buildingPlayerCamp" },
  bananaGrove: { point: { x: 24, y: 26 }, size: 17, asset: "terrainBananaTree" },
  lumberCamp: { point: { x: 17, y: 49 }, size: 21, asset: "terrainWoodTree" },
  stoneQuarry: { point: { x: 78, y: 47 }, size: 15, asset: "terrainRock" },
  watchTower: { point: { x: 73, y: 27 }, size: 20, asset: "buildingWatchPost" },
  workerShelter: { point: { x: 30, y: 63 }, size: 22, asset: "buildingHut" },
  trainingNest: { point: { x: 65, y: 61 }, size: 21, asset: "buildingTrainingNest" }
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

export function VillageBoard({
  tiles,
  units,
  buildings,
  lang,
  maxSize = 430,
  feedbackText,
  selectedType,
  onBuildingPress
}: VillageBoardProps) {
  const { width } = useWindowDimensions();
  const sceneWidth = Math.min(width - theme.spacing.lg * 2, maxSize);
  const sceneHeight = sceneWidth * 0.94;
  const aliveUnits = units.filter(
    (unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0
  );
  const decorativeItems = [...resourceItems(tiles), ...sceneryItems()].sort(
    (a, b) => a.zIndex - b.zIndex
  );
  const unitItems = aliveUnits
    .map((unit) => unitSceneItem(unit, lang))
    .sort((a, b) => a.zIndex - b.zIndex);
  const buildingSprites = buildings
    .map((building) => ({ building, layout: BUILDING_LAYOUT[building.type] }))
    .sort((a, b) => a.layout.point.y - b.layout.point.y);

  return (
    <View style={[styles.scene, { width: sceneWidth, height: sceneHeight }]}>
      <SceneBackground />
      <VillageGround />

      <View style={styles.decorLayer} pointerEvents="none">
        {decorativeItems.map((item) => (
          <SceneSprite item={item} key={item.key} />
        ))}
      </View>

      <View style={styles.unitLayer} pointerEvents="none">
        {unitItems.map((item) => (
          <SceneSprite item={item} key={item.key} />
        ))}
      </View>

      <View style={styles.buildingLayer}>
        {buildingSprites.map(({ building, layout }) => (
          <BuildingSprite
            key={building.type}
            building={building}
            layout={layout}
            lang={lang}
            selected={selectedType === building.type}
            onPress={() => onBuildingPress(building.type)}
          />
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

function BuildingSprite({
  building,
  layout,
  lang,
  selected,
  onPress
}: {
  building: VillageBuilding;
  layout: { point: Point; size: number; asset: GameAssetKey };
  lang: Lang;
  selected: boolean;
  onPress: () => void;
}) {
  const { point, size, asset } = layout;
  const art = assetForBuilding(building, asset);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.buildingSprite,
        {
          left: `${point.x - size / 2}%`,
          top: `${point.y - size * 0.68}%`,
          width: `${size}%`,
          height: `${size}%`,
          zIndex: Math.round(point.y)
        }
      ]}
    >
      {selected ? <View style={styles.buildingSelected} pointerEvents="none" /> : null}
      <AssetImage assetKey={art} style={styles.full} fallback={<View style={styles.assetMissing} />} />
      <View style={styles.buildingTag} pointerEvents="none">
        <Text style={styles.buildingTagName} numberOfLines={1}>
          {buildingName(building.type, lang)}
        </Text>
        <Text style={styles.buildingTagLevel}>
          {t("common.level", lang)} {building.level}
        </Text>
      </View>
    </Pressable>
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

function resourceItems(tiles: Tile[]): SceneItem[] {
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
    return [];
  });
}

function prop(key: string, center: Point, size: number, asset: GameAssetKey): SceneItem {
  return item(key, center, size, Math.round(center.y * 10), (
    <AssetImage assetKey={asset} style={styles.full} fallback={<View style={styles.assetMissing} />} />
  ));
}

function sceneryItems(): SceneItem[] {
  return [
    item("edge-tree-left", { x: 5, y: 34 }, 22, 18, (
      <AssetImage assetKey="terrainWoodTree" style={styles.full} fallback={<WoodFallback />} />
    )),
    item("edge-tree-right", { x: 95, y: 38 }, 23, 22, (
      <AssetImage assetKey="terrainWoodTree" style={styles.full} fallback={<WoodFallback />} />
    )),
    item("edge-bush-a", { x: 10, y: 72 }, 11, 74, (
      <AssetImage assetKey="terrainBush" style={styles.full} fallback={<BushFallback />} />
    )),
    item("edge-bush-b", { x: 90, y: 70 }, 11, 72, (
      <AssetImage assetKey="terrainBush" style={styles.full} fallback={<BushFallback />} />
    )),
    // Lived-in village props scattered near the buildings.
    prop("prop-campfire", CAMPFIRE_SLOT, 12, "propCampfire"),
    prop("prop-log", { x: 11, y: 61 }, 11, "propLogPile"),
    prop("prop-dummy", { x: 80, y: 64 }, 10, "propTrainingDummy"),
    prop("prop-basket", { x: 39, y: 58 }, 8, "propBananaBasket"),
    prop("prop-crate", { x: 35, y: 49 }, 7, "propCrate"),
    prop("prop-barrel", { x: 59, y: 50 }, 7, "propBarrel"),
    prop("prop-rope", { x: 62, y: 70 }, 6, "propRopeCoil")
  ];
}

function unitSceneItem(unit: Unit, lang: Lang): SceneItem {
  const center = pointForUnit(unit);
  return item(unit.id, center, unit.type === "fighter" ? 15 : 14, 80 + center.y, (
    <UnitArt unit={unit} lang={lang} />
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


function UnitArt({ unit, lang }: { unit: Unit; lang: Lang }) {
  const player = unit.owner === "player";

  return (
    <WanderingUnit seed={stableIndex(unit.id, 97)} style={styles.unitWrap}>
      <AssetImage
        assetKey={unitAssetKey(unit)}
        style={styles.unitAsset}
        imageStyle={styles.unitImage}
        fallback={<UnitFallback player={player} fighter={unit.type === "fighter"} />}
      />
      {player ? (
        <View style={styles.unitLabel} pointerEvents="none">
          <View style={styles.unitLabelPill}>
            <Text style={styles.unitLabelText}>{t(`unit.${unit.type}`, lang)}</Text>
          </View>
        </View>
      ) : null}
    </WanderingUnit>
  );
}

// Newer generated art for some buildings; the Clan Hall changes with level.
function assetForBuilding(building: VillageBuilding, fallback: GameAssetKey): GameAssetKey {
  if (building.type === "clanHall") {
    if (building.level >= 3) {
      return "buildingPlayerCampL3";
    }
    if (building.level >= 2) {
      return "buildingPlayerCampL2";
    }
    return "buildingPlayerCamp";
  }
  if (building.type === "watchTower") {
    return "buildingArcherTower";
  }
  if (building.type === "trainingNest") {
    return "buildingWarriorBarracks";
  }
  return fallback;
}

function unitAssetKey(unit: Unit): GameAssetKey {
  if (unit.owner === "enemy") {
    return unit.type === "archer" ? "unitEnemyArcher" : "unitEnemyWarrior";
  }

  if (unit.type === "archer") {
    return "unitArcher";
  }
  return unit.type === "fighter" ? "unitWarrior" : "unitWorker";
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
  buildingLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200
  },
  buildingSprite: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  buildingSelected: {
    position: "absolute",
    left: "8%",
    right: "8%",
    bottom: "2%",
    height: "30%",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(150, 255, 105, 0.95)",
    backgroundColor: "rgba(49, 198, 67, 0.18)"
  },
  buildingTag: {
    position: "absolute",
    top: "-2%",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.35)",
    backgroundColor: "rgba(17, 20, 14, 0.82)"
  },
  buildingTagName: {
    color: theme.colors.paper,
    fontSize: 9,
    fontWeight: "900", fontFamily: theme.fonts.heavy
  },
  buildingTagLevel: {
    color: "#e2b15a",
    fontSize: 8,
    fontWeight: "900", fontFamily: theme.fonts.heavy
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
  unitAsset: {
    width: "100%",
    height: "100%",
    zIndex: 1
  },
  unitImage: {
    width: "100%",
    height: "100%"
  },
  unitLabel: {
    position: "absolute",
    bottom: "-8%",
    left: "-35%",
    right: "-35%",
    alignItems: "center",
    zIndex: 2
  },
  unitLabelPill: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 224, 151, 0.3)",
    backgroundColor: "rgba(17, 20, 14, 0.82)",
    paddingHorizontal: 5,
    paddingVertical: 1
  },
  unitLabelText: {
    color: theme.colors.paper,
    fontSize: 8,
    fontFamily: theme.fonts.heavy
  },
  unbuiltAsset: {
    opacity: 0.46
  },
  assetMissing: {
    flex: 1
  },
  resourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 224, 91, 0.72)",
    shadowColor: "#85ff70",
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 }
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
    fontWeight: "900", fontFamily: theme.fonts.heavy,
    textAlign: "center"
  },
});
