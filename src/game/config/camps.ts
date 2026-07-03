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
    // Tuned so a single fresh fighter can clear it: one soft defender.
    id: "patrol",
    name: "Korsan Devriyesi",
    level: 1,
    campHp: 70,
    enemyCount: 1,
    enemyHp: 30,
    enemyAttack: 6,
    loot: { bananas: 60, stones: 20, wood: 25 }
  },
  {
    id: "camp",
    name: "Korsan Kampı",
    level: 2,
    campHp: 110,
    enemyCount: 2,
    archerCount: 1,
    enemyHp: 40,
    enemyAttack: 8,
    loot: { bananas: 120, stones: 45, wood: 50 }
  },
  {
    id: "fort",
    name: "Korsan Üssü",
    level: 3,
    campHp: 160,
    enemyCount: 3,
    archerCount: 2,
    enemyHp: 46,
    enemyAttack: 10,
    loot: { bananas: 220, stones: 80, wood: 90 }
  }
];

export function getCamp(id: string): RaidCamp | undefined {
  return RAID_CAMPS.find((camp) => camp.id === id);
}
