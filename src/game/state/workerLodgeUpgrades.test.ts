import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDINGS } from "../config/buildings";
import { ROYAL_PALACE_UPGRADES } from "../config/royalPalace";
import {
  evaluateWorkerLodgeUpgrade,
  reconcileWorkerLodgeUpgrade,
  sanitizeWorkerLodgeUpgrade
} from "./workerLodgeUpgrades";

describe("Worker Lodge upgrade eligibility", () => {
  it("does not block a Clan Hall Lv. 8 player on a Lv. 1 requirement", () => {
    const result = evaluateWorkerLodgeUpgrade({
      lodgeLevel: 1,
      clanLevel: 8,
      resources: { bananas: 10_000, stones: 10_000, wood: 10_000 },
      activeUpgrade: null
    });
    expect(result.definition?.requiredClanHallLevel).toBe(1);
    expect(result.enabled).toBe(true);
    expect(result.block).toBeNull();
  });

  it("reports the actual missing resource instead of a satisfied Clan Hall gate", () => {
    const result = evaluateWorkerLodgeUpgrade({
      lodgeLevel: 1,
      clanLevel: 8,
      resources: { bananas: 10_000, stones: 0, wood: 10_000 },
      activeUpgrade: null
    });
    expect(result.block).toEqual({ reason: "resource", resource: "stones", missing: 120 });
  });
});

describe("shared timed building upgrade migration", () => {
  it("keeps legacy Lodge upgrades and sanitizes a Palace upgrade from level 0", () => {
    const definition = ROYAL_PALACE_UPGRADES[0]!;
    const upgrade = sanitizeWorkerLodgeUpgrade({
      buildingType: "royalPalace",
      fromLevel: 0,
      targetLevel: 1,
      startedAt: 100,
      endsAt: 100 + definition.durationMs,
      cost: definition.cost,
      requiredClanHallLevel: definition.requiredClanHallLevel
    }, DEFAULT_BUILDINGS);
    expect(upgrade).toMatchObject({ buildingType: "royalPalace", fromLevel: 0, targetLevel: 1 });
  });

  it("completes the Palace upgrade through the existing single timer", () => {
    const definition = ROYAL_PALACE_UPGRADES[0]!;
    const reconciled = reconcileWorkerLodgeUpgrade(DEFAULT_BUILDINGS, {
      buildingType: "royalPalace",
      fromLevel: 0,
      targetLevel: 1,
      startedAt: 100,
      endsAt: 200,
      cost: definition.cost,
      requiredClanHallLevel: definition.requiredClanHallLevel
    }, 200);
    expect(reconciled.buildings.find((building) => building.type === "royalPalace")?.level).toBe(1);
    expect(reconciled.activeUpgrade).toBeNull();
    expect(reconciled.completedBuildingType).toBe("royalPalace");
  });
});
