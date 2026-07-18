import { describe, expect, it } from "vitest";
import { storageCap } from "./buildings";
import {
  BEACH_WARRIOR_SKIN_ID,
  FESTIVAL_WORKER_SKIN_ID,
  getDefaultSkinId
} from "./profileMonkeys";
import {
  ROYAL_PALACE_CHARACTERS,
  ROYAL_PALACE_SAVE_VERSION,
  ROYAL_PALACE_UPGRADES,
  evaluateRoyalPalaceRush,
  migrateRoyalPalaceActiveUpgrade,
  migrateRoyalPalaceLevel,
  royalPrestige,
  resolveRoyalPalaceRush,
  sanitizeRoyalCharacterDisplays,
  selectRoyalCharacterSkin,
  setRoyalCharacterVisibility,
  startRoyalPalaceUpgrade
} from "./royalPalace";
import type { ProfileMonkeyId, ProfileSkinId, RoyalCharacterDisplay, WorkerLodgeUpgrade } from "../types/game";

const MONKEYS: ProfileMonkeyId[] = [
  "profile_monkey_worker",
  "profile_monkey_scout",
  "profile_monkey_warrior",
  "profile_monkey_hunter",
  "profile_monkey_chief",
  "profile_monkey_king"
];
const OWNED_SKINS: ProfileSkinId[] = [
  ...MONKEYS.map(getDefaultSkinId),
  FESTIVAL_WORKER_SKIN_ID,
  BEACH_WARRIOR_SKIN_ID
];

function displays(level = 3) {
  return sanitizeRoyalCharacterDisplays({
    value: undefined,
    palaceLevel: level,
    ownedMonkeys: MONKEYS,
    ownedSkins: OWNED_SKINS
  });
}

describe("Royal Palace three-level migration", () => {
  it.each([
    [0, 0], [1, 1], [2, 1], [3, 2], [4, 2], [5, 2], [6, 3]
  ])("migrates legacy level %i to level %i", (legacy, expected) => {
    expect(migrateRoyalPalaceLevel(legacy)).toBe(expected);
  });

  it("does not remap a save already marked with the current version", () => {
    expect(migrateRoyalPalaceLevel(2, ROYAL_PALACE_SAVE_VERSION)).toBe(2);
    expect(migrateRoyalPalaceLevel(8, ROYAL_PALACE_SAVE_VERSION)).toBe(3);
  });

  it("keeps a paid legacy upgrade on the shared timer", () => {
    const legacy: WorkerLodgeUpgrade = {
      buildingType: "royalPalace",
      fromLevel: 1,
      targetLevel: 2,
      startedAt: 100,
      endsAt: 1_000,
      cost: { bananas: 500, wood: 300, stones: 250 },
      requiredClanHallLevel: 3
    };
    expect(migrateRoyalPalaceActiveUpgrade(legacy)).toMatchObject({
      fromLevel: 1,
      targetLevel: 2,
      startedAt: 100,
      endsAt: 1_000
    });
  });

  it("migrates legacy slots and the Profile-selected skin without duplicates", () => {
    const migrated = sanitizeRoyalCharacterDisplays({
      value: undefined,
      legacySlots: [
        { slotId: "palaceGarden", equippedMonkeyId: "profile_monkey_worker", equippedSkinId: FESTIVAL_WORKER_SKIN_ID },
        { slotId: "scoutPath", equippedMonkeyId: "profile_monkey_worker", equippedSkinId: null }
      ],
      palaceLevel: 3,
      ownedMonkeys: MONKEYS,
      ownedSkins: OWNED_SKINS,
      legacyEquippedMonkey: "profile_monkey_warrior",
      legacyEquippedSkin: BEACH_WARRIOR_SKIN_ID
    });
    expect(migrated).toHaveLength(6);
    expect(new Set(migrated.map((entry) => entry.characterId)).size).toBe(6);
    expect(migrated.find((entry) => entry.characterId === "profile_monkey_worker")?.selectedSkinId).toBe(FESTIVAL_WORKER_SKIN_ID);
    expect(migrated.find((entry) => entry.characterId === "profile_monkey_warrior")?.selectedSkinId).toBe(BEACH_WARRIOR_SKIN_ID);
  });

  it("falls back to the default appearance for an invalid saved skin", () => {
    const migrated = sanitizeRoyalCharacterDisplays({
      value: [{ characterId: "profile_monkey_worker", selectedSkinId: "missing", isVisible: true, displayPosition: "palaceGarden" }],
      palaceLevel: 1,
      ownedMonkeys: ["profile_monkey_worker"],
      ownedSkins: [getDefaultSkinId("profile_monkey_worker")]
    });
    expect(migrated.find((entry) => entry.characterId === "profile_monkey_worker")?.selectedSkinId).toBeNull();
  });
});

