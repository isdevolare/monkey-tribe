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
  /** Difficulty band: 1 = starter ladder, 2 = hard mode with richer loot. */
  tier?: 2;
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
  },

  // ── 2. Kademe: hard mode. Defenders outclass the starter ladder, and
  // the loot pays for it — big hauls need a leveled Clan Hall to bank.
  {
    id: "cove",
    name: "Kızıl Koy",
    level: 8,
    campHp: 420,
    enemyCount: 5,
    archerCount: 3,
    enemyHp: 78,
    enemyAttack: 16,
    loot: { bananas: 800, stones: 320, wood: 340 },
    tier: 2
  },
  {
    id: "venom",
    name: "Zehir Bataklığı",
    level: 9,
    campHp: 470,
    enemyCount: 5,
    archerCount: 4,
    enemyHp: 84,
    enemyAttack: 17,
    loot: { bananas: 950, stones: 380, wood: 400 },
    tier: 2
  },
  {
    id: "storm",
    name: "Fırtına Burnu",
    level: 10,
    campHp: 520,
    enemyCount: 6,
    archerCount: 4,
    enemyHp: 90,
    enemyAttack: 18,
    loot: { bananas: 1100, stones: 440, wood: 470 },
    tier: 2
  },
  {
    id: "bones",
    name: "Kemik Vadisi",
    level: 11,
    campHp: 570,
    enemyCount: 6,
    archerCount: 4,
    enemyHp: 92,
    enemyAttack: 18,
    loot: { bananas: 1300, stones: 520, wood: 550 },
    tier: 2
  },
  {
    id: "ember",
    name: "Kor Kayalıkları",
    level: 12,
    campHp: 620,
    enemyCount: 6,
    archerCount: 5,
    enemyHp: 96,
    enemyAttack: 19,
    loot: { bananas: 1500, stones: 600, wood: 640 },
    tier: 2
  },
  {
    id: "blackfort",
    name: "Kara Hisar",
    level: 13,
    campHp: 680,
    enemyCount: 6,
    archerCount: 5,
    enemyHp: 100,
    enemyAttack: 20,
    loot: { bananas: 1750, stones: 700, wood: 740 },
    tier: 2
  },
  {
    id: "armada",
    name: "Korsan Armadası",
    level: 14,
    campHp: 680,
    enemyCount: 6,
    archerCount: 5,
    enemyHp: 104,
    enemyAttack: 20,
    loot: { bananas: 2000, stones: 800, wood: 850 },
    tier: 2
  }
];

// The endless late-game ladder starts one level above the handcrafted camps.
export const STRONGHOLD_BASE_LEVEL = 15;

/**
 * Procedural "Korsan Kalesi": one stronghold that comes back one level
 * stronger every time it falls, so raids never run out of targets. Its
 * floor sits just above the tier-2 armada.
 */
export function strongholdCamp(level: number): RaidCamp {
  const tier = Math.max(0, level - STRONGHOLD_BASE_LEVEL);
  return {
    id: `stronghold-${level}`,
    name: "Korsan Kalesi",
    level,
    campHp: 720 + tier * 70,
    enemyCount: Math.min(6 + Math.floor(tier / 4), 7),
    archerCount: 5,
    enemyHp: 110 + tier * 7,
    enemyAttack: 21 + tier * 2,
    loot: {
      bananas: 2200 + tier * 180,
      stones: 880 + tier * 70,
      wood: 930 + tier * 75
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
