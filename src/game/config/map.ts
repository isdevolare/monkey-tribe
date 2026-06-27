import type { Tile, TileType, Unit } from "../types/game";
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
  { x: 7, y: 3, type: "stoneRock" }
];

export function createInitialMap(): Tile[] {
  const tiles: Tile[] = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const special = specialTiles.find((tile) => tile.x === x && tile.y === y);
      tiles.push({
        x,
        y,
        type: special?.type ?? ((x + y) % 4 === 0 ? "empty" : "grass")
      });
    }
  }

  return tiles;
}

export function createUnit(
  id: string,
  type: "worker" | "fighter",
  owner: "player" | "enemy",
  x: number,
  y: number,
  now: number
): Unit {
  const stats = UNIT_STATS[type];

  return {
    id,
    type,
    owner,
    x,
    y,
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    range: stats.range,
    state: "idle",
    carriedResource: null,
    lastStepAt: now,
    lastActionAt: now
  };
}

export function createInitialUnits(now: number): Unit[] {
  return [
    createUnit("player-worker-1", "worker", "player", 1, 7, now),
    createUnit("player-fighter-1", "fighter", "player", 2, 8, now),
    createUnit("enemy-fighter-1", "fighter", "enemy", 8, 2, now),
    createUnit("enemy-fighter-2", "fighter", "enemy", 7, 1, now),
    createUnit("enemy-fighter-3", "fighter", "enemy", 9, 1, now)
  ];
}

export function findTile(tiles: Tile[], x: number, y: number): Tile | undefined {
  return tiles.find((tile) => tile.x === x && tile.y === y);
}
