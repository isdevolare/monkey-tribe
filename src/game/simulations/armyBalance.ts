import { RAID_CAMPS, strongholdCamp, type RaidCamp } from "../config/camps";
import {
  TROOPS,
  TROOP_TYPES,
  armyCapacity,
  sanitizeTroopUpgrades,
  troopCombatStats
} from "../config/troops";
import type { TroopType, TroopUpgradeLevels } from "../types/game";

export type ArmyComposition = Partial<Record<TroopType, number>>;

export type CombatSimulation = {
  campId: string;
  composition: ArmyComposition;
  playerPower: number;
  enemyPower: number;
  timeToClearSeconds: number;
  timeToLoseSeconds: number;
  victory: boolean;
};

function enemyStats(type: TroopType, camp: RaidCamp) {
  const hpFactor = type === "shield_guardian" ? 1.7 : type === "crossbowman" ? 1.15 : type === "archer" ? 0.78 : 1;
  const attackFactor = type === "crossbowman" ? 1.65 : type === "archer" ? 0.85 : type === "shield_guardian" ? 0.7 : 1;
  return {
    hp: camp.enemyHp * hpFactor,
    attack: camp.enemyAttack * attackFactor,
    intervalMs: type === "crossbowman" ? 1_350 : type === "archer" ? 720 : type === "shield_guardian" ? 1_100 : 850,
    resistance: type === "shield_guardian" ? 0.22 : type === "crossbowman" ? 0.06 : 0
  };
}

export function simulateRaid(
  composition: ArmyComposition,
  camp: RaidCamp,
  upgrades: TroopUpgradeLevels = {}
): CombatSimulation {
  let playerPower = 0;
  let playerEffectiveHp = 0;
  let playerDps = 0;
  let enemyEffectiveHp = camp.campHp;
  let enemyDps = 0;
  let hasGuardian = false;
  let hasRanged = false;

  for (const type of TROOP_TYPES) {
    const count = Math.max(0, Math.floor(composition[type] ?? 0));
    const stats = troopCombatStats(type, upgrades);
    playerPower += stats.power * count;
    playerEffectiveHp += stats.maxHp / Math.max(0.3, 1 - stats.resistance) * count;
    playerDps += stats.attack / (stats.attackIntervalMs / 1000) * count;
    hasGuardian ||= type === "shield_guardian" && count > 0;
    hasRanged ||= (type === "archer" || type === "crossbowman") && count > 0;

    const defenderCount = camp.defenders[type];
    const defender = enemyStats(type, camp);
    enemyEffectiveHp += defender.hp / Math.max(0.3, 1 - defender.resistance) * defenderCount;
    enemyDps += defender.attack / (defender.intervalMs / 1000) * defenderCount;
  }

  // Lightweight role value mirrors battlefield behavior: a real frontline
  // buys ranged units firing time without pretending to be pathfinding.
  if (hasGuardian && hasRanged) {
    playerEffectiveHp *= 1.12;
    playerDps *= 1.08;
  }

  const timeToClearSeconds = enemyEffectiveHp / Math.max(0.1, playerDps);
  const timeToLoseSeconds = playerEffectiveHp / Math.max(0.1, enemyDps);
  return {
    campId: camp.id,
    composition,
    playerPower,
    enemyPower: camp.enemyPower,
    timeToClearSeconds,
    timeToLoseSeconds,
    victory: timeToClearSeconds < timeToLoseSeconds
  };
}

export function balancedArmyForCamp(camp: RaidCamp) {
  const nestLevel = Math.min(10, Math.max(1, camp.requiredTrainingNestLevel));
  let remaining = armyCapacity(nestLevel);
  const composition: ArmyComposition = {};
  const add = (type: TroopType) => {
    const housing = TROOPS[type].housing;
    if (remaining < housing) return false;
    composition[type] = (composition[type] ?? 0) + 1;
    remaining -= housing;
    return true;
  };

  if (nestLevel >= 3) {
    const guardianHousing = Math.floor(armyCapacity(nestLevel) * 0.3);
    while ((composition.shield_guardian ?? 0) * 2 < guardianHousing && add("shield_guardian")) {
      // Fill roughly thirty percent with a frontline.
    }
  }
  if (nestLevel >= 5) {
    const crossbowHousing = Math.floor(armyCapacity(nestLevel) * 0.25);
    while ((composition.crossbowman ?? 0) * 2 < crossbowHousing && add("crossbowman")) {
      // Heavy ranged support behind the frontline.
    }
  }
  let toggle = false;
  while (remaining > 0) {
    add(toggle ? "fighter" : "archer");
    toggle = !toggle;
  }

  const upgrades = sanitizeTroopUpgrades(
    Object.fromEntries(TROOP_TYPES.map((type) => [
      type,
      Object.fromEntries(TROOPS[type].upgradeStats.map((stat) => [
        stat,
        Math.min(5, Math.max(0, nestLevel - TROOPS[type].unlockLevel + 1))
      ]))
    ])) as TroopUpgradeLevels
  );
  return { composition, upgrades, nestLevel };
}

export function simulateAllProgressionCamps() {
  return [...RAID_CAMPS, strongholdCamp(15)].map((camp) => {
    const army = balancedArmyForCamp(camp);
    return { camp, army, result: simulateRaid(army.composition, camp, army.upgrades) };
  });
}
