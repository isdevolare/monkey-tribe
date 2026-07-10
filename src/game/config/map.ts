import type { Tile, TileType, Unit, UnitType } from "../types/game";
import { BOARD_SIZE, ENEMY_CAMP, PLAYER_CAMP, UNIT_STATS } from "./constants";

const specialTiles: Array<{ x: number; y: number; type: TileType }> = [
  { ...PLAYER_CAMP, type: "playerCamp" },
  { ...ENEMY_CAMP, type: "enemyCamp" },
  { x: 0, y: 5, type: "bananaTree" },
  { x: 2, y: 6, type: "bananaTree" },
  { x: 4, y: 7, type: "bananaTree" },
  { x: 5, y: 3, type: "bananaTree" },
  { x: 3, y: 8, type: "stoneRock" },
  { x: 6, y: 5, type: "stoneRock" },
  { x: 7, y: 3, type: "stoneRock" },
  { x: 0, y: 8, type: "woodGrove" },
  { x: 3, y: 5, type: "woodGrove" },
  { x: 6, y: 2, type: "woodGrove" },
  { x: 8, y: 4, type: "woodGrove" },
  { x: 0, y: 0, type: "bush" },
  { x: 1, y: 0, type: "bush" },
  { x: 9, y: 0, type: "bush" },
  { x: 0, y: 9, type: "bush" },
  { x: 5, y: 8, type: "bush" },
  { x: 9, y: 9, type: "bush" }
];

const mudPathTiles = new Set([
  "1,8",
  "2,8",
  "3,8",
  "4,8",
  "4,7",
  "5,7",
  "5,6",
  "6,6",
  "6,5",
  "7,5",
  "7,4",
  "8,4",
  "8,3",
  "8,2",
  "8,1"
]);

function fallbackTileType(x: number, y: number): TileType {
  if (mudPathTiles.has(`${x},${y}`)) {
    return "mudPath";
  }

  if (x === 0 || y === 0 || x === BOARD_SIZE - 1 || y === BOARD_SIZE - 1) {
    return "jungle";
  }

  if ((x * 3 + y * 5) % 11 === 0) {
    return "jungle";
  }

  return (x + y) % 5 === 0 ? "empty" : "grass";
}

export function createInitialMap(): Tile[] {
  const tiles: Tile[] = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const special = specialTiles.find((tile) => tile.x === x && tile.y === y);
      tiles.push({
        x,
        y,
        type: special?.type ?? fallbackTileType(x, y),
        variant: (x * 17 + y * 23) % 4
      });
    }
  }

  return tiles;
}

export function createUnit(
  id: string,
  type: UnitType,
  owner: "player" | "enemy",
  x: number,
  y: number,
  now: number,
  /** Training Nest buff for player troops; 1 = base stats. */
  statMultiplier = 1
): Unit {
  const stats = UNIT_STATS[type];
  const hp = Math.round(stats.hp * statMultiplier);

  return {
    id,
    type,
    owner,
    x,
    y,
    hp,
    maxHp: hp,
    attack: Math.round(stats.attack * statMultiplier),
    range: stats.range,
    state: "idle",
    carriedResource: null,
    lastStepAt: now,
    lastActionAt: now
  };
}

export function createInitialUnits(now: number): Unit[] {
  return [
    createUnit("player-worker-1", "worker", "player", 1, 7, now)
  ];
}

export function findTile(tiles: Tile[], x: number, y: number): Tile | undefined {
  return tiles.find((tile) => tile.x === x && tile.y === y);
}
