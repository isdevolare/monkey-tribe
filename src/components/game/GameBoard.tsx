import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from "react-native-svg";
import { AssetImage } from "./AssetImage";
import { SpriteSheetImage, type SpriteFrame } from "./SpriteSheetImage";
import { BOARD_SIZE, CAMP_MAX_HP } from "../../game/config/constants";
import { getGameAsset, type GameAssetKey } from "../../game/assets/gameAssets";
import type { Tile, TileType, Unit } from "../../game/types/game";
import { theme } from "../../theme/theme";

type GameBoardProps = {
  tiles: Tile[];
  units: Unit[];
  selectedUnitId: string | null;
  playerCampHp: number;
  enemyCampHp: number;
  onCellPress: (tile: Tile, unit?: Unit) => void;
};

export function GameBoard({
  tiles,
  units,
  selectedUnitId,
  playerCampHp,
  enemyCampHp,
  onCellPress
}: GameBoardProps) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - theme.spacing.lg * 2, 430);
  const tileSize = boardSize / BOARD_SIZE;
  const aliveUnits = units.filter((unit) => unit.state !== "dead" && unit.hp > 0);
  const selectedUnit = aliveUnits.find((unit) => unit.id === selectedUnitId);

  return (
    <View style={styles.boardWrap}>
      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
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
                styles.tile,
                tileStyle(tile.type),
                { width: tileSize, height: tileSize },
                reachable ? styles.reachableTile : null,
                attackHint ? styles.attackTile : null,
                selected ? styles.selectedTile : null
              ]}
            >
              <TerrainLayer tile={tile} />
              <TileArt tile={tile} campHp={campHpForTile(tile.type, playerCampHp, enemyCampHp)} />
              {reachable ? <View style={styles.reachableDot} /> : null}
              {attackHint ? <View style={styles.attackDot} /> : null}
              {tileUnit ? <UnitArt unit={tileUnit} selected={selected} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function campHpForTile(type: TileType, playerCampHp: number, enemyCampHp: number) {
  if (type === "playerCamp") {
    return playerCampHp;
  }

  if (type === "enemyCamp") {
    return enemyCampHp;
  }

  return null;
}

function tileStyle(type: TileType) {
  if (type === "jungle" || type === "bush") {
    return styles.jungle;
  }

  if (type === "mudPath") {
    return styles.mud;
  }

  if (type === "empty") {
    return styles.empty;
  }

  return styles.grass;
}

function terrainAssetKey(type: TileType): GameAssetKey {
  if (type === "jungle" || type === "bush") {
    return "terrainJungle";
  }

  if (type === "mudPath") {
    return "terrainMud";
  }

  if (type === "stoneRock") {
    return "terrainRock";
  }

  return "terrainGrass";
}

function TerrainLayer({ tile }: { tile: Tile }) {
  return (
    <AssetImage
      assetKey={terrainAssetKey(tile.type)}
      resizeMode="cover"
      style={styles.terrainAsset}
      fallback={<TerrainSpeckles tile={tile} />}
    />
  );
}

function TerrainSpeckles({ tile }: { tile: Tile }) {
  const color = tile.type === "mudPath" ? "rgba(87, 56, 30, 0.32)" : "rgba(23, 48, 34, 0.22)";
  const a = 10 + tile.variant * 7;
  const b = 44 - tile.variant * 5;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64" style={styles.terrainSvg}>
      <Circle cx={a} cy="14" r="2.5" fill={color} />
      <Circle cx={b} cy="47" r="2" fill={color} />
      <Path d={`M${12 + tile.variant * 4} 56 Q30 47 ${52 - tile.variant * 3} 55`} stroke={color} strokeWidth="2" fill="none" />
    </Svg>
  );
}

function TileArt({ tile, campHp }: { tile: Tile; campHp: number | null }) {
  if (tile.type === "bananaTree") {
    return (
      <AssetImage assetKey="terrainBananaTree" style={styles.propAsset} fallback={<BananaFallback />} />
    );
  }

  if (tile.type === "stoneRock") {
    return (
      <AssetImage assetKey="terrainRock" style={styles.propAsset} fallback={<StoneFallback />} />
    );
  }

  if (tile.type === "woodGrove") {
    return (
      <AssetImage assetKey="terrainWoodTree" style={styles.propAsset} fallback={<WoodFallback />} />
    );
  }

  if (tile.type === "bush") {
    return (
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Circle cx="22" cy="38" r="14" fill="#286c3d" />
        <Circle cx="36" cy="34" r="17" fill="#3a8d4d" />
        <Circle cx="48" cy="41" r="12" fill="#236238" />
        <Circle cx="40" cy="30" r="3" fill="#f4d35e" />
      </Svg>
    );
  }

  if (tile.type === "playerCamp" || tile.type === "enemyCamp") {
    const player = tile.type === "playerCamp";
    const main = player ? theme.colors.player : theme.colors.enemy;
    const dark = player ? theme.colors.playerDark : theme.colors.enemyDark;
    const banner = player ? "#ffd95a" : "#efdfc6";
    const hpPercent = campHp === null ? 100 : Math.max(0, Math.round((campHp / CAMP_MAX_HP) * 100));

    return (
      <View style={styles.campLayer} pointerEvents="none">
        <AssetImage
          assetKey={player ? "buildingPlayerCamp" : "buildingEnemyCamp"}
          style={styles.campAsset}
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

  return null;
}

function BananaFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Rect x="28" y="26" width="9" height="26" rx="4" fill="#7b4b24" />
      <Ellipse cx="20" cy="25" rx="20" ry="9" fill="#236f3d" transform="rotate(-30 20 25)" />
      <Ellipse cx="43" cy="25" rx="20" ry="9" fill="#2f9850" transform="rotate(29 43 25)" />
      <Ellipse cx="32" cy="18" rx="19" ry="9" fill="#47b35e" />
      <Path d="M36 31 C45 31 48 40 39 45" stroke="#ffd43b" strokeWidth="4.5" fill="none" />
      <Path d="M29 30 C20 32 20 40 27 43" stroke="#ffe479" strokeWidth="3.5" fill="none" />
    </Svg>
  );
}

