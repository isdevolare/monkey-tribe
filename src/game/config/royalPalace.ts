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
  RoyalCharacterDisplay,
  RoyalPalaceClass,
  RoyalPalacePlacementResult,
  RoyalPalaceSlotAssignment,
  RoyalPalaceSlotId,
  WorkerLodgeUpgrade
} from "../types/game";

export const ROYAL_PALACE_SAVE_VERSION = 2;
export const ROYAL_PALACE_MAX_LEVEL = 3;

export type RoyalPalaceCharacterDefinition = {
  characterId: ProfileMonkeyId;
  palaceClass: RoyalPalaceClass;
  palaceUnlockLevel: number;
  displayPosition: RoyalPalaceSlotId;
  areaKey: string;
};

/** Character identity, unlock level and fixed display position live in one config. */
export const ROYAL_PALACE_CHARACTERS: readonly RoyalPalaceCharacterDefinition[] = [
  { characterId: "profile_monkey_worker", palaceClass: "worker", palaceUnlockLevel: 1, displayPosition: "palaceGarden", areaKey: "royalPalace.area.palaceGarden" },
  { characterId: "profile_monkey_scout", palaceClass: "scout", palaceUnlockLevel: 1, displayPosition: "scoutPath", areaKey: "royalPalace.area.scoutPath" },
  { characterId: "profile_monkey_warrior", palaceClass: "warrior", palaceUnlockLevel: 1, displayPosition: "guardGate", areaKey: "royalPalace.area.guardGate" },
  { characterId: "profile_monkey_hunter", palaceClass: "hunter", palaceUnlockLevel: 2, displayPosition: "hunterTerrace", areaKey: "royalPalace.area.hunterTerrace" },
  { characterId: "profile_monkey_chief", palaceClass: "chief", palaceUnlockLevel: 2, displayPosition: "royalCourt", areaKey: "royalPalace.area.royalCourt" },
  { characterId: "profile_monkey_king", palaceClass: "king", palaceUnlockLevel: 3, displayPosition: "goldenThrone", areaKey: "royalPalace.area.goldenThrone" }
];

export type RoyalPalaceSlotDefinition = {
  slotId: RoyalPalaceSlotId;
  requiredPalaceLevel: number;
  allowedClass: RoyalPalaceClass;
  areaKey: string;
};

/** Compatibility view for village positioning and legacy save migration. */
export const ROYAL_PALACE_SLOTS: readonly RoyalPalaceSlotDefinition[] =
  ROYAL_PALACE_CHARACTERS.map((entry) => ({
    slotId: entry.displayPosition,
    requiredPalaceLevel: entry.palaceUnlockLevel,
    allowedClass: entry.palaceClass,
    areaKey: entry.areaKey
  }));

export const ROYAL_PALACE_MONKEY_CLASSES: Readonly<Record<ProfileMonkeyId, RoyalPalaceClass>> =
  Object.fromEntries(ROYAL_PALACE_CHARACTERS.map((entry) => [entry.characterId, entry.palaceClass]));

export const ROYAL_PALACE_LEVEL_NAME_KEYS = [
  "royalPalace.level.unbuilt",
  "royalPalace.level.1",
  "royalPalace.level.2",
  "royalPalace.level.3"
] as const;

