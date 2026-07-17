import type { GameAssetKey } from "../assets/gameAssets";
import type {
  Resources,
  RaidArmyResult,
  TroopType,
  TroopUpgradeLevels,
  TroopUpgradeStat,
  Unit,
  UnitCombatStats
} from "../types/game";

export type TroopDefinition = {
  id: TroopType;
  roleKey: string;
  unlockLevel: number;
  housing: number;
  cost: Resources;
  trainingDurationMs: number;
  baseStats: Omit<UnitCombatStats, "power">;
  rolePower: number;
  artwork: GameAssetKey;
  upgradeStats: readonly TroopUpgradeStat[];
};

export const TROOP_TYPES: readonly TroopType[] = [
  "fighter",
  "shield_guardian",
  "archer",
  "crossbowman"
];

export const ARMY_CAPACITY_BY_NEST_LEVEL = [0, 6, 8, 10, 12, 15, 18, 22, 26, 30, 35] as const;

export const TROOPS: Record<TroopType, TroopDefinition> = {
  fighter: {
    id: "fighter",
    roleKey: "trainingNest.role.fighter",
    unlockLevel: 1,
    housing: 1,
    cost: { bananas: 15, stones: 5, wood: 3 },
    trainingDurationMs: 9_000,
    baseStats: {
      maxHp: 56,
      attack: 10,
      range: 1,
      attackIntervalMs: 850,
      moveIntervalMs: 330,
      resistance: 0,
      armorPenetration: 0
    },
    rolePower: 1.5,
    artwork: "unitWarrior",
    upgradeStats: ["health", "attack"]
  },
  shield_guardian: {
    id: "shield_guardian",
    roleKey: "trainingNest.role.shield_guardian",
    unlockLevel: 3,
    housing: 2,
    cost: { bananas: 35, stones: 28, wood: 18 },
    trainingDurationMs: 18_000,
    baseStats: {
      maxHp: 135,
      attack: 6,
      range: 1,
      attackIntervalMs: 1_100,
      moveIntervalMs: 520,
      resistance: 0.28,
      armorPenetration: 0
    },
    rolePower: 4,
    artwork: "unitShieldGuardian",
    upgradeStats: ["health", "resistance"]
  },
  archer: {
    id: "archer",
    roleKey: "trainingNest.role.archer",
    unlockLevel: 1,
    housing: 1,
    cost: { bananas: 20, stones: 6, wood: 10 },
    trainingDurationMs: 11_000,
    baseStats: {
      maxHp: 32,
      attack: 7,
      range: 3,
      attackIntervalMs: 650,
      moveIntervalMs: 300,
      resistance: 0,
      armorPenetration: 0
    },
    rolePower: 2,
    artwork: "unitArcher",
    upgradeStats: ["attack", "attackSpeed"]
  },
  crossbowman: {
    id: "crossbowman",
    roleKey: "trainingNest.role.crossbowman",
    unlockLevel: 5,
    housing: 2,
    cost: { bananas: 42, stones: 24, wood: 32 },
    trainingDurationMs: 22_000,
    baseStats: {
      maxHp: 64,
      attack: 20,
      range: 4,
      attackIntervalMs: 1_350,
      moveIntervalMs: 410,
      resistance: 0.08,
      armorPenetration: 0.35
    },
    rolePower: 8,
    artwork: "unitCrossbowman",
    upgradeStats: ["attack", "armorPenetration"]
  }
};

export const MAX_TROOP_UPGRADE_LEVEL = 5;
export const TROOP_UPGRADE_STEP = 0.07;

export function armyCapacity(nestLevel: number) {
  const level = Math.min(10, Math.max(0, Math.floor(nestLevel)));
  return ARMY_CAPACITY_BY_NEST_LEVEL[level] ?? 0;
}

export function isTroopType(value: unknown): value is TroopType {
  return typeof value === "string" && TROOP_TYPES.includes(value as TroopType);
}

/** Maps the pre-refactor Guardian id without losing existing roster or queue entries. */
export function migrateTroopType(value: unknown): TroopType | null {
  if (value === "guardian") {
    return "shield_guardian";
  }
  return isTroopType(value) ? value : null;
}

export function troopHousing(type: TroopType) {
  return TROOPS[type].housing;
}

/** Sequential queue scheduling; elapsed/offline time is represented by absolute timestamps. */
export function trainingFinishAt(
  queue: ReadonlyArray<{ finishAt: number }>,
  type: TroopType,
  now: number
) {
  const tail = queue[queue.length - 1];
  const tailFinish = tail && Number.isFinite(tail.finishAt) ? tail.finishAt : now;
  return Math.max(now, tailFinish) + TROOPS[type].trainingDurationMs;
}

export function calculateTroopPower(
  type: TroopType,
  stats: Omit<UnitCombatStats, "power"> | UnitCombatStats
) {
  const durability = stats.maxHp / 10 / Math.max(0.35, 1 - stats.resistance);
  const dps = stats.attack / Math.max(0.25, stats.attackIntervalMs / 1000);
  const rangeFactor = 1 + Math.max(0, stats.range - 1) * 0.08;
  return Math.max(1, Math.round((durability + dps * 0.45) * rangeFactor + TROOPS[type].rolePower));
}

function upgradeLevel(
  upgrades: TroopUpgradeLevels,
  type: TroopType,
  stat: TroopUpgradeStat
) {
  const value = upgrades[type]?.[stat] ?? 0;
  return Number.isFinite(value)
    ? Math.min(MAX_TROOP_UPGRADE_LEVEL, Math.max(0, Math.floor(value)))
    : 0;
}

