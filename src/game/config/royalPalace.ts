import {
  PROFILE_MONKEYS,
  getProfileMonkey,
  getProfileSkin,
  isActiveProfileSkin,
  type CosmeticRarity
} from "./profileMonkeys";
import { storageCap } from "./buildings";
import type {
  ProfileMonkeyId,
  ProfileSkinId,
  Resources,
  RoyalPalaceClass,
  RoyalPalacePlacementResult,
  RoyalPalaceSlotAssignment,
  RoyalPalaceSlotId,
  WorkerLodgeUpgrade
} from "../types/game";

export type RoyalPalaceSlotDefinition = {
  slotId: RoyalPalaceSlotId;
  requiredPalaceLevel: number;
  allowedClass: RoyalPalaceClass;
  areaKey: string;
};

export const ROYAL_PALACE_SLOTS: readonly RoyalPalaceSlotDefinition[] = [
  { slotId: "palaceGarden", requiredPalaceLevel: 1, allowedClass: "worker", areaKey: "royalPalace.area.palaceGarden" },
  { slotId: "scoutPath", requiredPalaceLevel: 2, allowedClass: "scout", areaKey: "royalPalace.area.scoutPath" },
  { slotId: "guardGate", requiredPalaceLevel: 3, allowedClass: "warrior", areaKey: "royalPalace.area.guardGate" },
  { slotId: "hunterTerrace", requiredPalaceLevel: 4, allowedClass: "hunter", areaKey: "royalPalace.area.hunterTerrace" },
  { slotId: "royalCourt", requiredPalaceLevel: 5, allowedClass: "chief", areaKey: "royalPalace.area.royalCourt" },
  { slotId: "goldenThrone", requiredPalaceLevel: 6, allowedClass: "king", areaKey: "royalPalace.area.goldenThrone" }
];

export const ROYAL_PALACE_MONKEY_CLASSES: Readonly<Record<ProfileMonkeyId, RoyalPalaceClass>> = {
  profile_monkey_worker: "worker",
  profile_monkey_scout: "scout",
  profile_monkey_warrior: "warrior",
  profile_monkey_hunter: "hunter",
  profile_monkey_chief: "chief",
  profile_monkey_king: "king"
};

export const ROYAL_PALACE_LEVEL_NAME_KEYS = [
  "royalPalace.level.unbuilt",
  "royalPalace.level.1",
  "royalPalace.level.2",
  "royalPalace.level.3",
  "royalPalace.level.4",
  "royalPalace.level.5",
  "royalPalace.level.6"
] as const;