export type RoyalPalaceUpgradeDefinition = {
  targetLevel: number;
  cost: Resources;
  /** Fixed Gem price for completing an already-running upgrade immediately. */
  gemCost: number;
  requiredClanHallLevel: number;
  durationMs: number;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const RAW_ROYAL_PALACE_UPGRADES: readonly RoyalPalaceUpgradeDefinition[] = [
  { targetLevel: 1, cost: { bananas: 250, wood: 250, stones: 250 }, gemCost: 5, requiredClanHallLevel: 2, durationMs: 30 * MINUTE },
  { targetLevel: 2, cost: { bananas: 750, wood: 750, stones: 750 }, gemCost: 10, requiredClanHallLevel: 4, durationMs: HOUR },
  { targetLevel: 3, cost: { bananas: 1_500, wood: 1_500, stones: 1_500 }, gemCost: 20, requiredClanHallLevel: 6, durationMs: 2 * HOUR }
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

export function royalPalaceCharacter(characterId: ProfileMonkeyId) {
  return ROYAL_PALACE_CHARACTERS.find((entry) => entry.characterId === characterId) ?? null;
}

export function royalPalaceClassForMonkey(monkeyId: ProfileMonkeyId) {
  return royalPalaceCharacter(monkeyId)?.palaceClass ?? null;
}

export function royalPalaceSlot(slotId: RoyalPalaceSlotId) {
  return ROYAL_PALACE_SLOTS.find((slot) => slot.slotId === slotId) ?? null;
}

export function migrateRoyalPalaceLevel(value: unknown, saveVersion?: number) {
  const level = typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
  if (saveVersion === ROYAL_PALACE_SAVE_VERSION) return Math.min(ROYAL_PALACE_MAX_LEVEL, level);
  if (level === 0) return 0;
  if (level <= 2) return 1;
  if (level <= 5) return 2;
  return 3;
}

/** Keeps an in-flight legacy upgrade on the shared building timer. */
export function migrateRoyalPalaceActiveUpgrade(
  value: WorkerLodgeUpgrade | null | undefined,
  saveVersion?: number
): WorkerLodgeUpgrade | null | undefined {
  if (!value || value.buildingType !== "royalPalace" || saveVersion === ROYAL_PALACE_SAVE_VERSION) return value;
  const fromLevel = migrateRoyalPalaceLevel(value.fromLevel, saveVersion);
  const mappedTarget = migrateRoyalPalaceLevel(value.targetLevel, saveVersion);
  if (fromLevel >= ROYAL_PALACE_MAX_LEVEL) return null;
  return {
    ...value,
    fromLevel,
    targetLevel: Math.max(fromLevel + 1, mappedTarget)
  };
}

function validSelectedSkin(
  characterId: ProfileMonkeyId,
  skinId: unknown,
  ownedMonkeys: readonly ProfileMonkeyId[],
  ownedSkins: readonly ProfileSkinId[]
): ProfileSkinId | null {
  if (typeof skinId !== "string") return null;
  const skin = getProfileSkin(skinId);
  return isActiveProfileSkin(skin) &&
    skin.monkeyId === characterId &&
    ownedMonkeys.includes(characterId) &&
    ownedSkins.includes(skinId)
    ? skinId
    : null;
}

export function createRoyalCharacterDisplays(
  palaceLevel: number,
  ownedMonkeys: readonly ProfileMonkeyId[],
  ownedSkins: readonly ProfileSkinId[]
): RoyalCharacterDisplay[] {
  return ROYAL_PALACE_CHARACTERS.map((definition) => ({
    characterId: definition.characterId,
    selectedSkinId: null,
    isVisible: palaceLevel >= definition.palaceUnlockLevel && ownedMonkeys.includes(definition.characterId),
    displayPosition: definition.displayPosition
  }));
}

export function sanitizeRoyalCharacterDisplays(args: {
  value: unknown;
  legacySlots?: unknown;
  palaceLevel: number;
  ownedMonkeys: readonly ProfileMonkeyId[];
  ownedSkins: readonly ProfileSkinId[];
  legacyEquippedMonkey?: unknown;
  legacyEquippedSkin?: unknown;
}) {
  const displays = createRoyalCharacterDisplays(args.palaceLevel, args.ownedMonkeys, args.ownedSkins);
  const byCharacter = new Map(displays.map((entry) => [entry.characterId, entry]));
  const explicitCharacters = new Set<ProfileMonkeyId>();

  if (Array.isArray(args.value)) {
    for (const raw of args.value) {
      if (!raw || typeof raw !== "object") continue;
      const candidate = raw as Partial<RoyalCharacterDisplay>;
      if (typeof candidate.characterId !== "string") continue;
      const definition = royalPalaceCharacter(candidate.characterId);
      const current = byCharacter.get(candidate.characterId);
      if (!definition || !current) continue;
      explicitCharacters.add(candidate.characterId);
      current.selectedSkinId = validSelectedSkin(candidate.characterId, candidate.selectedSkinId, args.ownedMonkeys, args.ownedSkins);
      current.isVisible = candidate.isVisible === true &&
        args.palaceLevel >= definition.palaceUnlockLevel &&
        args.ownedMonkeys.includes(candidate.characterId);
      current.displayPosition = definition.displayPosition;
    }
  }

  if (Array.isArray(args.legacySlots)) {
    const migratedLegacyCharacters = new Set<ProfileMonkeyId>();
    for (const raw of args.legacySlots) {
      if (!raw || typeof raw !== "object") continue;
      const candidate = raw as Partial<RoyalPalaceSlotAssignment>;
      if (
        typeof candidate.equippedMonkeyId !== "string" ||
        explicitCharacters.has(candidate.equippedMonkeyId) ||
        migratedLegacyCharacters.has(candidate.equippedMonkeyId)
      ) continue;
      const definition = royalPalaceCharacter(candidate.equippedMonkeyId);
      const current = byCharacter.get(candidate.equippedMonkeyId);
      if (!definition || !current) continue;
      current.selectedSkinId = validSelectedSkin(candidate.equippedMonkeyId, candidate.equippedSkinId, args.ownedMonkeys, args.ownedSkins);
      current.isVisible = args.palaceLevel >= definition.palaceUnlockLevel && args.ownedMonkeys.includes(candidate.equippedMonkeyId);
      migratedLegacyCharacters.add(candidate.equippedMonkeyId);
    }
  }

  if (typeof args.legacyEquippedMonkey === "string" && !explicitCharacters.has(args.legacyEquippedMonkey)) {
    const current = byCharacter.get(args.legacyEquippedMonkey);
    if (current) {
      current.selectedSkinId = validSelectedSkin(args.legacyEquippedMonkey, args.legacyEquippedSkin, args.ownedMonkeys, args.ownedSkins);
    }
  }
  return displays;
}

export function selectRoyalCharacterSkin(
  displays: readonly RoyalCharacterDisplay[],
  characterId: ProfileMonkeyId,
  skinId: ProfileSkinId | null,
  palaceLevel: number,
  ownedMonkeys: readonly ProfileMonkeyId[],
  ownedSkins: readonly ProfileSkinId[]
) {
  const definition = royalPalaceCharacter(characterId);
  if (!definition || !getProfileMonkey(characterId)) return { result: "invalid-slot" as const, displays: [...displays] };
  if (palaceLevel < definition.palaceUnlockLevel) return { result: "slot-locked" as const, displays: [...displays] };
  if (skinId == null && !ownedMonkeys.includes(characterId)) return { result: "monkey-not-owned" as const, displays: [...displays] };
  if (skinId != null) {
    const skin = getProfileSkin(skinId);
    if (!isActiveProfileSkin(skin) || skin.monkeyId !== characterId) return { result: "invalid-skin" as const, displays: [...displays] };
    if (!ownedMonkeys.includes(skin.monkeyId)) return { result: "parent-monkey-required" as const, displays: [...displays] };
    if (!ownedSkins.includes(skinId)) return { result: "skin-not-owned" as const, displays: [...displays] };
  }
  return {
    result: "placed" as const,
    displays: displays.map((display) => display.characterId === characterId
      ? { ...display, selectedSkinId: skinId, displayPosition: definition.displayPosition }
      : display)
  };
}

export function setRoyalCharacterVisibility(
  displays: readonly RoyalCharacterDisplay[],
  characterId: ProfileMonkeyId,
  visible: boolean,
  palaceLevel: number,
  ownedMonkeys: readonly ProfileMonkeyId[]
) {
  const definition = royalPalaceCharacter(characterId);
  if (!definition) return { result: "invalid-slot" as const, displays: [...displays] };
  if (visible && palaceLevel < definition.palaceUnlockLevel) return { result: "slot-locked" as const, displays: [...displays] };
  if (visible && !ownedMonkeys.includes(characterId)) return { result: "monkey-not-owned" as const, displays: [...displays] };
  return {
    result: "placed" as const,
    displays: displays.map((display) => display.characterId === characterId
      ? { ...display, isVisible: visible, displayPosition: definition.displayPosition }
      : display)
  };
}

export function revealNewRoyalCharacters(
  displays: readonly RoyalCharacterDisplay[],
  previousLevel: number,
  nextLevel: number,
  ownedMonkeys: readonly ProfileMonkeyId[]
) {
  return displays.map((display) => {
    const definition = royalPalaceCharacter(display.characterId);
    return definition &&
      definition.palaceUnlockLevel > previousLevel &&
      definition.palaceUnlockLevel <= nextLevel &&
      ownedMonkeys.includes(display.characterId)
      ? { ...display, isVisible: true, displayPosition: definition.displayPosition }
      : display;
  });
}

/** Legacy placement API retained for migration tests and old snapshots only. */
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
  if (!ownedMonkeys.includes(monkeyId)) return skinId == null ? "monkey-not-owned" : "parent-monkey-required";
  if (skinId == null) return "placed";
  const skin = getProfileSkin(skinId);
  if (!isActiveProfileSkin(skin) || skin.monkeyId !== monkeyId) return "invalid-skin";
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
  const result = validateRoyalPalacePlacement(assignments, assignment.slotId, assignment.equippedMonkeyId, assignment.equippedSkinId, palaceLevel, ownedMonkeys, ownedSkins);
  return result === "placed"
    ? { result, assignments: [...assignments.filter((entry) => entry.slotId !== assignment.slotId), assignment] }
    : { result, assignments: [...assignments] };
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

export function royalPrestige(level: number, displays: readonly RoyalCharacterDisplay[]) {
  return Math.max(0, Math.min(ROYAL_PALACE_MAX_LEVEL, Math.floor(level))) * 200 + displays.reduce((total, display) => {
    if (!display.isVisible) return total;
    const skin = display.selectedSkinId ? getProfileSkin(display.selectedSkinId) : null;
    return total + 25 + (skin?.catalogStatus === "festival" ? FESTIVAL_PRESTIGE[skin.rarity] : 0);
  }, 0);
}

export type RoyalPalaceUpgradeBlock = "max-level" | "upgrade-active" | "clan-level" | "resource" | null;

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
    gems: args.gems,
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

export function evaluateRoyalPalaceRush(activeUpgrade: WorkerLodgeUpgrade | null, gems: number) {
  if (!activeUpgrade || activeUpgrade.buildingType !== "royalPalace") return { enabled: false, cost: 0, block: "no-upgrade" as const };
  const definition = ROYAL_PALACE_UPGRADES.find((entry) => entry.targetLevel === activeUpgrade.targetLevel);
  if (!definition) return { enabled: false, cost: 0, block: "invalid-upgrade" as const };
  if (gems < definition.gemCost) return { enabled: false, cost: definition.gemCost, block: "gems" as const };
  return { enabled: true, cost: definition.gemCost, block: null };
}

export function resolveRoyalPalaceRush(
  activeUpgrade: WorkerLodgeUpgrade | null,
  gems: number,
  now: number
) {
  const eligibility = evaluateRoyalPalaceRush(activeUpgrade, gems);
  if (!eligibility.enabled || !activeUpgrade) {
    return {
      result: eligibility.block ?? "invalid-upgrade" as NonNullable<typeof eligibility.block>,
      cost: eligibility.cost,
      gems,
      activeUpgrade
    };
  }
  return {
    result: "rushed" as const,
    cost: eligibility.cost,
    gems: gems - eligibility.cost,
    activeUpgrade: { ...activeUpgrade, endsAt: now }
  };
}

export function palaceMonkeysForClass(palaceClass: RoyalPalaceClass) {
  return PROFILE_MONKEYS.filter((monkey) => royalPalaceClassForMonkey(monkey.id) === palaceClass);
}
