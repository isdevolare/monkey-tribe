import { describe, expect, it } from "vitest";
import {
  RAID_REWARD_VERSION,
  migrateRaidVictoryCounts,
  resolveCampRaidGemReward,
  resolveRaidGemReward,
  resolveRaidVictoryReward
} from "./raidRewards";

describe("raid Gem rewards", () => {
  it.each([1, 2, 3])("grants %i Gem on a first victory with that many stars", (stars) => {
    expect(resolveRaidGemReward(stars, 0)).toEqual({
      gems: stars,
      reason: "first-victory"
    });
  });

  it("grants one Gem only on the first repeat victory", () => {
    expect(resolveRaidGemReward(3, 1)).toEqual({ gems: 1, reason: "first-repeat" });
    expect(resolveRaidGemReward(3, 2)).toEqual({ gems: 0, reason: "none" });
    expect(resolveRaidGemReward(3, 12)).toEqual({ gems: 0, reason: "none" });
  });

  it("preserves handcrafted first-clear and bounded repeat rewards", () => {
    expect(resolveCampRaidGemReward("camp-handcrafted", 1, 0)).toEqual({ gems: 1, reason: "first-victory" });
    expect(resolveCampRaidGemReward("camp-handcrafted", 2, 0)).toEqual({ gems: 2, reason: "first-victory" });
    expect(resolveCampRaidGemReward("camp-handcrafted", 3, 0)).toEqual({ gems: 3, reason: "first-victory" });
    expect(resolveCampRaidGemReward("camp-handcrafted", 3, 1)).toEqual({ gems: 1, reason: "first-repeat" });
    expect(resolveCampRaidGemReward("camp-handcrafted", 3, 2)).toEqual({ gems: 0, reason: "none" });
  });

  it("pays one procedural Gem only at a new five-level milestone", () => {
    for (let level = 1; level <= 4; level += 1) {
      expect(resolveCampRaidGemReward(`stronghold-${level}`, 3, 0)).toEqual({ gems: 0, reason: "none" });
    }
    expect(resolveCampRaidGemReward("stronghold-5", 3, 0)).toEqual({
      gems: 1,
      reason: "stronghold-milestone"
    });
    expect(resolveCampRaidGemReward("stronghold-5", 3, 1)).toEqual({ gems: 0, reason: "none" });
    expect(resolveCampRaidGemReward("stronghold-10", 1, 0)).toEqual({
      gems: 1,
      reason: "stronghold-milestone"
    });
  });

  it("preserves valid per-camp victory counters during migration", () => {
    expect(
      migrateRaidVictoryCounts(
        { patrol: 3, camp: 1, invalid: -2 },
        18,
        RAID_REWARD_VERSION
      )
    ).toEqual({ patrol: 3, camp: 1 });
  });

  it("reconstructs completed legacy strongholds without replayable first-clear Gems", () => {
    expect(migrateRaidVictoryCounts(undefined, 17, undefined)).toMatchObject({
      "stronghold-15": 1,
      "stronghold-16": 1
    });
  });

  it("does not replay a milestone after save/reload or a v1 migration", () => {
    const reloaded = migrateRaidVictoryCounts(
      { "stronghold-5": 1 },
      6,
      RAID_REWARD_VERSION
    );
    expect(resolveCampRaidGemReward("stronghold-5", 3, reloaded["stronghold-5"] ?? 0)).toEqual({
      gems: 0,
      reason: "none"
    });

    const migratedV1 = migrateRaidVictoryCounts({ handcrafted: 2 }, 16, 1);
    expect(migratedV1["stronghold-15"]).toBe(1);
    expect(resolveCampRaidGemReward("stronghold-15", 3, migratedV1["stronghold-15"] ?? 0)).toEqual({
      gems: 0,
      reason: "none"
    });
  });
});

describe("raid resource capacity", () => {
  it("reports received and discarded loot separately at the level 8 cap", () => {
    const reward = resolveRaidVictoryReward(
      { bananas: 3_150, stones: 3_190, wood: 3_200 },
      { bananas: 100, stones: 100, wood: 100 },
      3_200,
      0
    );

    expect(reward.resources).toEqual({ bananas: 3_200, stones: 3_200, wood: 3_200 });
    expect(reward.loot).toEqual({ bananas: 50, stones: 10, wood: 0 });
    expect(reward.discardedLoot).toEqual({ bananas: 50, stones: 90, wood: 100 });
  });

  it("does not increase existing overflow", () => {
    const reward = resolveRaidVictoryReward(
      { bananas: 4_000, stones: 4_000, wood: 4_000 },
      { bananas: 100, stones: 100, wood: 100 },
      3_200,
      0
    );

    expect(reward.resources).toEqual({ bananas: 4_000, stones: 4_000, wood: 4_000 });
    expect(reward.loot).toEqual({ bananas: 0, stones: 0, wood: 0 });
  });
});
