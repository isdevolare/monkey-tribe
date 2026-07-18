import { describe, expect, it } from "vitest";
import type { VillageBuilding } from "../types/game";
import { criticalVillageAssetKeys } from "./villageCriticalAssets";

function buildings(clanHall: number, royalPalace: number): VillageBuilding[] {
  return [
    { type: "clanHall", level: clanHall },
    { type: "bananaGrove", level: 1 },
    { type: "lumberCamp", level: 1 },
    { type: "stoneQuarry", level: 1 },
    { type: "watchTower", level: 1 },
    { type: "workerShelter", level: 1 },
    { type: "trainingNest", level: 1 },
    { type: "royalPalace", level: royalPalace }
  ];
}

describe("critical village assets", () => {
  it("selects Royal Palace level 0 and Clan Hall Stage 1", () => {
    const keys = criticalVillageAssetKeys({ buildings: buildings(1, 0), workerExpeditions: [], royalCharacterDisplays: [] });
    expect(keys).toContain("royalPalaceLevel0");
    expect(keys).toContain("clanHallStage1");
    expect(keys).not.toContain("clanHallStage3");
  });

  it("selects Royal Palace level 3 and Clan Hall Stage 3", () => {
    const keys = criticalVillageAssetKeys({ buildings: buildings(10, 3), workerExpeditions: [], royalCharacterDisplays: [] });
    expect(keys).toContain("royalPalaceLevel6");
    expect(keys).toContain("clanHallStage3");
    expect(keys).not.toContain("clanHallStage1");
  });

  it("includes backgrounds, HUD resources, dock art, and first-frame props", () => {
    const keys = criticalVillageAssetKeys({ buildings: buildings(1, 0), workerExpeditions: [], royalCharacterDisplays: [] });
    expect(keys).toEqual(expect.arrayContaining([
      "bgJungleWorldCompact",
      "bgVillageReferenceLayout",
      "resourceBanana",
      "resourceStone",
      "resourceWood",
      "resourcePopulation",
      "buildingPlayerCamp",
      "buildingWarriorBarracks",
      "propCampfire"
    ]));
  });
});
