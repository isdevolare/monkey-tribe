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
