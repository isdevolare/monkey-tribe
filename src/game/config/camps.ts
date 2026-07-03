import { t, type Lang } from "../i18n";
import type { Resources } from "../types/game";

export function campName(id: string, lang: Lang) {
  if (id.startsWith("stronghold-")) {
    return t("camp.stronghold", lang);
  }
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

// The endless late-game ladder starts one level above the handcrafted camps.
export const STRONGHOLD_BASE_LEVEL = 4;

/**
 * Procedural "Korsan Kalesi": one stronghold that comes back one level
 * stronger every time it falls, so raids never run out of targets.
 */
export function strongholdCamp(level: number): RaidCamp {
  const tier = Math.max(0, level - STRONGHOLD_BASE_LEVEL);
  return {
    id: `stronghold-${level}`,
    name: "Korsan Kalesi",
    level,
    campHp: 200 + tier * 55,
    enemyCount: Math.min(3 + Math.ceil(tier / 2), 6),
    archerCount: Math.min(2 + Math.floor(tier / 2), 4),
    enemyHp: 52 + tier * 7,
    enemyAttack: 11 + tier * 2,
    loot: {
      bananas: 300 + tier * 130,
      stones: 110 + tier * 50,
      wood: 120 + tier * 55
    }
  };
}

export function getCamp(id: string): RaidCamp | undefined {
  if (id.startsWith("stronghold-")) {
    const level = Number(id.slice("stronghold-".length));
    return Number.isInteger(level) && level >= STRONGHOLD_BASE_LEVEL
      ? strongholdCamp(level)
      : undefined;
  }
  return RAID_CAMPS.find((camp) => camp.id === id);
}
