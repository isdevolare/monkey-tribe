import { t, type Lang } from "../i18n";
import {
  STORAGE_PER_HALL_LEVEL,
  WATCH_TOWER_DAMAGE_REDUCTION,
} from "./constants";
import { armyCapacity } from "./troops";
import type {
  ResourceKind,
  Resources,
  VillageBuilding,
  VillageBuildingType
} from "../types/game";

export function buildingName(type: VillageBuildingType, lang: Lang) {
  return t(`b.${type}`, lang);
}

// Display order on the board and in lists.
export const BUILDING_ORDER: VillageBuildingType[] = [
  "clanHall",
  "bananaGrove",
  "lumberCamp",
  "stoneQuarry",
  "workerShelter",
  "trainingNest",
  "watchTower"
];

export const BUILDING_NAMES: Record<VillageBuildingType, string> = {
  clanHall: "Klan Salonu",
  bananaGrove: "Muz Bahçesi",
  lumberCamp: "Oduncu Kampı",
  stoneQuarry: "Taş Ocağı",
  workerShelter: "İşçi Locası",
  trainingNest: "Eğitim Yuvası",
  watchTower: "Gözetleme Kulesi"
};

// Resource buildings define the destination type for Lodge expeditions.
// Their existing linear level multiplier is now snapshotted into expedition
// rewards when a worker departs.
export const BUILDING_PRODUCTION: Partial<
  Record<VillageBuildingType, { resource: ResourceKind }>
> = {
  bananaGrove: { resource: "bananas" },
  lumberCamp: { resource: "wood" },
  stoneQuarry: { resource: "stones" }
};

export function productionLevelMultiplier(buildingLevel: number) {
  const level = Number.isFinite(buildingLevel)
    ? Math.max(1, Math.floor(buildingLevel))
    : 1;
  return 1 + 0.1 * (level - 1);
}

// Clan Hall level caps how much of each resource the village can stockpile.
export function storageCap(hallLevel: number) {
  return STORAGE_PER_HALL_LEVEL * Math.max(1, hallLevel);
}

// Every village starts with one of each building at level 1.
export const DEFAULT_BUILDINGS: VillageBuilding[] = BUILDING_ORDER.map((type) => ({
  type,
  level: 1
}));

// Worker shelter level drives population capacity.
export function populationCap(shelterLevel: number) {
  return 2 + shelterLevel * 2;
}

const UPGRADE_BASE: Record<VillageBuildingType, Resources> = {
  clanHall: { bananas: 50, stones: 30, wood: 40 },
  bananaGrove: { bananas: 0, stones: 10, wood: 25 },
  lumberCamp: { bananas: 20, stones: 10, wood: 0 },
  stoneQuarry: { bananas: 20, stones: 0, wood: 20 },
  workerShelter: { bananas: 30, stones: 15, wood: 30 },
  trainingNest: { bananas: 40, stones: 20, wood: 30 },
  watchTower: { bananas: 20, stones: 30, wood: 20 }
};

export type WorkerLodgeUpgradeDefinition = {
  targetLevel: number;
  cost: Resources;
  durationMs: number;
  requiredClanHallLevel: number;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const WORKER_LODGE_UPGRADES: readonly WorkerLodgeUpgradeDefinition[] = [
  { targetLevel: 2, cost: { bananas: 250, stones: 120, wood: 220 }, durationMs: 5 * MINUTE, requiredClanHallLevel: 1 },
  { targetLevel: 3, cost: { bananas: 700, stones: 350, wood: 600 }, durationMs: 20 * MINUTE, requiredClanHallLevel: 2 },
  { targetLevel: 4, cost: { bananas: 1_800, stones: 900, wood: 1_500 }, durationMs: HOUR, requiredClanHallLevel: 3 },
  { targetLevel: 5, cost: { bananas: 4_500, stones: 2_500, wood: 3_800 }, durationMs: 4 * HOUR, requiredClanHallLevel: 4 },
  { targetLevel: 6, cost: { bananas: 10_000, stones: 6_000, wood: 8_000 }, durationMs: 10 * HOUR, requiredClanHallLevel: 5 },
  { targetLevel: 7, cost: { bananas: 22_000, stones: 14_000, wood: 18_000 }, durationMs: DAY, requiredClanHallLevel: 6 },
  { targetLevel: 8, cost: { bananas: 45_000, stones: 30_000, wood: 38_000 }, durationMs: 2 * DAY, requiredClanHallLevel: 7 },
  { targetLevel: 9, cost: { bananas: 90_000, stones: 65_000, wood: 75_000 }, durationMs: 3 * DAY, requiredClanHallLevel: 8 },
  { targetLevel: 10, cost: { bananas: 180_000, stones: 135_000, wood: 150_000 }, durationMs: 5 * DAY, requiredClanHallLevel: 9 }
];

export function workerLodgeUpgrade(currentLevel: number) {
  return WORKER_LODGE_UPGRADES.find((entry) => entry.targetLevel === currentLevel + 1) ?? null;
}

export function storageCanHoldCost(capacity: number, cost: Resources) {
  return cost.bananas <= capacity && cost.stones <= capacity && cost.wood <= capacity;
}

// Cost to upgrade from `level` to `level + 1`; grows with level.
export function upgradeCost(type: VillageBuildingType, level: number): Resources {
  if (type === "workerShelter") {
    return workerLodgeUpgrade(level)?.cost ?? { bananas: 0, stones: 0, wood: 0 };
  }
  const base = UPGRADE_BASE[type];
  const factor = Math.pow(1.6, level - 1);
  return {
    bananas: Math.round(base.bananas * factor),
    stones: Math.round(base.stones * factor),
    wood: Math.round(base.wood * factor)
  };
}

const RESOURCE_KEY: Record<ResourceKind, string> = {
  bananas: "fx.muz",
  wood: "fx.odun",
  stones: "fx.tas"
};

// Short, localized description of what the building does at a given level.
export function buildingEffect(type: VillageBuildingType, level: number, lang: Lang): string {
  const production = BUILDING_PRODUCTION[type];
  if (production) {
    const pct = Math.round((productionLevelMultiplier(level) - 1) * 100);
    return t("fx.expeditionYield", lang, {
      pct,
      res: t(RESOURCE_KEY[production.resource], lang)
    });
  }

  if (type === "workerShelter") {
    return `${t("fx.capacity", lang)} ${populationCap(level)}`;
  }

  if (type === "trainingNest") {
    return `${t("fx.fighterTraining", lang)} · ${t("trainingNest.armyCapacity", lang, {
      used: 0,
      max: armyCapacity(level)
    })}`;
  }

  if (type === "watchTower") {
    return t("fx.campDamageReduction", lang, {
      n: level * WATCH_TOWER_DAMAGE_REDUCTION
    });
  }

  return `${t("fx.villageLevel", lang)} ${level} · ${t("fx.storage", lang)} ${storageCap(level)}`;
}
