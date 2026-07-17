import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDINGS, storageCap } from "./buildings";
import {
  BEACH_WARRIOR_SKIN_ID,
  FESTIVAL_WORKER_SKIN_ID,
  getDefaultSkinId
} from "./profileMonkeys";
import {
  ROYAL_PALACE_SLOTS,
  ROYAL_PALACE_UPGRADES,
  placeRoyalPalaceResident,
  royalPrestige,
  sanitizeRoyalPalaceSlots,
  startRoyalPalaceUpgrade,
  validateRoyalPalacePlacement
} from "./royalPalace";
import type { RoyalPalaceSlotAssignment } from "../types/game";

const MONKEYS = [
  "profile_monkey_worker",
  "profile_monkey_scout",
  "profile_monkey_warrior",
  "profile_monkey_hunter",
  "profile_monkey_chief",
  "profile_monkey_king"
];

describe("Royal Palace slots", () => {
  it("migrates old saves to an unbuilt level 0 palace with no automatic residents", () => {
    expect(DEFAULT_BUILDINGS.find((building) => building.type === "royalPalace")?.level).toBe(0);
    expect(sanitizeRoyalPalaceSlots(undefined, 0, MONKEYS, [])).toEqual([]);
  });

  it.each(ROYAL_PALACE_SLOTS)("unlocks $allowedClass only at palace level $requiredPalaceLevel", (slot) => {
    const monkeyId = `profile_monkey_${slot.allowedClass}`;
    expect(validateRoyalPalacePlacement([], slot.slotId, monkeyId, null, slot.requiredPalaceLevel - 1, MONKEYS, [])).toBe("slot-locked");
    expect(validateRoyalPalacePlacement([], slot.slotId, monkeyId, null, slot.requiredPalaceLevel, MONKEYS, [])).toBe("placed");
  });

  it("rejects wrong classes and unowned characters", () => {
    expect(validateRoyalPalacePlacement([], "palaceGarden", "profile_monkey_scout", null, 6, MONKEYS, [])).toBe("wrong-class");
    expect(validateRoyalPalacePlacement([], "palaceGarden", "profile_monkey_worker", null, 6, [], [])).toBe("monkey-not-owned");
  });

  it("rejects unowned skins and reports a missing parent character", () => {
    expect(validateRoyalPalacePlacement([], "palaceGarden", "profile_monkey_worker", FESTIVAL_WORKER_SKIN_ID, 6, ["profile_monkey_worker"], [])).toBe("skin-not-owned");
    expect(validateRoyalPalacePlacement([], "palaceGarden", "profile_monkey_worker", FESTIVAL_WORKER_SKIN_ID, 6, [], [FESTIVAL_WORKER_SKIN_ID])).toBe("parent-monkey-required");
  });

  it("prevents the same monkey from being used in more than one slot", () => {
    const corrupted: RoyalPalaceSlotAssignment[] = [{ slotId: "scoutPath", equippedMonkeyId: "profile_monkey_worker", equippedSkinId: null }];
    expect(validateRoyalPalacePlacement(corrupted, "palaceGarden", "profile_monkey_worker", null, 6, MONKEYS, [])).toBe("duplicate-monkey");
  });

  it("supports default and owned Festival appearances without changing profile equip state", () => {
    const equippedProfileMonkey = "profile_monkey_chief";
    const defaultPlacement = placeRoyalPalaceResident([], {
      slotId: "palaceGarden",
      equippedMonkeyId: "profile_monkey_worker",
      equippedSkinId: null
    }, 1, MONKEYS, []);
    expect(defaultPlacement.result).toBe("placed");
    const festivalPlacement = placeRoyalPalaceResident([], {
      slotId: "palaceGarden",
      equippedMonkeyId: "profile_monkey_worker",
      equippedSkinId: FESTIVAL_WORKER_SKIN_ID
    }, 1, MONKEYS, [FESTIVAL_WORKER_SKIN_ID]);
    expect(festivalPlacement.result).toBe("placed");
    const savedAndReloaded = JSON.parse(JSON.stringify(festivalPlacement.assignments));
    expect(sanitizeRoyalPalaceSlots(savedAndReloaded, 1, MONKEYS, [FESTIVAL_WORKER_SKIN_ID])).toEqual(festivalPlacement.assignments);
    expect(equippedProfileMonkey).toBe("profile_monkey_chief");
  });

  it("allows Monkey King only in the level 6 throne slot", () => {
    expect(validateRoyalPalacePlacement([], "goldenThrone", "profile_monkey_king", null, 5, MONKEYS, [])).toBe("slot-locked");
    expect(validateRoyalPalacePlacement([], "palaceGarden", "profile_monkey_king", null, 6, MONKEYS, [])).toBe("wrong-class");
    expect(validateRoyalPalacePlacement([], "goldenThrone", "profile_monkey_king", null, 6, MONKEYS, [])).toBe("placed");
  });

  it("sanitizes invalid, unowned and duplicate persisted assignments", () => {
    const saved = [
      { slotId: "palaceGarden", equippedMonkeyId: "profile_monkey_worker", equippedSkinId: null },
      { slotId: "scoutPath", equippedMonkeyId: "profile_monkey_worker", equippedSkinId: null },
      { slotId: "goldenThrone", equippedMonkeyId: "profile_monkey_king", equippedSkinId: "missing" },
      { slotId: "guardGate", equippedMonkeyId: "profile_monkey_warrior", equippedSkinId: null }
    ];
    expect(sanitizeRoyalPalaceSlots(saved, 3, MONKEYS, [])).toEqual([
      { slotId: "palaceGarden", equippedMonkeyId: "profile_monkey_worker", equippedSkinId: null },
      { slotId: "guardGate", equippedMonkeyId: "profile_monkey_warrior", equippedSkinId: null }
    ]);
  });

  it("calculates level, resident and Festival rarity prestige", () => {
    const assignments: RoyalPalaceSlotAssignment[] = [
      { slotId: "palaceGarden", equippedMonkeyId: "profile_monkey_worker", equippedSkinId: null },
      { slotId: "scoutPath", equippedMonkeyId: "profile_monkey_scout", equippedSkinId: null },
      { slotId: "guardGate", equippedMonkeyId: "profile_monkey_warrior", equippedSkinId: BEACH_WARRIOR_SKIN_ID }
    ];
    expect(royalPrestige(3, assignments)).toBe(410);
  });
});

