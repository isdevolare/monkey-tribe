import { describe, expect, it } from "vitest";
import { createUnit } from "../config/map";
import { summarizeRaidArmy, troopHousing } from "../config/troops";
import type { TroopType, Unit } from "../types/game";
import {
  bestRaidArmySelection,
  livingVillageRosterAfterRaid,
  raidSelectionStats,
  selectedRaidUnits
} from "./raidArmy";

function troop(id: string, type: TroopType, powerBoost = 0): Unit {
  const unit = createUnit(id, type, "player", 0, 0, 1);
  return { ...unit, attack: unit.attack + powerBoost, power: unit.power + powerBoost };
}

describe("raid army selection", () => {
  it("never selects beyond ownership or housing capacity", () => {
    const units = [
      troop("f1", "fighter"),
      troop("f2", "fighter"),
      troop("g1", "shield_guardian"),
      troop("a1", "archer"),
      troop("c1", "crossbowman", 30)
    ];
    const selection = bestRaidArmySelection(units, 3);
    const selected = selectedRaidUnits(units, selection);

    expect(selected.reduce((sum, unit) => sum + troopHousing(unit.type), 0)).toBeLessThanOrEqual(3);
    expect(new Set(selected.map((unit) => unit.id)).size).toBe(selected.length);
    expect(raidSelectionStats(units, selection).housing).toBeLessThanOrEqual(3);
  });

  it("keeps unselected soldiers safe when a selected raid party retreats with losses", () => {
    const selectedSurvivor = troop("f1", "fighter");
    const selectedLoss = { ...troop("a1", "archer"), hp: 0, state: "dead" as const };
    const unselected = troop("g1", "shield_guardian");
    const units = [selectedSurvivor, selectedLoss, unselected];

    expect(summarizeRaidArmy(units, ["f1", "a1"])).toMatchObject({
      deployed: 2,
      survivors: 1,
      losses: 1
    });
    expect(livingVillageRosterAfterRaid(units).map((unit) => unit.id).sort()).toEqual([
      "f1",
      "g1"
    ]);
  });

  it("preserves the unselected village roster after a full selected-party defeat", () => {
    const defeatedFighter = { ...troop("f1", "fighter"), hp: 0, state: "dead" as const };
    const defeatedArcher = { ...troop("a1", "archer"), hp: 0, state: "dead" as const };
    const unselected = troop("g1", "shield_guardian");
    const units = [defeatedFighter, defeatedArcher, unselected];

    expect(summarizeRaidArmy(units, ["f1", "a1"])).toMatchObject({
      deployed: 2,
      survivors: 0,
      losses: 2
    });
    expect(livingVillageRosterAfterRaid(units).map((unit) => unit.id)).toEqual(["g1"]);
  });
});
