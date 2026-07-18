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
  "watchTower",
  "royalPalace"
];

export const BUILDING_NAMES: Record<VillageBuildingType, string> = {
  clanHall: "Klan Salonu",
  bananaGrove: "Muz Bahçesi",
  lumberCamp: "Oduncu Kampı",
  stoneQuarry: "Taş Ocağı",
  workerShelter: "İşçi Locası",
  trainingNest: "Eğitim Yuvası",
  watchTower: "Gözetleme Kulesi",
  royalPalace: "Kraliyet Sarayı"
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

/** Existing v1 worker-yield bonuses. Banana and wood/stone intentionally differ. */
export function resourceBuildingProductionBonus(
  type: VillageBuildingType,
  buildingLevel: number
) {
  const level = Number.isFinite(buildingLevel)
    ? Math.max(1, Math.floor(buildingLevel))
    : 1;
  if (type === "bananaGrove") return productionLevelMultiplier(level) - 1;
  if (type === "lumberCamp" || type === "stoneQuarry") return level * 0.03;
  return 0;
}

// Clan Hall level caps how much of each resource the village can stockpile.
export function storageCap(hallLevel: number) {
  return STORAGE_PER_HALL_LEVEL * Math.max(1, hallLevel);
}

// Existing village buildings start at level 1; the end-game Palace starts unbuilt.
export const DEFAULT_BUILDINGS: VillageBuilding[] = BUILDING_ORDER.map((type) => ({
  type,
  level: type === "royalPalace" ? 0 : 1
}));

// Single v1 source of truth for all Worker Lodge capacity UI and validation.
export function workerCapacity(lodgeLevel: number) {
  const level = Number.isFinite(lodgeLevel)
    ? Math.max(1, Math.floor(lodgeLevel))
    : 1;
  if (level === 1) return 3;
  if (level === 2) return 5;
  if (level === 3) return 8;
  if (level === 4) return 12;
  if (level === 5) return 15;
  return 20;
}

const UPGRADE_BASE: Record<VillageBuildingType, Resources> = {
  clanHall: { bananas: 50, stones: 30, wood: 40 },
  bananaGrove: { bananas: 0, stones: 10, wood: 25 },
  lumberCamp: { bananas: 20, stones: 10, wood: 0 },
  stoneQuarry: { bananas: 20, stones: 0, wood: 20 },
  workerShelter: { bananas: 30, stones: 15, wood: 30 },
  trainingNest: { bananas: 40, stones: 20, wood: 30 },
  watchTower: { bananas: 20, stones: 30, wood: 20 },
  royalPalace: { bananas: 0, stones: 0, wood: 0 }
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
  { targetLevel: 3, cost: { bananas: 650, stones: 320, wood: 550 }, durationMs: 20 * MINUTE, requiredClanHallLevel: 2 },
  { targetLevel: 4, cost: { bananas: 1_050, stones: 560, wood: 900 }, durationMs: HOUR, requiredClanHallLevel: 3 },
  { targetLevel: 5, cost: { bananas: 1_450, stones: 800, wood: 1_250 }, durationMs: 4 * HOUR, requiredClanHallLevel: 4 },
  { targetLevel: 6, cost: { bananas: 1_850, stones: 1_050, wood: 1_600 }, durationMs: 10 * HOUR, requiredClanHallLevel: 5 },
  { targetLevel: 7, cost: { bananas: 2_300, stones: 1_350, wood: 2_000 }, durationMs: DAY, requiredClanHallLevel: 6 },
  { targetLevel: 8, cost: { bananas: 2_750, stones: 1_650, wood: 2_400 }, durationMs: 2 * DAY, requiredClanHallLevel: 7 },
  { targetLevel: 9, cost: { bananas: 3_200, stones: 2_000, wood: 2_800 }, durationMs: 3 * DAY, requiredClanHallLevel: 8 },
  { targetLevel: 10, cost: { bananas: 3_550, stones: 2_300, wood: 3_200 }, durationMs: 5 * DAY, requiredClanHallLevel: 9 }
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
  if (type === "royalPalace") {
    return { bananas: 0, stones: 0, wood: 0 };
  }
  const base = UPGRADE_BASE[type];
  const factor = Math.pow(1.6, level - 1);
  const rawCost = {
    bananas: Math.round(base.bananas * factor),
    stones: Math.round(base.stones * factor),
    wood: Math.round(base.wood * factor)
  };
  if (type !== "clanHall") return rawCost;

  // Hall upgrades must be purchasable without relying on legacy overflow.
  const currentCapacity = storageCap(level);
  return {
    bananas: Math.min(rawCost.bananas, currentCapacity),
    stones: Math.min(rawCost.stones, currentCapacity),
    wood: Math.min(rawCost.wood, currentCapacity)
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
    const pct = Math.round(resourceBuildingProductionBonus(type, level) * 100);
    return t("fx.expeditionYield", lang, {
      pct,
      res: t(RESOURCE_KEY[production.resource], lang)
    });
  }

  if (type === "workerShelter") {
    return `${t("fx.capacity", lang)} ${workerCapacity(level)}`;
  }

  if (type === "royalPalace") {
    return `${t("royalPalace.prestige", lang)} · ${Math.max(0, level) * 100}`;
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
