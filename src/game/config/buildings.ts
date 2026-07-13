import { t, type Lang } from "../i18n";
import {
  STORAGE_PER_HALL_LEVEL,
  TROOP_BONUS_PER_NEST_LEVEL,
  WATCH_TOWER_DAMAGE_REDUCTION,
  watchTowerArcherBonusPercent
} from "./constants";
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
  workerShelter: "İşçi Barınağı",
  trainingNest: "Eğitim Yuvası",
  watchTower: "Gözetleme Kulesi"
};

// Production per WORKER per second; a building hosts up to `level`
// workers, so output = rate × manned slots. Unmanned buildings produce
// nothing — resources come from monkeys, not thin air.
export const BUILDING_PRODUCTION: Partial<
  Record<VillageBuildingType, { resource: ResourceKind; perSecond: number }>
> = {
  bananaGrove: { resource: "bananas", perSecond: 2 / 60 },
  lumberCamp: { resource: "wood", perSecond: 1.4 / 60 },
  stoneQuarry: { resource: "stones", perSecond: 1 / 60 }
};

export function productionLevelMultiplier(buildingLevel: number) {
  const level = Number.isFinite(buildingLevel)
    ? Math.max(1, Math.floor(buildingLevel))
    : 1;
  return 1 + 0.1 * (level - 1);
}

/** Per-worker production rate after applying the building's level bonus. */
export function productionPerSecondAtLevel(
  type: VillageBuildingType,
  buildingLevel: number
) {
  const production = BUILDING_PRODUCTION[type];
  return production
    ? production.perSecond * productionLevelMultiplier(buildingLevel)
    : 0;
}

/**
 * Distributes workers one per production building per round. This keeps
 * staffed buildings within one worker of each other whenever their slot
 * capacities allow it, while preserving deterministic tie-breaking.
 */
export function assignWorkers(
  buildings: VillageBuilding[],
  workerCount: number
): Partial<Record<VillageBuildingType, number>> {
  const assigned: Partial<Record<VillageBuildingType, number>> = {};
  const productionTypes = BUILDING_ORDER.filter((type) => BUILDING_PRODUCTION[type]);
  const capacity = new Map<VillageBuildingType, number>();

  for (const type of productionTypes) {
    const rawLevel = buildings.find((building) => building.type === type)?.level ?? 0;
    capacity.set(type, Number.isFinite(rawLevel) ? Math.max(0, Math.floor(rawLevel)) : 0);
  }

  let remaining = Math.max(0, Math.floor(workerCount));
  while (remaining > 0) {
    let assignedThisRound = false;
    for (const type of productionTypes) {
      const current = assigned[type] ?? 0;
      if (current >= (capacity.get(type) ?? 0)) {
        continue;
      }

      assigned[type] = current + 1;
      remaining -= 1;
      assignedThisRound = true;
      if (remaining === 0) {
        break;
      }
    }

    if (!assignedThisRound) {
      break;
    }
  }

  return assigned;
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

// Cost to upgrade from `level` to `level + 1`; grows with level.
export function upgradeCost(type: VillageBuildingType, level: number): Resources {
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
    const perMinute =
      Math.round(productionPerSecondAtLevel(type, level) * 60 * 100) / 100;
    return t("fx.workerProduction", lang, {
      rate: perMinute,
      res: t(RESOURCE_KEY[production.resource], lang),
      slots: level
    });
  }

  if (type === "workerShelter") {
    return `${t("fx.capacity", lang)} ${populationCap(level)}`;
  }

  if (type === "trainingNest") {
    const pct = Math.round((level - 1) * TROOP_BONUS_PER_NEST_LEVEL * 100);
    return `${t("fx.fighterTraining", lang)} · ${t("fx.troopPower", lang)} +${pct}%`;
  }

  if (type === "watchTower") {
    return `${t("fx.campDamageReduction", lang, {
      n: level * WATCH_TOWER_DAMAGE_REDUCTION
    })} · ${t("fx.archerAttackBonus", lang, {
      pct: watchTowerArcherBonusPercent(level)
    })}`;
  }

  return `${t("fx.villageLevel", lang)} ${level} · ${t("fx.storage", lang)} ${storageCap(level)}`;
}
