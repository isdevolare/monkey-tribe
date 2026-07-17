import {
  TROOPS,
  TROOP_TYPES,
  calculateTroopPower,
  isLivingPlayerTroop,
  troopHousing
} from "../config/troops";
import type { RaidArmySelection, TroopType, Unit } from "../types/game";

export type RaidSelectionStats = {
  count: number;
  housing: number;
  power: number;
  currentHp: number;
  maxHp: number;
};

export type RaidRiskBand = "safe" | "balanced" | "risky" | "veryRisky";

export function emptyRaidArmySelection(): RaidArmySelection {
  return { fighter: 0, shield_guardian: 0, archer: 0, crossbowman: 0 };
}

function unitSelectionPower(unit: Unit & { type: TroopType }) {
  return calculateTroopPower(unit.type, unit);
}

/** Picks the healthiest/highest-power actual units behind a type-count selection. */
export function selectedRaidUnits(units: Unit[], selection: RaidArmySelection) {
  const selected: Array<Unit & { type: TroopType }> = [];
  for (const type of TROOP_TYPES) {
    const wanted = Math.max(0, Math.floor(selection[type] ?? 0));
    const candidates = units
      .filter(
        (unit): unit is Unit & { type: TroopType } =>
          isLivingPlayerTroop(unit) && unit.type === type
      )
      .sort(
        (left, right) =>
          unitSelectionPower(right) - unitSelectionPower(left) ||
          right.hp / right.maxHp - left.hp / left.maxHp ||
          left.id.localeCompare(right.id)
      );
    selected.push(...candidates.slice(0, wanted));
  }
  return selected;
}

export function raidSelectionStats(
  units: Unit[],
  selection: RaidArmySelection
): RaidSelectionStats {
  return selectedRaidUnits(units, selection).reduce<RaidSelectionStats>(
    (stats, unit) => ({
      count: stats.count + 1,
      housing: stats.housing + troopHousing(unit.type),
      power: stats.power + unitSelectionPower(unit),
      currentHp: stats.currentHp + unit.hp,
      maxHp: stats.maxHp + unit.maxHp
    }),
    { count: 0, housing: 0, power: 0, currentHp: 0, maxHp: 0 }
  );
}

/** Exact 0/1 knapsack: maximize real roster power within housing capacity. */
export function bestRaidArmySelection(units: Unit[], capacity: number): RaidArmySelection {
  const safeCapacity = Math.max(0, Math.floor(capacity));
  const candidates = units.filter(isLivingPlayerTroop);
  type Pick = { power: number; ids: string[] };
  const best: Array<Pick | undefined> = Array.from({ length: safeCapacity + 1 });
  best[0] = { power: 0, ids: [] };

  for (const unit of candidates) {
    const housing = troopHousing(unit.type);
    const power = unitSelectionPower(unit);
    for (let used = safeCapacity; used >= housing; used -= 1) {
      const previous = best[used - housing];
      if (!previous) continue;
      const candidate = { power: previous.power + power, ids: [...previous.ids, unit.id] };
      if (!best[used] || candidate.power > best[used]!.power) {
        best[used] = candidate;
      }
    }
  }

  const strongest = best.reduce<Pick>(
    (current, entry) => (entry && entry.power > current.power ? entry : current),
    { power: 0, ids: [] }
  );
  const selectedIds = new Set(strongest.ids);
  const selection = emptyRaidArmySelection();
  for (const unit of candidates) {
    if (selectedIds.has(unit.id)) selection[unit.type] += 1;
  }
  return selection;
}

export function raidRiskBand(power: number, recommendedPower: number): RaidRiskBand {
  const ratio = recommendedPower > 0 ? power / recommendedPower : 2;
  if (ratio >= 1.1) return "safe";
  if (ratio >= 0.9) return "balanced";
  if (ratio >= 0.65) return "risky";
  return "veryRisky";
}

export function estimatedRaidLossRange(
  selectedCount: number,
  power: number,
  recommendedPower: number
) {
  if (selectedCount <= 0) return { min: 0, max: 0 };
  const ratio = recommendedPower > 0 ? power / recommendedPower : 2;
  const percentages =
    ratio >= 1.35 ? [0, 0.1] :
    ratio >= 1.1 ? [0.05, 0.2] :
    ratio >= 0.9 ? [0.15, 0.35] :
    ratio >= 0.65 ? [0.3, 0.55] : [0.5, 0.8];
  return {
    min: Math.min(selectedCount, Math.floor(selectedCount * percentages[0]!)),
    max: Math.min(selectedCount, Math.max(1, Math.ceil(selectedCount * percentages[1]!)))
  };
}

/** Living player troops that return home; unselected troops are intentionally included. */
export function livingVillageRosterAfterRaid(units: Unit[]) {
  return units.filter(isLivingPlayerTroop);
}
