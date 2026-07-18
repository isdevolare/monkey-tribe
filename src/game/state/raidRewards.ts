import { STRONGHOLD_BASE_LEVEL } from "../config/camps";
import type { RaidGemRewardReason, Resources } from "../types/game";
import { addResourcesCapped } from "./resources";

export type RaidVictoryCounts = Record<string, number>;

const REPEAT_REWARD_MULTIPLIERS = [1, 0.6, 0.35] as const;
const REPEAT_REWARD_FLOOR = 0.2;
export const RAID_REWARD_VERSION = 2;

/** First clear pays its stars, the first repeat pays 1 Gem, later farming pays none. */
export function resolveRaidGemReward(stars: number, previousVictories: number): {
  gems: number;
  reason: RaidGemRewardReason;
} {
  const safeStars = Math.max(0, Math.min(3, Math.floor(stars)));
  if (previousVictories <= 0) {
    return { gems: safeStars, reason: safeStars > 0 ? "first-victory" : "none" };
  }
  if (previousVictories === 1 && safeStars > 0) {
    return { gems: 1, reason: "first-repeat" };
  }
  return { gems: 0, reason: "none" };
}

export function raidGemReward(stars: number, previousVictories: number) {
  return resolveRaidGemReward(stars, previousVictories).gems;
}

/** Procedural strongholds pay one Gem only on each new five-level milestone. */
export function resolveCampRaidGemReward(
  campId: string,
  stars: number,
  previousVictories: number
): { gems: number; reason: RaidGemRewardReason } {
  if (!campId.startsWith("stronghold-")) {
    return resolveRaidGemReward(stars, previousVictories);
  }
  const level = Number(campId.slice("stronghold-".length));
  const safeStars = Math.max(0, Math.min(3, Math.floor(stars)));
  if (
    Number.isInteger(level) &&
    level > 0 &&
    level % 5 === 0 &&
    previousVictories <= 0 &&
    safeStars > 0
  ) {
    return { gems: 1, reason: "stronghold-milestone" };
  }
  return { gems: 0, reason: "none" };
}

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
  const requestedLoot = scaleRaidLoot(baseLoot, multiplier);
  const grant = addResourcesCapped(currentResources, requestedLoot, storageCap);
  return {
    loot: grant.received,
    requestedLoot,
    discardedLoot: grant.discarded,
    multiplier,
    resources: grant.resources
  };
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

/**
 * Preserves existing per-camp counters and reconstructs completed procedural
 * strongholds for legacy saves that only carried a stronghold level.
 */
export function migrateRaidVictoryCounts(
  value: unknown,
  raidLevel: unknown,
  rewardVersion: unknown
): RaidVictoryCounts {
  const counts = sanitizeRaidVictoryCounts(value);
  if (rewardVersion === RAID_REWARD_VERSION) {
    return counts;
  }

  const legacyLevel =
    typeof raidLevel === "number" && Number.isFinite(raidLevel)
      ? Math.floor(raidLevel)
      : STRONGHOLD_BASE_LEVEL;
  for (let level = STRONGHOLD_BASE_LEVEL; level < legacyLevel; level += 1) {
    counts[`stronghold-${level}`] = Math.max(1, counts[`stronghold-${level}`] ?? 0);
  }
  return counts;
}
