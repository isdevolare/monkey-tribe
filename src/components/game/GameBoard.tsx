import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from "react-native-svg";
import { BOARD_SIZE } from "../../game/config/constants";
import type { Tile, Unit } from "../../game/types/game";
import { theme } from "../../theme/theme";

type GameBoardProps = {
  tiles: Tile[];
  units: Unit[];
  selectedUnitId: string | null;
  onCellPress: (tile: Tile, unit?: Unit) => void;
};

export function GameBoard({ tiles, units, selectedUnitId, onCellPress }: GameBoardProps) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - theme.spacing.lg * 2, 430);
  const tileSize = boardSize / BOARD_SIZE;
  const aliveUnits = units.filter((unit) => unit.state !== "dead" && unit.hp > 0);

  return (
    <View style={[styles.board, { width: boardSize, height: boardSize }]}>
      {tiles.map((tile) => {
        const tileUnit = aliveUnits.find((unit) => unit.x === tile.x && unit.y === tile.y);
        const selected = tileUnit?.id === selectedUnitId;

        return (
          <Pressable
            key={`${tile.x}-${tile.y}`}
            onPress={() => onCellPress(tile, tileUnit)}
            style={[
              styles.tile,
              tile.type === "empty" ? styles.empty : styles.grass,
              { width: tileSize, height: tileSize },
              selected ? styles.selectedTile : null
            ]}
          >
            <TileArt tile={tile} />
            {tileUnit ? <UnitArt unit={tileUnit} selected={selected} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function TileArt({ tile }: { tile: Tile }) {
  if (tile.type === "bananaTree") {
    return (
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Rect x="28" y="25" width="8" height="24" rx="3" fill="#7b4b24" />
        <Ellipse cx="22" cy="24" rx="18" ry="8" fill="#297c44" transform="rotate(-28 22 24)" />
        <Ellipse cx="42" cy="24" rx="18" ry="8" fill="#2f9850" transform="rotate(28 42 24)" />
        <Ellipse cx="32" cy="18" rx="18" ry="8" fill="#42aa59" />
        <Path d="M36 30 C45 31 47 40 39 43" stroke="#ffd43b" strokeWidth="4" fill="none" />
      </Svg>
    );
  }

  if (tile.type === "stoneRock") {
    return (
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Polygon points="16,45 24,24 42,18 52,35 44,49 24,51" fill="#8f999f" />
        <Polygon points="24,24 32,34 16,45" fill="#b3bcc0" />
        <Line x1="33" y1="24" x2="42" y2="44" stroke="#6f777c" strokeWidth="3" />
      </Svg>
    );
  }

  if (tile.type === "playerCamp" || tile.type === "enemyCamp") {
    const main = tile.type === "playerCamp" ? theme.colors.player : theme.colors.enemy;
    const dark = tile.type === "playerCamp" ? theme.colors.playerDark : theme.colors.enemyDark;
    return (
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Rect x="17" y="28" width="30" height="23" rx="4" fill={main} />
        <Polygon points="12,31 32,13 52,31" fill={dark} />
        <Rect x="28" y="38" width="8" height="13" rx="2" fill="#5a341f" />
        <Circle cx="20" cy="20" r="4" fill="#ffd95a" />
      </Svg>
    );
  }

  return null;
}

function UnitArt({ unit, selected }: { unit: Unit; selected: boolean }) {
  const body = unit.owner === "player" ? "#8b5e35" : "#653221";
  const badge = unit.type === "fighter" ? "#e04538" : "#f5cc58";
  const ring = unit.owner === "player" ? theme.colors.banana : "#f0ebe5";

  return (
    <View style={styles.unitLayer} pointerEvents="none">
      <Svg width="88%" height="88%" viewBox="0 0 64 64">
        {selected ? <Circle cx="32" cy="33" r="28" fill="none" stroke={ring} strokeWidth="5" /> : null}
        <Circle cx="20" cy="25" r="8" fill={body} />
        <Circle cx="44" cy="25" r="8" fill={body} />
        <Circle cx="32" cy="34" r="19" fill={body} />
        <Ellipse cx="32" cy="40" rx="12" ry="9" fill="#d6a46b" />
        <Circle cx="25" cy="32" r="3" fill="#1d1612" />
        <Circle cx="39" cy="32" r="3" fill="#1d1612" />
        <Path d="M26 42 Q32 47 38 42" stroke="#1d1612" strokeWidth="3" fill="none" />
        <Circle cx="49" cy="48" r="8" fill={badge} />
        {unit.type === "fighter" ? (
          <Line x1="45" y1="48" x2="53" y2="48" stroke="#fff3c1" strokeWidth="4" />
        ) : (
          <Path d="M45 50 C51 52 54 47 51 43" stroke="#6b431e" strokeWidth="3" fill="none" />
        )}
      </Svg>
      <View style={styles.hpTrack}>
        <View
          style={[
            styles.hpFill,
            {
              width: `${Math.max(0, Math.round((unit.hp / unit.maxHp) * 100))}%`,
              backgroundColor: unit.owner === "player" ? theme.colors.player : theme.colors.enemy
            }
          ]}
        />
      </View>
      <Text style={styles.unitLetter}>{unit.type === "fighter" ? "F" : "W"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 3,
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.grassDark
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(23, 48, 34, 0.28)"
  },
  grass: {
    backgroundColor: theme.colors.grass
  },
  empty: {
    backgroundColor: theme.colors.empty
  },
  selectedTile: {
    backgroundColor: "#dff781"
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
    left: 6,
    right: 6,
    bottom: 3,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(23, 48, 34, 0.35)",
    overflow: "hidden"
  },
  hpFill: {
    height: "100%"
  },
  unitLetter: {
    position: "absolute",
    right: 4,
    top: 2,
    minWidth: 14,
    textAlign: "center",
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "rgba(255, 248, 217, 0.9)",
    color: theme.colors.ink,
    fontSize: 9,
    fontWeight: "900"
  }
});
