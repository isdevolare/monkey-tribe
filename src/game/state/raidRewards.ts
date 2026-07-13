import type { Resources } from "../types/game";

export type RaidVictoryCounts = Record<string, number>;

const REPEAT_REWARD_MULTIPLIERS = [1, 0.6, 0.35] as const;
const REPEAT_REWARD_FLOOR = 0.2;

/** Reward multiplier for a camp based on its completed victories before this win. */
export function raidRewardMultiplier(previousVictories: number) {
  const count = Math.max(0, Math.floor(previousVictories));
  return REPEAT_REWARD_MULTIPLIERS[count] ?? REPEAT_REWARD_FLOOR;
}

export function scaleRaidLoot(loot: Resources, multiplier: number): Resources {
  return {
    bananas: Math.round(loot.bananas * multiplier),
    stones: Math.round(loot.stones * multiplier),
    wood: Math.round(loot.wood * multiplier)
  };
}

export function resolveRaidVictoryReward(
  currentResources: Resources,
  baseLoot: Resources,
  storageCap: number,
  previousVictories: number
) {
  const multiplier = raidRewardMultiplier(previousVictories);
  const loot = scaleRaidLoot(baseLoot, multiplier);
  const resources: Resources = {
    bananas: Math.max(
      currentResources.bananas,
      Math.min(storageCap, currentResources.bananas + loot.bananas)
    ),
    stones: Math.max(
      currentResources.stones,
      Math.min(storageCap, currentResources.stones + loot.stones)
    ),
    wood: Math.max(
      currentResources.wood,
      Math.min(storageCap, currentResources.wood + loot.wood)
    )
  };
  return { loot, multiplier, resources };
}

/** Keeps persisted victory counters finite, non-negative integers. */
export function sanitizeRaidVictoryCounts(value: unknown): RaidVictoryCounts {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const counts: RaidVictoryCounts = {};
  for (const [campId, rawCount] of Object.entries(value)) {
    if (typeof rawCount === "number" && Number.isFinite(rawCount) && rawCount >= 0) {
      counts[campId] = Math.floor(rawCount);
    }
  }
  return counts;
}
