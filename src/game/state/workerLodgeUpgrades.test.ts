import { describe, expect, it } from "vitest";
import { evaluateWorkerLodgeUpgrade } from "./workerLodgeUpgrades";

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
