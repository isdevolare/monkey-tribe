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
    ...baseCampItems(buildings),
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

function baseCampItems(buildings: Buildings): SceneItem[] {
  const items: SceneItem[] = [];

  if (buildings.hut > 0) {
    items.push({
      key: "built-hut",
      x: 46,
      y: 12,
      size: 22,
      zIndex: 18,
      node: <AssetImage assetKey="buildingHut" style={styles.fullAsset} fallback={<CampFallback main="#2fa866" dark="#1f7047" banner="#ffd95a" />} />
    });
  }

  if (buildings.trainingNest > 0) {
    items.push({
      key: "built-training-nest",
      x: 60,
      y: 37,
      size: 18,
      zIndex: 42,
      node: <AssetImage assetKey="buildingTrainingNest" style={styles.fullAsset} fallback={<TargetFallback />} />
    });
  }

  if (buildings.watchPost > 0) {
    items.push({
      key: "built-watch-post",
      x: 73,
      y: 27,
      size: 18,
      zIndex: 35,
      node: <AssetImage assetKey="buildingWatchPost" style={styles.fullAsset} fallback={<TowerFallback />} />
    });
  }

  return items;
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
        ...scenePosition(tile.x, tile.y, 14),
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
        ...scenePosition(tile.x, tile.y, tile.type === "bush" ? 12 : 15),
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
        ...scenePosition(tile.x, tile.y, 18),
        zIndex: tile.y * 10 + 2,
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
  return {
    key: unit.id,
    ...scenePosition(unit.x, unit.y, 14),
    zIndex: unit.y * 10 + 5,
    node: <UnitArt unit={unit} selected={selected} />
  };
}

function scenePosition(x: number, y: number, size: number) {
  return {
    x: (x + 0.5) * 10 - size / 2,
    y: (y + 0.5) * 10 - size * 0.62,
    size
  };
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
          d="M17 38 C24 18 47 8 69 18 C87 27 91 51 80 70 C68 90 36 91 20 72 C10 60 10 48 17 38 Z"
          fill="none"
          stroke="rgba(111, 74, 38, 0.82)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="3 2"
        />
        <Path
          d="M20 41 C27 23 48 15 67 23 C82 30 85 50 76 66 C65 81 38 82 24 67 C15 57 14 48 20 41 Z"
          fill="rgba(77, 112, 46, 0.08)"
        />
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
    left: "43%",
    top: "42%",
    width: "15%",
    height: "15%",
    zIndex: 44
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