describe("Royal Palace character center", () => {
  it("unlocks Worker, Scout and Warrior at 1; Hunter and Chief at 2; King at 3", () => {
    expect(ROYAL_PALACE_CHARACTERS.map((entry) => [entry.palaceClass, entry.palaceUnlockLevel])).toEqual([
      ["worker", 1], ["scout", 1], ["warrior", 1],
      ["hunter", 2], ["chief", 2], ["king", 3]
    ]);
    expect(displays(1).filter((entry) => entry.isVisible).map((entry) => entry.characterId)).toEqual(MONKEYS.slice(0, 3));
    expect(displays(2).filter((entry) => entry.isVisible).map((entry) => entry.characterId)).toEqual(MONKEYS.slice(0, 5));
    expect(displays(3).filter((entry) => entry.isVisible).map((entry) => entry.characterId)).toEqual(MONKEYS);
  });

  it("keeps Monkey King fixed to the level 3 throne", () => {
    const king = ROYAL_PALACE_CHARACTERS.find((entry) => entry.palaceClass === "king");
    expect(king).toMatchObject({ palaceUnlockLevel: 3, displayPosition: "goldenThrone" });
    expect(setRoyalCharacterVisibility(displays(2), "profile_monkey_king", true, 2, MONKEYS).result).toBe("slot-locked");
    expect(setRoyalCharacterVisibility(displays(3), "profile_monkey_king", true, 3, MONKEYS).result).toBe("placed");
  });

  it("selects default and owned skins, but rejects unowned and parentless skins", () => {
    const initial = displays(3);
    expect(selectRoyalCharacterSkin(initial, "profile_monkey_worker", null, 3, MONKEYS, OWNED_SKINS).result).toBe("placed");
    expect(selectRoyalCharacterSkin(initial, "profile_monkey_worker", FESTIVAL_WORKER_SKIN_ID, 3, MONKEYS, OWNED_SKINS).result).toBe("placed");
    expect(selectRoyalCharacterSkin(initial, "profile_monkey_worker", FESTIVAL_WORKER_SKIN_ID, 3, MONKEYS, []).result).toBe("skin-not-owned");
    expect(selectRoyalCharacterSkin(initial, "profile_monkey_worker", FESTIVAL_WORKER_SKIN_ID, 3, [], [FESTIVAL_WORKER_SKIN_ID]).result).toBe("parent-monkey-required");
  });

  it("persists skin selection and visibility through sanitization", () => {
    const selected = selectRoyalCharacterSkin(displays(3), "profile_monkey_worker", FESTIVAL_WORKER_SKIN_ID, 3, MONKEYS, OWNED_SKINS);
    const hidden = setRoyalCharacterVisibility(selected.displays, "profile_monkey_worker", false, 3, MONKEYS);
    const reloaded = sanitizeRoyalCharacterDisplays({
      value: JSON.parse(JSON.stringify(hidden.displays)),
      palaceLevel: 3,
      ownedMonkeys: MONKEYS,
      ownedSkins: OWNED_SKINS
    });
    expect(reloaded.find((entry) => entry.characterId === "profile_monkey_worker")).toMatchObject({
      selectedSkinId: FESTIVAL_WORKER_SKIN_ID,
      isVisible: false,
      displayPosition: "palaceGarden"
    });
  });

  it("calculates 200 per level, 25 per visible character and Festival rarity", () => {
    const value: RoyalCharacterDisplay[] = [
      { characterId: "profile_monkey_worker", selectedSkinId: null, isVisible: true, displayPosition: "palaceGarden" },
      { characterId: "profile_monkey_scout", selectedSkinId: null, isVisible: false, displayPosition: "scoutPath" },
      { characterId: "profile_monkey_warrior", selectedSkinId: BEACH_WARRIOR_SKIN_ID, isVisible: true, displayPosition: "guardGate" }
    ];
    expect(royalPrestige(2, value)).toBe(485);
  });
});

