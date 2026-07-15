import type { Position, Resources, TroopUpgradeLevels, UnitCombatStats, UnitType } from "../types/game";
import { TROOPS, isTroopType, troopCombatStats } from "./troops";

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
export const WATCH_TOWER_DAMAGE_REDUCTION = 1;

const WORKER_COST: Resources = { bananas: 10, stones: 0, wood: 0 };

/** Cost to train `type` at the given Training Nest level (workers exempt). */
export function unitCost(type: UnitType, nestLevel: number): Resources {
  void nestLevel;
  return type === "worker" ? { ...WORKER_COST } : { ...TROOPS[type].cost };
}

export const RAID_REWARD: Resources = {
  bananas: 25,
  stones: 10,
  wood: 10
};

// Workers use their own Lodge queue; troop durations live only in troops.ts.
export const WORKER_PRODUCTION_DURATION_MS = 5_000;

// Gems to instantly finish the whole production queue.
export const RUSH_GEM_COST = 2;

// Max items that can be queued at once.
export const PRODUCTION_SLOTS = 5;

const WORKER_STATS = { hp: 24, attack: 2, range: 1 };

/** Final unit stats fixed at queue time. Workers always use their base stats. */
export function unitCombatStats(
  type: UnitType,
  nestLevel: number,
  upgrades: TroopUpgradeLevels = {}
): UnitCombatStats {
  void nestLevel;
  if (isTroopType(type)) {
    return troopCombatStats(type, upgrades);
  }
  const base = WORKER_STATS;
  return {
    maxHp: base.hp,
    attack: base.attack,
    range: base.range,
    attackIntervalMs: ATTACK_INTERVAL_MS,
    moveIntervalMs: MOVE_INTERVAL_MS,
    resistance: 0,
    armorPenetration: 0,
    power: 0
  };
}

// Wounded units slowly recover while back home in the village.
export const VILLAGE_REGEN_PER_SEC = 2;

// Resource stockpile limit per Clan Hall level. Full depots stop
// production and clip loot — upgrading the hall is how you grow reserves.
export const STORAGE_PER_HALL_LEVEL = 400;