export function troopCombatStats(
  type: TroopType,
  upgrades: TroopUpgradeLevels = {}
): UnitCombatStats {
  const base = TROOPS[type].baseStats;
  const healthLevel = upgradeLevel(upgrades, type, "health");
  const attackLevel = upgradeLevel(upgrades, type, "attack");
  const resistanceLevel = upgradeLevel(upgrades, type, "resistance");
  const speedLevel = upgradeLevel(upgrades, type, "attackSpeed");
  const penetrationLevel = upgradeLevel(upgrades, type, "armorPenetration");
  const stats = {
    maxHp: Math.round(base.maxHp * (1 + healthLevel * TROOP_UPGRADE_STEP)),
    attack: Math.round(base.attack * (1 + attackLevel * TROOP_UPGRADE_STEP)),
    range: base.range,
    attackIntervalMs: Math.max(350, Math.round(base.attackIntervalMs / (1 + speedLevel * TROOP_UPGRADE_STEP))),
    moveIntervalMs: base.moveIntervalMs,
    resistance: Math.min(0.55, base.resistance + resistanceLevel * 0.025),
    armorPenetration: Math.min(0.7, base.armorPenetration + penetrationLevel * 0.04)
  };
  return { ...stats, power: calculateTroopPower(type, stats) };
}

export function sanitizeTroopUpgrades(value: TroopUpgradeLevels | undefined): TroopUpgradeLevels {
  const next: TroopUpgradeLevels = {};
  for (const type of TROOP_TYPES) {
    const source = value?.[type];
    const entry: Partial<Record<TroopUpgradeStat, number>> = {};
    for (const stat of TROOPS[type].upgradeStats) {
      const level = source?.[stat] ?? 0;
      entry[stat] = Number.isFinite(level)
        ? Math.min(MAX_TROOP_UPGRADE_LEVEL, Math.max(0, Math.floor(level)))
        : 0;
    }
    next[type] = entry;
  }
  return next;
}

export function troopUpgradeRequirement(type: TroopType, currentLevel: number) {
  return Math.min(10, TROOPS[type].unlockLevel + currentLevel);
}

export function troopUpgradeCost(type: TroopType, stat: TroopUpgradeStat, nextLevel: number): Resources {
  const housingFactor = TROOPS[type].housing;
  const statFactor = stat === "resistance" || stat === "armorPenetration" ? 1.3 : 1;
  const scale = Math.max(1, nextLevel) * housingFactor * statFactor;
  return {
    bananas: Math.round(18 * scale),
    stones: Math.round(12 * scale),
    wood: Math.round(15 * scale)
  };
}

export function armyHousing(units: Unit[], queuedTypes: TroopType[] = []) {
  const roster = units.reduce((sum, unit) => {
    if (!isLivingPlayerTroop(unit)) {
      return sum;
    }
    return sum + troopHousing(unit.type);
  }, 0);
  return roster + queuedTypes.reduce((sum, type) => sum + troopHousing(type), 0);
}

export function armyPower(units: Unit[]) {
  return units.reduce((sum, unit) => {
    if (!isLivingPlayerTroop(unit)) {
      return sum;
    }
    return sum + calculateTroopPower(unit.type, unit);
  }, 0);
}

export function troopCountByType(units: Unit[]) {
  const counts: Record<TroopType, number> = {
    fighter: 0,
    shield_guardian: 0,
    archer: 0,
    crossbowman: 0
  };
  for (const unit of units) {
    if (isLivingPlayerTroop(unit)) {
      counts[unit.type] += 1;
    }
  }
  return counts;
}

export function isLivingPlayerTroop(
  unit: Unit
): unit is Unit & { type: TroopType } {
  return (
    unit.owner === "player" &&
    unit.state !== "dead" &&
    unit.hp > 0 &&
    isTroopType(unit.type)
  );
}

export function summarizeRaidArmy(
  units: Unit[],
  deployedUnitIds?: ReadonlyArray<string>
): RaidArmyResult {
  const deployedIds = deployedUnitIds ? new Set(deployedUnitIds) : null;
  const survivorTypes: Partial<Record<TroopType, number>> = {};
  const lostTypes: Partial<Record<TroopType, number>> = {};
  let deployed = 0;
  let survivors = 0;

  for (const unit of units) {
    if (
      unit.owner !== "player" ||
      !isTroopType(unit.type) ||
      (deployedIds && !deployedIds.has(unit.id))
    ) {
      continue;
    }
    deployed += 1;
    if (isLivingPlayerTroop(unit)) {
      survivors += 1;
      survivorTypes[unit.type] = (survivorTypes[unit.type] ?? 0) + 1;
    } else {
      lostTypes[unit.type] = (lostTypes[unit.type] ?? 0) + 1;
    }
  }

  return {
    deployed,
    survivors,
    losses: deployed - survivors,
    survivorTypes,
    lostTypes
  };
}

export type RaidRisk = "veryEasy" | "favorable" | "balanced" | "risky" | "veryRisky";

export function raidRisk(army: number, recommended: number): RaidRisk {
  const ratio = recommended > 0 ? army / recommended : 2;
  if (ratio >= 1.35) return "veryEasy";
  if (ratio >= 1.1) return "favorable";
  if (ratio >= 0.9) return "balanced";
  if (ratio >= 0.65) return "risky";
  return "veryRisky";
}
