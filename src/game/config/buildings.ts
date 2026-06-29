import type {
  ResourceKind,
  Resources,
  VillageBuilding,
  VillageBuildingType
} from "../types/game";

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

// Passive production per second at level 1; scales linearly with level.
export const BUILDING_PRODUCTION: Partial<
  Record<VillageBuildingType, { resource: ResourceKind; perSecond: number }>
> = {
  bananaGrove: { resource: "bananas", perSecond: 1.2 },
  lumberCamp: { resource: "wood", perSecond: 0.8 },
  stoneQuarry: { resource: "stones", perSecond: 0.6 }
};

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

const RESOURCE_LABELS: Record<ResourceKind, string> = {
  bananas: "muz",
  wood: "odun",
  stones: "taş"
};

// Short Turkish description of what the building does at a given level.
export function buildingEffect(type: VillageBuildingType, level: number): string {
  const production = BUILDING_PRODUCTION[type];
  if (production) {
    const rate = (production.perSecond * level).toFixed(1);
    return `${rate}/sn ${RESOURCE_LABELS[production.resource]}`;
  }

  if (type === "workerShelter") {
    return `Kapasite ${populationCap(level)}`;
  }

  if (type === "trainingNest") {
    return "Savaşçı eğitimi";
  }

  if (type === "watchTower") {
    return `Savunma +${level * 2}`;
  }

  return `Köy seviyesi ${level}`;
}
