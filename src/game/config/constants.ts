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

// How long each unit takes to train in the production queue.
export const PRODUCTION_DURATION_MS: Record<UnitType, number> = {
  worker: 5000,
  fighter: 9000,
  archer: 11000
};

// Gems to instantly finish the whole production queue.
export const RUSH_GEM_COST = 2;

// Max items that can be queued at once.
export const PRODUCTION_SLOTS = 5;

export const UNIT_STATS: Record<
  UnitType,
  { hp: number; attack: number; range: number }
> = {
  worker: { hp: 24, attack: 2, range: 1 },
  fighter: { hp: 56, attack: 10, range: 1 },
  archer: { hp: 34, attack: 7, range: 3 }
};

// Wounded units slowly recover while back home in the village.
export const VILLAGE_REGEN_PER_SEC = 2;

// Work shifts: idle workers can be sent out to gather for a while,
// boosting passive production per working monkey.
export const WORK_SHIFT_MS = 3 * 60 * 1000;
export const WORKER_BOOST = 0.2;

// Offline earnings: buildings keep producing while the game is closed,
// but only up to this many hours so leaving doesn't trivialize the game.
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
// Ignore trivially short gaps (app backgrounded for a moment).
export const OFFLINE_MIN_MS = 60 * 1000;