describe("Royal Palace upgrades and rush", () => {
  it("uses the requested costs, durations and fixed rush prices", () => {
    expect(ROYAL_PALACE_UPGRADES.map((entry) => ({
      target: entry.targetLevel,
      cost: entry.cost,
      duration: entry.durationMs,
      rush: entry.gemCost
    }))).toEqual([
      { target: 1, cost: { bananas: 250, wood: 250, stones: 250 }, duration: 30 * 60_000, rush: 5 },
      { target: 2, cost: { bananas: 750, wood: 750, stones: 750 }, duration: 60 * 60_000, rush: 10 },
      { target: 3, cost: { bananas: 1_500, wood: 1_500, stones: 1_500 }, duration: 2 * 60 * 60_000, rush: 20 }
    ]);
  });

  it("keeps every upgrade payable within its Clan Hall capacity", () => {
    for (const upgrade of ROYAL_PALACE_UPGRADES) {
      const cap = storageCap(upgrade.requiredClanHallLevel);
      expect(Math.max(upgrade.cost.bananas, upgrade.cost.stones, upgrade.cost.wood)).toBeLessThanOrEqual(cap);
    }
  });

  it("deducts resources only after a successful start and does not charge rush Gems early", () => {
    const started = startRoyalPalaceUpgrade({
      palaceLevel: 1,
      clanLevel: 4,
      resources: { bananas: 1_000, stones: 1_000, wood: 1_000 },
      gems: 20,
      activeUpgrade: null,
      now: 100
    });
    expect(started.result).toBe("started");
    expect(started.resources).toEqual({ bananas: 250, stones: 250, wood: 250 });
    expect(started.gems).toBe(20);
    expect(started.activeUpgrade).toMatchObject({ fromLevel: 1, targetLevel: 2, endsAt: 100 + 60 * 60_000 });

    const resources = { bananas: 0, stones: 0, wood: 0 };
    const failed = startRoyalPalaceUpgrade({ palaceLevel: 1, clanLevel: 4, resources, gems: 20, activeUpgrade: null, now: 100 });
    expect(failed.result).toBe("resource");
    expect(failed.resources).toBe(resources);
    expect(failed.gems).toBe(20);
  });

  it("enables rush at the exact price and blocks it without deducting Gems", () => {
    const active: WorkerLodgeUpgrade = {
      buildingType: "royalPalace",
      fromLevel: 1,
      targetLevel: 2,
      startedAt: 0,
      endsAt: 3_600_000,
      cost: { bananas: 750, wood: 750, stones: 750 },
      requiredClanHallLevel: 4
    };
    expect(evaluateRoyalPalaceRush(active, 10)).toEqual({ enabled: true, cost: 10, block: null });
    expect(evaluateRoyalPalaceRush(active, 9)).toEqual({ enabled: false, cost: 10, block: "gems" });
    expect(evaluateRoyalPalaceRush(null, 100)).toEqual({ enabled: false, cost: 0, block: "no-upgrade" });
    expect(resolveRoyalPalaceRush(active, 10, 500)).toMatchObject({ result: "rushed", gems: 0, activeUpgrade: { endsAt: 500 } });
    expect(resolveRoyalPalaceRush(active, 9, 500)).toMatchObject({ result: "gems", gems: 9, activeUpgrade: active });
  });
});
