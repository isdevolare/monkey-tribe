import type { GameAssetKey } from "./gameAssets";
import { WORKER_ASSETS } from "./workerAssets";
import { clanHallAsset } from "../config/clanHallVisuals";
import {
  getCosmeticAppearance,
  getDefaultSkinId,
  getPrimaryRoyalAppearance
} from "../config/profileMonkeys";
import { royalPalaceAsset } from "../config/royalPalaceVisuals";
import type { RoyalCharacterDisplay, VillageBuilding, WorkerExpedition } from "../types/game";

export type VillageAssetSnapshot = {
  buildings: readonly VillageBuilding[];
  workerExpeditions: readonly WorkerExpedition[];
  royalCharacterDisplays: readonly RoyalCharacterDisplay[];
};

const ALWAYS_VISIBLE_ASSETS: readonly GameAssetKey[] = [
  "bgJungleWorldCompact",
  "bgVillageReferenceLayout",
  "terrainBananaTree",
  "buildingLumberCampReference",
  "terrainRock",
  "buildingArcherTower",
  "buildingHut",
  "buildingWarriorBarracks",
  // Static dock thumbnails.
  "buildingPlayerCamp",
  "royalPalaceLevel6",
  // HUD and first-frame actions.
  "resourceBanana",
  "resourceStone",
  "resourceWood",
  "resourcePopulation",
  "resourceJungleGem",
  "propCrate",
  "propTrainingDummy",
  // Board props and ambient workers visible on the first village frame.
  "propCampfire",
  "propLogPile",
  "propBananaBasket",
  "bananaWorkerYoung",
  "lumberWorkerApprentice",
  "stoneWorkerApprentice",
  "unitWorker"
];

const LEVEL_PROPS: ReadonlyArray<{ type: VillageBuilding["type"]; minLevel: number; asset: GameAssetKey }> = [
  { type: "bananaGrove", minLevel: 1, asset: "resourceBananaPile" },
  { type: "lumberCamp", minLevel: 1, asset: "resourceWoodBundle" },
  { type: "lumberCamp", minLevel: 4, asset: "propBarrel" },
  { type: "stoneQuarry", minLevel: 1, asset: "resourceStonePile" },
  { type: "stoneQuarry", minLevel: 1, asset: "propCrate" },
  { type: "watchTower", minLevel: 2, asset: "propRopeCoil" },
  { type: "watchTower", minLevel: 4, asset: "propCrate" },
  { type: "workerShelter", minLevel: 2, asset: "propCrate" },
  { type: "trainingNest", minLevel: 2, asset: "propTrainingDummy" },
  { type: "trainingNest", minLevel: 4, asset: "propRopeCoil" }
];

function buildingLevel(buildings: readonly VillageBuilding[], type: VillageBuilding["type"]) {
  return buildings.find((building) => building.type === type)?.level ?? 0;
}

/** Only artwork that can appear on the first hydrated village frame. */
export function criticalVillageAssetKeys(snapshot: VillageAssetSnapshot): GameAssetKey[] {
  const keys = new Set<GameAssetKey>(ALWAYS_VISIBLE_ASSETS);
  keys.add(clanHallAsset(buildingLevel(snapshot.buildings, "clanHall")));
  keys.add(royalPalaceAsset(buildingLevel(snapshot.buildings, "royalPalace")));

  for (const prop of LEVEL_PROPS) {
    if (buildingLevel(snapshot.buildings, prop.type) >= prop.minLevel) keys.add(prop.asset);
  }

  const primaryAppearance = getPrimaryRoyalAppearance(snapshot.royalCharacterDisplays);
  keys.add(primaryAppearance.portraitAsset);
  keys.add(primaryAppearance.villageAsset);

  for (const expedition of snapshot.workerExpeditions) {
    keys.add(WORKER_ASSETS[expedition.workerClass]);
  }

  for (const display of snapshot.royalCharacterDisplays) {
    if (!display.isVisible) continue;
    const appearance = getCosmeticAppearance(
      display.characterId,
      display.selectedSkinId ?? getDefaultSkinId(display.characterId)
    );
    keys.add(appearance.villageAsset);
  }

  return [...keys];
}