function StoneFallback() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Polygon points="13,45 23,22 43,16 54,34 45,51 23,53" fill="#7f898f" />
      <Polygon points="23,22 33,34 13,45" fill="#b7c0c4" />
      <Polygon points="34,18 54,34 42,34" fill="#9aa4aa" />
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

function CampFallback({ main, dark, banner }: { main: string; dark: string; banner: string }) {
  return (
    <Svg width="100%" height="92%" viewBox="0 0 64 64">
      <Rect x="15" y="28" width="34" height="24" rx="5" fill={main} />
      <Polygon points="9,31 32,10 55,31" fill={dark} />
      <Rect x="28" y="39" width="9" height="13" rx="2" fill="#5a341f" />
      <Line x1="50" y1="15" x2="50" y2="44" stroke="#54321b" strokeWidth="4" />
      <Path d="M50 16 L60 21 L50 27 Z" fill={banner} />
      <Circle cx="20" cy="20" r="4" fill={banner} />
    </Svg>
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
    <View style={styles.unitLayer} pointerEvents="none">
      {selected ? <View style={[styles.selectionRing, { borderColor: ring }]} /> : null}
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
      <Text style={styles.unitLetter}>{unit.type === "fighter" ? "F" : "W"}</Text>
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
          <Line x1="47" y1="47" x2="41" y2="53" stroke="#6a4121" strokeWidth="5" />
        </>
      ) : (
        <>
          <Circle cx="49" cy="48" r="8" fill="#f5cc58" />
          <Path d="M45 50 C51 52 54 47 51 43" stroke="#6b431e" strokeWidth="3" fill="none" />
        </>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  boardWrap: {
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#13291c",
    backgroundColor: "#13291c",
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8
  },
  board: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: theme.colors.grassDark
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.35,
    borderColor: "rgba(18, 39, 27, 0.35)"
  },
  grass: {
    backgroundColor: "#73bf52"
  },
  jungle: {
    backgroundColor: "#3e8a45"
  },
  mud: {
    backgroundColor: "#9b7446"
  },
  empty: {
    backgroundColor: "#96cf68"
  },
  terrainSvg: {
    position: "absolute",
    opacity: 0.8
  },
  terrainAsset: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  propAsset: {
    width: "100%",
    height: "100%"
  },
  campAsset: {
    width: "100%",
    height: "92%"
  },
  unitAsset: {
    width: "92%",
    height: "92%",
    alignItems: "center",
    justifyContent: "center"
  },
  selectionRing: {
    position: "absolute",
    width: "82%",
    height: "82%",
    borderRadius: 999,
    borderWidth: 4,
    backgroundColor: "rgba(255, 217, 90, 0.12)"
  },
  selectedTile: {
    backgroundColor: "#d8f470"
  },
  reachableTile: {
    backgroundColor: "#9eda68"
  },
  attackTile: {
    backgroundColor: "#d06a56"
  },
  reachableDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 248, 217, 0.95)",
    backgroundColor: "rgba(255, 217, 90, 0.8)"
  },
  attackDot: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: "rgba(255, 248, 217, 0.95)",
    backgroundColor: "rgba(200, 74, 58, 0.8)"
  },
  campLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  campHpTrack: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 3,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(23, 48, 34, 0.45)",
    overflow: "hidden"
  },
  unitLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  hpTrack: {
    position: "absolute",
    left: 5,
    right: 5,
    top: 3,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(23, 48, 34, 0.45)",
    overflow: "hidden"
  },
  hpFill: {
    height: "100%"
  },
  unitLetter: {
    position: "absolute",
    right: 4,
    bottom: 2,
    minWidth: 14,
    textAlign: "center",
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "rgba(255, 248, 217, 0.94)",
    color: theme.colors.ink,
    fontSize: 9,
    fontWeight: "900"
  }
});
