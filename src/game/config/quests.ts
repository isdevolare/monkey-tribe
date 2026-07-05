import type { QuestMetric, Resources } from "../types/game";

export type QuestReward = Partial<Resources> & { gems?: number };

export type QuestDef = {
  id: string;
  metric: QuestMetric;
  goal: number;
  reward: QuestReward;
};

// Progression quests, easiest first. Tiered quests on the same metric
// (train 3 → train 12) share the cumulative counter, so finishing the
// small one leaves you partway to the big one.
export const QUESTS: QuestDef[] = [
  { id: "train3", metric: "trainAny", goal: 3, reward: { bananas: 50 } },
  { id: "upgrade1", metric: "upgradeAny", goal: 1, reward: { stones: 40 } },
  { id: "shift1", metric: "workShift", goal: 1, reward: { wood: 50 } },
  { id: "raid1", metric: "winRaid", goal: 1, reward: { gems: 3 } },
  { id: "train12", metric: "trainAny", goal: 12, reward: { gems: 2 } },
  { id: "upgrade5", metric: "upgradeAny", goal: 5, reward: { gems: 4 } },
  { id: "raid5", metric: "winRaid", goal: 5, reward: { gems: 6 } }
];

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

/** Count of quests that are complete but not yet claimed — drives the HUD badge. */
export function claimableQuestCount(
  progress: Partial<Record<QuestMetric, number>>,
  claimed: string[]
) {
  return QUESTS.filter(
    (quest) => isQuestComplete(progress, quest) && !claimed.includes(quest.id)
  ).length;
}
