import type { Position, Resources, UnitCombatStats, UnitType } from "../types/game";

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
  archer: { bananas: 18, stones: 8, wood: 6 },
  guardian: { bananas: 25, stones: 20, wood: 10 }
};

// Training Nest levels buff newly queued troops by +10% hp/attack per
// level past 1. Training cost grows more slowly at +5% per level.
export const TROOP_BONUS_PER_NEST_LEVEL = 0.1;
export const TROOP_COST_PER_NEST_LEVEL = 0.05;

export function troopStatMultiplier(nestLevel: number) {
  return 1 + TROOP_BONUS_PER_NEST_LEVEL * Math.max(0, nestLevel - 1);
}

export function troopCostMultiplier(nestLevel: number) {
  return 1 + TROOP_COST_PER_NEST_LEVEL * Math.max(0, nestLevel - 1);
}

/** Cost to train `type` at the given Training Nest level (workers exempt). */
export function unitCost(type: UnitType, nestLevel: number): Resources {
  const base = UNIT_COSTS[type];
  if (type === "worker") {
    return base;
  }
  const factor = troopCostMultiplier(nestLevel);
  return {
    bananas: Math.round(base.bananas * factor),
    stones: Math.round(base.stones * factor),
    wood: Math.round(base.wood * factor)
  };
}

export const RAID_REWARD: Resources = {
  bananas: 25,
  stones: 10,
  wood: 10
};

// How long each unit takes to train in the production queue.
export const PRODUCTION_DURATION_MS: Record<UnitType, number> = {
  worker: 5000,
  fighter: 9000,
  archer: 11000,
  guardian: 13000
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
  archer: { hp: 34, attack: 7, range: 3 },
  // Tank: soaks damage up front, hits softly.
  guardian: { hp: 110, attack: 6, range: 1 }
};

/** Final unit stats fixed at queue time. Workers always use their base stats. */
export function unitCombatStats(type: UnitType, nestLevel: number): UnitCombatStats {
  const base = UNIT_STATS[type];
  const factor = type === "worker" ? 1 : troopStatMultiplier(nestLevel);
  return {
    maxHp: Math.round(base.hp * factor),
    attack: Math.round(base.attack * factor),
    range: base.range
  };
}

// Wounded units slowly recover while back home in the village.
export const VILLAGE_REGEN_PER_SEC = 2;

// Work shifts: idle workers can be sent out to gather for a while,
// boosting passive production per working monkey.
export const WORK_SHIFT_MS = 3 * 60 * 1000;
export const WORKER_BOOST = 0.2;

// Offline earnings: manned buildings keep producing while the game is
// closed. The storage cap is the real limiter, so the time cap is loose.
export const OFFLINE_CAP_MS = 24 * 60 * 60 * 1000;
// Ignore trivially short gaps (app backgrounded for a moment).
export const OFFLINE_MIN_MS = 60 * 1000;

// Resource stockpile limit per Clan Hall level. Full depots stop
// production and clip loot — upgrading the hall is how you grow reserves.
export const STORAGE_PER_HALL_LEVEL = 400;
