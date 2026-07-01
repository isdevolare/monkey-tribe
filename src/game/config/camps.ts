import { t, type Lang } from "../i18n";
import type { Resources } from "../types/game";

export function campName(id: string, lang: Lang) {
  return t(`camp.${id}`, lang);
}

export type RaidCamp = {
  id: string;
  name: string;
  level: number;
  campHp: number;
  enemyCount: number;
  archerCount?: number;
  enemyHp: number;
  enemyAttack: number;
  loot: Resources;
};

// Leveled enemy camps the player can raid, easiest first.
export const RAID_CAMPS: RaidCamp[] = [
  {
    id: "patrol",
    name: "Korsan Devriyesi",
    level: 1,
    campHp: 80,
    enemyCount: 2,
    enemyHp: 36,
    enemyAttack: 8,
    loot: { bananas: 60, stones: 20, wood: 25 }
  },
  {
    id: "camp",
    name: "Korsan Kampı",
    level: 2,
    campHp: 120,
    enemyCount: 3,
    archerCount: 1,
    enemyHp: 44,
    enemyAttack: 9,
    loot: { bananas: 120, stones: 45, wood: 50 }
  },
  {
    id: "fort",
    name: "Korsan Üssü",
    level: 3,
    campHp: 170,
    enemyCount: 4,
    archerCount: 2,
    enemyHp: 50,
    enemyAttack: 10,
    loot: { bananas: 220, stones: 80, wood: 90 }
  }
];

export function getCamp(id: string): RaidCamp | undefined {
  return RAID_CAMPS.find((camp) => camp.id === id);
}
