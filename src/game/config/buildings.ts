import { t, type Lang } from "../i18n";
import { STORAGE_PER_HALL_LEVEL } from "./constants";
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

/**
 * Distributes idle workers across production buildings in BUILDING_ORDER
 * priority (grove first). Each building offers `level` slots. Returns
 * manned slot counts keyed by building type.
 */
export function assignWorkers(
  buildings: VillageBuilding[],
  workerCount: number
): Partial<Record<VillageBuildingType, number>> {
  const assigned: Partial<Record<VillageBuildingType, number>> = {};
  let remaining = Math.max(0, Math.floor(workerCount));
  for (const type of BUILDING_ORDER) {
    if (!BUILDING_PRODUCTION[type]) {
      continue;
    }
    const level = buildings.find((building) => building.type === type)?.level ?? 0;
    const slots = Math.min(level, remaining);
    if (slots > 0) {
      assigned[type] = slots;
      remaining -= slots;
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
    const perMinute = Math.round(production.perSecond * 60 * 10) / 10;
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
    return t("fx.fighterTraining", lang);
  }

  if (type === "watchTower") {
    return `${t("fx.defense", lang)} +${level * 2}`;
  }

  return `${t("fx.villageLevel", lang)} ${level} · ${t("fx.storage", lang)} ${storageCap(level)}`;
}
