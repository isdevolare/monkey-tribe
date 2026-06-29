import type { BuildingType, Buildings, Position, Resources, UnitType } from "../types/game";

export const BOARD_SIZE = 10;

export const PLAYER_CAMP: Position = { x: 1, y: 8 };
export const ENEMY_CAMP: Position = { x: 8, y: 1 };

export const STARTING_RESOURCES: Resources = {
  bananas: 25,
  stones: 8,
  wood: 8
};

export const CAMP_MAX_HP = 120;
export const MOVE_INTERVAL_MS = 380;
export const ATTACK_INTERVAL_MS = 850;
export const ENEMY_DETECTION_RANGE = 4;
export const BASE_POPULATION_CAP = 3;
export const HUT_POPULATION_BONUS = 2;
export const WATCH_POST_DAMAGE_REDUCTION = 2;

export const STARTING_BUILDINGS: Buildings = {
  hut: 0,
  trainingNest: 0,
  watchPost: 0
};

export const GATHER_AMOUNTS: Record<ResourcesKey, number> = {
  bananas: 5,
  stones: 3,
  wood: 4
};

export const UNIT_COSTS: Record<UnitType, Resources> = {
  worker: { bananas: 10, stones: 0, wood: 0 },
  fighter: { bananas: 15, stones: 5, wood: 3 }
};

export const RAID_REWARD: Resources = {
  bananas: 25,
  stones: 10,
  wood: 10
};

export const BUILDING_COSTS: Record<BuildingType, Resources> = {
  hut: { bananas: 8, stones: 0, wood: 12 },
  trainingNest: { bananas: 12, stones: 6, wood: 12 },
  watchPost: { bananas: 6, stones: 10, wood: 10 }
};

export const UNIT_STATS: Record<
  UnitType,
  { hp: number; attack: number; range: number }
> = {
  worker: { hp: 24, attack: 2, range: 1 },
  fighter: { hp: 48, attack: 10, range: 1 }
};

type ResourcesKey = keyof Resources;
