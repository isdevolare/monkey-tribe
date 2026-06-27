import type { Position, Resources, UnitType } from "../types/game";

export const BOARD_SIZE = 10;

export const PLAYER_CAMP: Position = { x: 1, y: 8 };
export const ENEMY_CAMP: Position = { x: 8, y: 1 };

export const STARTING_RESOURCES: Resources = {
  bananas: 20,
  stones: 10
};

export const CAMP_MAX_HP = 120;
export const ENEMY_SPAWN_INTERVAL_MS = 45_000;
export const MOVE_INTERVAL_MS = 380;
export const ATTACK_INTERVAL_MS = 850;
export const GATHER_DURATION_MS = 950;
export const ENEMY_DETECTION_RANGE = 4;

export const GATHER_AMOUNTS: Record<ResourcesKey, number> = {
  bananas: 5,
  stones: 3
};

export const UNIT_COSTS: Record<UnitType, Resources> = {
  worker: { bananas: 10, stones: 0 },
  fighter: { bananas: 15, stones: 5 }
};

export const UNIT_STATS: Record<
  UnitType,
  { hp: number; attack: number; range: number }
> = {
  worker: { hp: 24, attack: 2, range: 1 },
  fighter: { hp: 42, attack: 8, range: 1 }
};

type ResourcesKey = keyof Resources;
