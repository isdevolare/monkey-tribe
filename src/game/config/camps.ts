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
    archerCount: 1,
    enemyHp: 44,
    enemyAttack: 9,
    loot: { bananas: 220, stones: 80, wood: 90 }
  },
  {
    id: "den",
    name: "Yağmacı Sığınağı",
    level: 4,
    campHp: 200,
    enemyCount: 3,
    archerCount: 2,
    enemyHp: 52,
    enemyAttack: 11,
    loot: { bananas: 300, stones: 110, wood: 120 }
  },
  {
    id: "swamp",
    name: "Bataklık Karakolu",
    level: 5,
    campHp: 250,
    enemyCount: 4,
    archerCount: 2,
    enemyHp: 58,
    enemyAttack: 12,
    loot: { bananas: 400, stones: 150, wood: 170 }
  },
  {
    id: "skull",
    name: "Kafatası Tepesi",
    level: 6,
    campHp: 300,
    enemyCount: 4,
    archerCount: 3,
    enemyHp: 64,
    enemyAttack: 13,
    loot: { bananas: 520, stones: 200, wood: 220 }
  },
  {
    id: "harbor",
    name: "Gölge Limanı",
    level: 7,
    campHp: 360,
    enemyCount: 5,
    archerCount: 3,
    enemyHp: 70,
    enemyAttack: 15,
    loot: { bananas: 660, stones: 260, wood: 280 }
  }
];

// The endless late-game ladder starts one level above the handcrafted camps.
export const STRONGHOLD_BASE_LEVEL = 8;

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
    campHp: 430 + tier * 65,
    enemyCount: Math.min(5 + Math.ceil(tier / 2), 7),
    archerCount: Math.min(3 + Math.floor(tier / 2), 5),
    enemyHp: 76 + tier * 8,
    enemyAttack: 16 + tier * 2,
    loot: {
      bananas: 820 + tier * 160,
      stones: 330 + tier * 65,
      wood: 350 + tier * 70
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
