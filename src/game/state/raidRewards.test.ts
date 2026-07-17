import { describe, expect, it } from "vitest";
import {
  RAID_REWARD_VERSION,
  migrateRaidVictoryCounts,
  resolveRaidGemReward
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
});
