import { describe, expect, it } from "vitest";
import { evaluateWorkerProductionStart } from "../state/workerExpeditions";
import {
  buildingEffect,
  resourceBuildingProductionBonus,
  storageCanHoldCost,
  storageCap,
  upgradeCost,
  workerCapacity
} from "./buildings";

describe("Clan Hall upgrade capacity invariant", () => {
  it("keeps every supported upgrade resource within the current legal storage", () => {
    for (let currentLevel = 1; currentLevel <= 100; currentLevel += 1) {
      const capacity = storageCap(currentLevel);
      const cost = upgradeCost("clanHall", currentLevel);
      expect(
        storageCanHoldCost(capacity, cost),
        `Clan Hall ${currentLevel} -> ${currentLevel + 1}: cap ${capacity}, cost ${JSON.stringify(cost)}`
      ).toBe(true);
    }
  });

  it("leaves pre-blocker costs unchanged and caps only the impossible high-level component", () => {
    expect(upgradeCost("clanHall", 10)).toEqual({
      bananas: 3_436,
      stones: 2_062,
      wood: 2_749
    });
    expect(upgradeCost("clanHall", 11)).toEqual({
      bananas: 4_400,
      stones: 3_299,
      wood: 4_398
    });
  });
});

describe("Worker Lodge capacity source of truth", () => {
  it("uses workerCapacity for descriptions and production validation at every Lodge level", () => {
    for (let level = 1; level <= 10; level += 1) {
      const capacity = workerCapacity(level);
      expect(buildingEffect("workerShelter", level, "en")).toContain(String(capacity));
      expect(evaluateWorkerProductionStart({
        workerClass: "gatherer",
        lodgeLevel: level,
        managedWorkers: capacity - 1,
        capacity,
        resources: { bananas: 10, stones: 0, wood: 0 }
      })).toBe("queued");
      expect(evaluateWorkerProductionStart({
        workerClass: "gatherer",
        lodgeLevel: level,
        managedWorkers: capacity,
        capacity,
        resources: { bananas: 10, stones: 0, wood: 0 }
      })).toBe("capacity-full");
    }
  });
});

describe("resource building bonus descriptions", () => {
  it("preserves the distinct v1 Banana and wood/stone bonus formulas", () => {
    expect(resourceBuildingProductionBonus("bananaGrove", 1)).toBe(0);
    expect(resourceBuildingProductionBonus("bananaGrove", 4)).toBeCloseTo(0.3);
    expect(resourceBuildingProductionBonus("lumberCamp", 1)).toBeCloseTo(0.03);
    expect(resourceBuildingProductionBonus("lumberCamp", 4)).toBeCloseTo(0.12);
    expect(resourceBuildingProductionBonus("stoneQuarry", 4)).toBeCloseTo(0.12);
    expect(buildingEffect("bananaGrove", 4, "en")).toContain("30%");
    expect(buildingEffect("lumberCamp", 4, "en")).toContain("12%");
    expect(buildingEffect("stoneQuarry", 4, "en")).toContain("12%");
  });
});
