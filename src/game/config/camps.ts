import { t, type Lang } from "../i18n";
import type { Resources, TroopType } from "../types/game";

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
  defenders: Record<TroopType, number>;
  enemyHp: number;
  enemyAttack: number;
  enemyPower: number;
  recommendedPower: number;
  requiredTrainingNestLevel: number;
  loot: Resources;
  /** Difficulty band: 1 = starter ladder, 2 = hard mode with richer loot. */
  tier?: 2;
};

// Leveled enemy camps the player can raid, easiest first.
export const RAID_CAMPS: RaidCamp[] = [
  {
    id: "patrol",
    name: "Korsan Devriyesi",
    level: 1,
    campHp: 90,
    defenders: { fighter: 2, shield_guardian: 0, archer: 0, crossbowman: 0 },
    enemyHp: 42,
    enemyAttack: 7,
    enemyPower: 50,
    recommendedPower: 48,
    requiredTrainingNestLevel: 1,
    loot: { bananas: 60, stones: 20, wood: 25 }
  },
  {
    id: "camp",
    name: "Korsan Kampı",
    level: 2,
    campHp: 125,
    defenders: { fighter: 2, shield_guardian: 0, archer: 1, crossbowman: 0 },
    enemyHp: 46,
    enemyAttack: 8,
    enemyPower: 78,
    recommendedPower: 75,
    requiredTrainingNestLevel: 1,
    loot: { bananas: 120, stones: 45, wood: 50 }
  },
  {
    id: "fort",
    name: "Korsan Üssü",
    level: 3,
    campHp: 165,
    defenders: { fighter: 3, shield_guardian: 1, archer: 1, crossbowman: 0 },
    enemyHp: 50,
    enemyAttack: 9,
    enemyPower: 112,
    recommendedPower: 108,
    requiredTrainingNestLevel: 3,
    loot: { bananas: 220, stones: 80, wood: 90 }
  },
  {
    id: "den",
    name: "Yağmacı Sığınağı",
    level: 4,
    campHp: 215,
    defenders: { fighter: 3, shield_guardian: 1, archer: 2, crossbowman: 0 },
    enemyHp: 56,
    enemyAttack: 11,
    enemyPower: 158,
    recommendedPower: 150,
    requiredTrainingNestLevel: 3,
    loot: { bananas: 300, stones: 110, wood: 120 }
  },
  {
    id: "swamp",
    name: "Bataklık Karakolu",
    level: 5,
    campHp: 250,
    defenders: { fighter: 3, shield_guardian: 2, archer: 2, crossbowman: 1 },
    enemyHp: 58,
    enemyAttack: 12,
    enemyPower: 225,
    recommendedPower: 215,
    requiredTrainingNestLevel: 5,
    loot: { bananas: 400, stones: 150, wood: 170 }
  },
  {
    id: "skull",
    name: "Kafatası Tepesi",
    level: 6,
    campHp: 300,
    defenders: { fighter: 4, shield_guardian: 2, archer: 2, crossbowman: 1 },
    enemyHp: 64,
    enemyAttack: 13,
    enemyPower: 265,
    recommendedPower: 250,
    requiredTrainingNestLevel: 5,
    loot: { bananas: 520, stones: 200, wood: 220 }
  },
  {
    id: "harbor",
    name: "Gölge Limanı",
    level: 7,
    campHp: 360,
    defenders: { fighter: 4, shield_guardian: 2, archer: 3, crossbowman: 1 },
    enemyHp: 70,
    enemyAttack: 15,
    enemyPower: 300,
    recommendedPower: 285,
    requiredTrainingNestLevel: 5,
    loot: { bananas: 660, stones: 260, wood: 280 }
  },

  // ── 2. Kademe: hard mode. Defenders outclass the starter ladder, and
  // the loot pays for it — big hauls need a leveled Clan Hall to bank.
  {
    id: "cove",
    name: "Kızıl Koy",
    level: 8,
    campHp: 420,
    defenders: { fighter: 4, shield_guardian: 3, archer: 3, crossbowman: 1 },
    enemyHp: 78,
    enemyAttack: 16,
    enemyPower: 330,
    recommendedPower: 315,
    requiredTrainingNestLevel: 6,
    loot: { bananas: 800, stones: 320, wood: 340 },
    tier: 2
  },
  {
    id: "venom",
    name: "Zehir Bataklığı",
    level: 9,
    campHp: 470,
    defenders: { fighter: 4, shield_guardian: 3, archer: 3, crossbowman: 2 },
    enemyHp: 84,
    enemyAttack: 17,
    enemyPower: 365,
    recommendedPower: 350,
    requiredTrainingNestLevel: 7,
    loot: { bananas: 950, stones: 380, wood: 400 },
    tier: 2
  },
  {
    id: "storm",
    name: "Fırtına Burnu",
    level: 10,
    campHp: 520,
    defenders: { fighter: 5, shield_guardian: 3, archer: 3, crossbowman: 2 },
    enemyHp: 90,
    enemyAttack: 18,
    enemyPower: 405,
    recommendedPower: 385,
    requiredTrainingNestLevel: 7,
    loot: { bananas: 1100, stones: 440, wood: 470 },
    tier: 2
  },
  {
    id: "bones",
    name: "Kemik Vadisi",
    level: 11,
    campHp: 570,
    defenders: { fighter: 5, shield_guardian: 3, archer: 4, crossbowman: 2 },
    enemyHp: 92,
    enemyAttack: 18,
    enemyPower: 445,
    recommendedPower: 425,
    requiredTrainingNestLevel: 8,
    loot: { bananas: 1300, stones: 520, wood: 550 },
    tier: 2
  },
  {
    id: "ember",
    name: "Kor Kayalıkları",
    level: 12,
    campHp: 620,
    defenders: { fighter: 5, shield_guardian: 4, archer: 4, crossbowman: 2 },
    enemyHp: 96,
    enemyAttack: 19,
    enemyPower: 495,
    recommendedPower: 470,
    requiredTrainingNestLevel: 9,
    loot: { bananas: 1500, stones: 600, wood: 640 },
    tier: 2
  },
  {
    id: "blackfort",
    name: "Kara Hisar",
    level: 13,
    campHp: 680,
    defenders: { fighter: 5, shield_guardian: 4, archer: 4, crossbowman: 3 },
    enemyHp: 100,
    enemyAttack: 20,
    enemyPower: 550,
    recommendedPower: 525,
    requiredTrainingNestLevel: 9,
    loot: { bananas: 1750, stones: 700, wood: 740 },
    tier: 2
  },
  {
    id: "armada",
    name: "Korsan Armadası",
    level: 14,
    campHp: 680,
    defenders: { fighter: 6, shield_guardian: 4, archer: 4, crossbowman: 3 },
    enemyHp: 104,
    enemyAttack: 20,
    enemyPower: 620,
    recommendedPower: 585,
    requiredTrainingNestLevel: 10,
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
    defenders: {
      fighter: Math.min(6 + Math.floor(tier / 4), 8),
      shield_guardian: Math.min(4 + Math.floor(tier / 5), 6),
      archer: 5,
      crossbowman: Math.min(3 + Math.floor(tier / 6), 5)
    },
    enemyHp: 110 + tier * 7,
    enemyAttack: 21 + tier * 2,
    enemyPower: 660 + tier * 45,
    recommendedPower: 625 + tier * 42,
    requiredTrainingNestLevel: 10,
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