describe("Royal Palace upgrades", () => {
  it("keeps all configured costs payable within the required Clan Hall capacity", () => {
    for (const upgrade of ROYAL_PALACE_UPGRADES) {
      const cap = storageCap(upgrade.requiredClanHallLevel);
      expect(Math.max(upgrade.cost.bananas, upgrade.cost.stones, upgrade.cost.wood)).toBeLessThanOrEqual(cap);
    }
    expect(ROYAL_PALACE_UPGRADES[4]?.cost.bananas).toBe(3_200);
    expect(ROYAL_PALACE_UPGRADES[5]?.cost.bananas).toBe(4_000);
  });

  it("deducts the exact level 2 cost and Gem charge only when starting succeeds", () => {
    const started = startRoyalPalaceUpgrade({
      palaceLevel: 1,
      clanLevel: 4,
      resources: { bananas: 1_000, stones: 600, wood: 700 },
      gems: 20,
      activeUpgrade: null,
      now: 100
    });
    expect(started.result).toBe("started");
    expect(started.resources).toEqual({ bananas: 100, stones: 100, wood: 50 });
    expect(started.gems).toBe(5);
    expect(started.activeUpgrade).toMatchObject({ buildingType: "royalPalace", fromLevel: 1, targetLevel: 2 });
  });

  it("does not deduct resources or Gems for resource, Gem, Clan Hall, or active-upgrade failures", () => {
    const resources = { bananas: 5_000, stones: 5_000, wood: 5_000 };
    const base = { palaceLevel: 1, resources, gems: 100, activeUpgrade: null, now: 100 };
    const clanFailure = startRoyalPalaceUpgrade({ ...base, clanLevel: 3 });
    const resourceFailure = startRoyalPalaceUpgrade({ ...base, clanLevel: 4, resources: { bananas: 0, stones: 0, wood: 0 } });
    const gemFailure = startRoyalPalaceUpgrade({ ...base, clanLevel: 4, gems: 0 });
    const activeFailure = startRoyalPalaceUpgrade({ ...base, clanLevel: 4, activeUpgrade: {
      buildingType: "workerShelter",
      fromLevel: 1,
      targetLevel: 2,
      startedAt: 0,
      endsAt: 1_000,
      cost: { bananas: 1, stones: 1, wood: 1 },
      requiredClanHallLevel: 1
    } });
    expect([clanFailure.result, resourceFailure.result, gemFailure.result, activeFailure.result]).toEqual(["clan-level", "resource", "gems", "upgrade-active"]);
    expect(clanFailure.resources).toBe(resources);
    expect(clanFailure.gems).toBe(100);
    expect(gemFailure.gems).toBe(0);
  });

  it("uses the canonical default skin id without persisting it in default placements", () => {
    expect(getDefaultSkinId("profile_monkey_worker")).toBe("skin_worker_default");
  });
});
