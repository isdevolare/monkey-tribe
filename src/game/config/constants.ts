import type { Position, Resources, UnitType } from "../types/game";

export const BOARD_SIZE = 10;

export const PLAYER_CAMP: Position = { x: 1, y: 8 };
export const ENEMY_CAMP: Position = { x: 8, y: 1 };

export const STARTING_RESOURCES: Resources = {
  bananas: 100,
  stones: 60,
  wood: 80
};

export const CAMP_MAX_HP = 120;
export const MOVE_INTERVAL_MS = 380;
export const ATTACK_INTERVAL_MS = 850;
export const ENEMY_DETECTION_RANGE = 4;
export const WATCH_TOWER_DAMAGE_REDUCTION = 2;

export const UNIT_COSTS: Record<UnitType, Resources> = {
  worker: { bananas: 10, stones: 0, wood: 0 },
  fighter: { bananas: 15, stones: 5, wood: 3 },
  archer: { bananas: 18, stones: 8, wood: 6 }
};

export const RAID_REWARD: Resources = {
  bananas: 25,
  stones: 10,
  wood: 10
};

export const UNIT_STATS: Record<
  UnitType,
  { hp: number; attack: number; range: number }
> = {
  worker: { hp: 24, attack: 2, range: 1 },
  fighter: { hp: 48, attack: 10, range: 1 },
  archer: { hp: 30, attack: 7, range: 3 }
};
