import { storageCap } from "./buildings";
import type { QuestMetric, Resources } from "../types/game";

export type QuestReward = Partial<Resources> & { gems?: number };

export type QuestRewardScale = {
  gems: number;
  storageRatios?: Partial<Record<keyof Resources, number>>;
};

export type QuestDef = {
  id: string;
  metric: QuestMetric;
  goal: number;
  reward: QuestRewardScale;
  estimatedMinutes: number;
};

/** Repeatable daily missions. Total daily Gem payout: 8. */
export const QUESTS: readonly QuestDef[] = [
  {
    id: "dailyTrain3",
    metric: "trainAny",
    goal: 3,
    reward: { gems: 1, storageRatios: { bananas: 0.1 } },
    estimatedMinutes: 5
  },
  {
    id: "dailyWork2",
    metric: "workShift",
    goal: 2,
    reward: { gems: 2, storageRatios: { stones: 0.05, wood: 0.08 } },
    estimatedMinutes: 12
  },
  {
    id: "dailyRaid1",
    metric: "winRaid",
    goal: 1,
    reward: {
      gems: 3,
      storageRatios: { bananas: 0.05, stones: 0.05, wood: 0.05 }
    },
    estimatedMinutes: 10
  },
  {
    id: "dailyTrain8",
    metric: "trainAny",
    goal: 8,
    reward: { gems: 2, storageRatios: { bananas: 0.12 } },
    estimatedMinutes: 25
  }
];

export const DAILY_MISSION_GEMS = QUESTS.reduce(
  (total, quest) => total + quest.reward.gems,
  0
);

export function resolveQuestReward(quest: QuestDef, clanHallLevel: number): QuestReward {
  const capacity = storageCap(clanHallLevel);
  const reward: QuestReward = { gems: quest.reward.gems };
  for (const resource of ["bananas", "stones", "wood"] as const) {
    const ratio = quest.reward.storageRatios?.[resource] ?? 0;
    if (ratio > 0) reward[resource] = roundResource(capacity * ratio);
  }
  return reward;
}

export function questProgressValue(
  progress: Partial<Record<QuestMetric, number>>,
  quest: QuestDef
) {
  return Math.min(quest.goal, progress[quest.metric] ?? 0);
}

export function isQuestComplete(
  progress: Partial<Record<QuestMetric, number>>,
  quest: QuestDef
) {
  return (progress[quest.metric] ?? 0) >= quest.goal;
}

/** Count of daily missions ready to claim; drives the HUD badge. */
export function claimableQuestCount(
  progress: Partial<Record<QuestMetric, number>>,
  claimed: string[]
) {
  return QUESTS.filter(
    (quest) => isQuestComplete(progress, quest) && !claimed.includes(quest.id)
  ).length;
}

function roundResource(value: number) {
  return Math.max(5, Math.round(value / 5) * 5);
}