type RoyalPalaceUpgradeDefinition = {
  targetLevel: number;
  cost: Resources;
  gemCost: number;
  requiredClanHallLevel: number;
  durationMs: number;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const RAW_ROYAL_PALACE_UPGRADES: readonly RoyalPalaceUpgradeDefinition[] = [
  { targetLevel: 1, cost: { bananas: 500, wood: 300, stones: 250 }, gemCost: 0, requiredClanHallLevel: 3, durationMs: 10 * MINUTE },
  { targetLevel: 2, cost: { bananas: 900, wood: 650, stones: 500 }, gemCost: 15, requiredClanHallLevel: 4, durationMs: 30 * MINUTE },
  { targetLevel: 3, cost: { bananas: 1_500, wood: 1_100, stones: 900 }, gemCost: 30, requiredClanHallLevel: 5, durationMs: 2 * HOUR },
  { targetLevel: 4, cost: { bananas: 2_400, wood: 1_800, stones: 1_500 }, gemCost: 60, requiredClanHallLevel: 6, durationMs: 8 * HOUR },
  { targetLevel: 5, cost: { bananas: 3_200, wood: 2_700, stones: 2_300 }, gemCost: 100, requiredClanHallLevel: 8, durationMs: DAY },
  { targetLevel: 6, cost: { bananas: 4_000, wood: 3_600, stones: 3_200 }, gemCost: 180, requiredClanHallLevel: 10, durationMs: 3 * DAY }
];

export const ROYAL_PALACE_UPGRADES: readonly RoyalPalaceUpgradeDefinition[] =
  RAW_ROYAL_PALACE_UPGRADES.map((upgrade) => {
    const capacity = storageCap(upgrade.requiredClanHallLevel);
    return {
      ...upgrade,
      cost: {
        bananas: Math.min(upgrade.cost.bananas, capacity),
        stones: Math.min(upgrade.cost.stones, capacity),
        wood: Math.min(upgrade.cost.wood, capacity)
      }
    };
  });

export function royalPalaceUpgrade(currentLevel: number) {
  return ROYAL_PALACE_UPGRADES.find((entry) => entry.targetLevel === currentLevel + 1) ?? null;
}

export function royalPalaceClassForMonkey(monkeyId: ProfileMonkeyId) {
  return ROYAL_PALACE_MONKEY_CLASSES[monkeyId] ?? null;
}

export function royalPalaceSlot(slotId: RoyalPalaceSlotId) {
  return ROYAL_PALACE_SLOTS.find((slot) => slot.slotId === slotId) ?? null;
}

export function validateRoyalPalacePlacement(
  assignments: readonly RoyalPalaceSlotAssignment[],
  slotId: RoyalPalaceSlotId,
  monkeyId: ProfileMonkeyId,
  skinId: ProfileSkinId | null,
  palaceLevel: number,
  ownedMonkeys: readonly ProfileMonkeyId[],
  ownedSkins: readonly ProfileSkinId[]
): RoyalPalacePlacementResult {
  const slot = royalPalaceSlot(slotId);
  if (!slot) return "invalid-slot";
  if (palaceLevel < slot.requiredPalaceLevel) return "slot-locked";
  if (!getProfileMonkey(monkeyId) || royalPalaceClassForMonkey(monkeyId) !== slot.allowedClass) return "wrong-class";
  if (assignments.some((entry) => entry.slotId !== slotId && entry.equippedMonkeyId === monkeyId)) return "duplicate-monkey";
  if (skinId == null) return ownedMonkeys.includes(monkeyId) ? "placed" : "monkey-not-owned";
  const skin = getProfileSkin(skinId);
  if (!isActiveProfileSkin(skin) || skin.monkeyId !== monkeyId) return "invalid-skin";
  if (!ownedMonkeys.includes(skin.monkeyId)) return "parent-monkey-required";
  if (!ownedSkins.includes(skinId)) return "skin-not-owned";
  return "placed";
}

export function placeRoyalPalaceResident(
  assignments: readonly RoyalPalaceSlotAssignment[],
  assignment: RoyalPalaceSlotAssignment,
  palaceLevel: number,
  ownedMonkeys: readonly ProfileMonkeyId[],
  ownedSkins: readonly ProfileSkinId[]
) {
  const result = validateRoyalPalacePlacement(
    assignments,
    assignment.slotId,
    assignment.equippedMonkeyId,
    assignment.equippedSkinId,
    palaceLevel,
    ownedMonkeys,
    ownedSkins
  );
  if (result !== "placed") return { result, assignments: [...assignments] };
  return {
    result,
    assignments: [
      ...assignments.filter((entry) => entry.slotId !== assignment.slotId),
      assignment
    ]
  };
}

export function sanitizeRoyalPalaceSlots(
  value: unknown,
  palaceLevel: number,
  ownedMonkeys: readonly ProfileMonkeyId[],
  ownedSkins: readonly ProfileSkinId[]
) {
  if (!Array.isArray(value)) return [];
  let assignments: RoyalPalaceSlotAssignment[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as Partial<RoyalPalaceSlotAssignment>;
    if (typeof candidate.slotId !== "string" || typeof candidate.equippedMonkeyId !== "string") continue;
    const assignment: RoyalPalaceSlotAssignment = {
      slotId: candidate.slotId as RoyalPalaceSlotId,
      equippedMonkeyId: candidate.equippedMonkeyId,
      equippedSkinId: typeof candidate.equippedSkinId === "string" ? candidate.equippedSkinId : null
    };
    const placed = placeRoyalPalaceResident(assignments, assignment, palaceLevel, ownedMonkeys, ownedSkins);
    if (placed.result === "placed") assignments = placed.assignments;
  }
  return assignments;
}

const FESTIVAL_PRESTIGE: Record<CosmeticRarity, number> = {
  common: 10,
  rare: 20,
  epic: 35,
  legendary: 60,
  mythic: 100
};

export function royalPrestige(level: number, assignments: readonly RoyalPalaceSlotAssignment[]) {
  return Math.max(0, Math.min(6, Math.floor(level))) * 100 + assignments.reduce((total, assignment) => {
    const skin = assignment.equippedSkinId ? getProfileSkin(assignment.equippedSkinId) : null;
    return total + 25 + (skin?.catalogStatus === "festival" ? FESTIVAL_PRESTIGE[skin.rarity] : 0);
  }, 0);
}

export type RoyalPalaceUpgradeBlock =
  | "max-level"
  | "upgrade-active"
  | "clan-level"
  | "resource"
  | "gems"
  | null;

export function evaluateRoyalPalaceUpgrade(args: {
  palaceLevel: number;
  clanLevel: number;
  resources: Resources;
  gems: number;
  activeUpgrade: WorkerLodgeUpgrade | null;
}) {
  const definition = royalPalaceUpgrade(args.palaceLevel);
  let block: RoyalPalaceUpgradeBlock = null;
  if (!definition) block = "max-level";
  else if (args.activeUpgrade) block = "upgrade-active";
  else if (args.clanLevel < definition.requiredClanHallLevel) block = "clan-level";
  else if ((["bananas", "stones", "wood"] as const).some((resource) => args.resources[resource] < definition.cost[resource])) block = "resource";
  else if (args.gems < definition.gemCost) block = "gems";
  return { definition, block, enabled: definition != null && block == null };
}

export function startRoyalPalaceUpgrade(args: {
  palaceLevel: number;
  clanLevel: number;
  resources: Resources;
  gems: number;
  activeUpgrade: WorkerLodgeUpgrade | null;
  now: number;
}) {
  const eligibility = evaluateRoyalPalaceUpgrade(args);
  const definition = eligibility.definition;
  if (!eligibility.enabled || !definition) {
    return {
      result: eligibility.block ?? "max-level" as Exclude<RoyalPalaceUpgradeBlock, null>,
      definition,
      resources: args.resources,
      gems: args.gems,
      activeUpgrade: args.activeUpgrade
    };
  }
  return {
    result: "started" as const,
    definition,
    resources: {
      bananas: args.resources.bananas - definition.cost.bananas,
      stones: args.resources.stones - definition.cost.stones,
      wood: args.resources.wood - definition.cost.wood
    },
    gems: args.gems - definition.gemCost,
    activeUpgrade: {
      buildingType: "royalPalace" as const,
      fromLevel: args.palaceLevel,
      targetLevel: definition.targetLevel,
      startedAt: args.now,
      endsAt: args.now + definition.durationMs,
      cost: { ...definition.cost },
      requiredClanHallLevel: definition.requiredClanHallLevel
    }
  };
}

export function palaceMonkeysForClass(palaceClass: RoyalPalaceClass) {
  return PROFILE_MONKEYS.filter((monkey) => royalPalaceClassForMonkey(monkey.id) === palaceClass);
}
