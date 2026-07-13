import { UNIT_COSTS } from "../config/constants";
import type { RaidPenaltyReason, Resources } from "../types/game";

type PenaltyRule = {
  percent: number;
  min: number;
  max: number;
};

const RESOURCE_KEYS = ["bananas", "stones", "wood"] as const;

const RAID_PENALTY_RULES: Record<
  RaidPenaltyReason,
  Record<(typeof RESOURCE_KEYS)[number], PenaltyRule>
> = {
  retreat: {
    bananas: { percent: 0.05, min: 5, max: 40 },
    wood: { percent: 0.04, min: 3, max: 25 },
    stones: { percent: 0.03, min: 2, max: 20 }
  },
  defeat: {
    bananas: { percent: 0.08, min: 8, max: 60 },
    wood: { percent: 0.06, min: 5, max: 40 },
    stones: { percent: 0.05, min: 4, max: 30 }
  }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Calculates and applies one bounded raid penalty while preserving enough
 * stock to train the base fighter defined by the economy config.
 */
export function applyRaidPenalty(currentResources: Resources, reason: RaidPenaltyReason) {
  const resources = { ...currentResources };
  const amounts: Resources = { bananas: 0, stones: 0, wood: 0 };
  const rules = RAID_PENALTY_RULES[reason];

  for (const key of RESOURCE_KEYS) {
    const current = Number.isFinite(resources[key]) ? Math.max(0, resources[key]) : 0;
    const rule = rules[key];
    const target = clamp(Math.round(current * rule.percent), rule.min, rule.max);
    const spendableResource = Math.max(0, Math.floor(current - UNIT_COSTS.fighter[key]));
    const penalty = Math.min(target, spendableResource);

    amounts[key] = penalty;
    resources[key] = Math.max(0, current - penalty);
  }

  return { resources, amounts };
}
