import type {
  Resources,
  VillageBuilding,
  WorkerLodgeUpgrade
} from "../types/game";
import {
  WORKER_LODGE_UPGRADES,
  storageCanHoldCost,
  storageCap,
  workerLodgeUpgrade
} from "../config/buildings";
import { ROYAL_PALACE_UPGRADES } from "../config/royalPalace";
import type { ResourceKind } from "../types/game";

export type WorkerLodgeUpgradeBlock =
  | { reason: "max-level" }
  | { reason: "upgrade-active" }
  | { reason: "clan-level"; requiredLevel: number }
  | { reason: "storage"; capacity: number }
  | { reason: "resource"; resource: ResourceKind; missing: number }
  | null;

/** One source of truth for both the Lodge UI and the store mutation guard. */
export function evaluateWorkerLodgeUpgrade({
  lodgeLevel,
  clanLevel,
  resources,
  activeUpgrade
}: {
  lodgeLevel: number;
  clanLevel: number;
  resources: Resources;
  activeUpgrade: WorkerLodgeUpgrade | null;
}) {
  const definition = workerLodgeUpgrade(lodgeLevel);
  let block: WorkerLodgeUpgradeBlock = null;
  if (!definition) block = { reason: "max-level" };
  else if (activeUpgrade) block = { reason: "upgrade-active" };
  else if (clanLevel < definition.requiredClanHallLevel) {
    block = { reason: "clan-level", requiredLevel: definition.requiredClanHallLevel };
  } else {
    const capacity = storageCap(clanLevel);
    if (!storageCanHoldCost(capacity, definition.cost)) {
      block = { reason: "storage", capacity };
    } else {
      const missing = (["bananas", "stones", "wood"] as const)
        .map((resource) => ({
          resource,
          missing: Math.max(0, definition.cost[resource] - resources[resource])
        }))
        .find((entry) => entry.missing > 0);
      if (missing) block = { reason: "resource", ...missing };
    }
  }
  return { definition, block, enabled: definition != null && block == null };
}

function safeLevel(value: unknown, allowZero = false) {
  return typeof value === "number" && Number.isInteger(value) && value >= (allowZero ? 0 : 1)
    ? value
    : null;
}

function safeTimestamp(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function safeResources(value: unknown): Resources | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Resources>;
  if (
    typeof source.bananas !== "number" || !Number.isFinite(source.bananas) || source.bananas < 0 ||
    typeof source.stones !== "number" || !Number.isFinite(source.stones) || source.stones < 0 ||
    typeof source.wood !== "number" || !Number.isFinite(source.wood) || source.wood < 0
  ) {
    return null;
  }
  return {
    bananas: Math.round(source.bananas),
    stones: Math.round(source.stones),
    wood: Math.round(source.wood)
  };
}

export function sanitizeWorkerLodgeUpgrade(
  value: WorkerLodgeUpgrade | null | undefined,
  currentLevelOrBuildings: number | VillageBuilding[]
): WorkerLodgeUpgrade | null {
  if (!value || typeof value !== "object") return null;
  const buildingType = value.buildingType === "royalPalace" ? "royalPalace" : "workerShelter";
  const currentLevel = typeof currentLevelOrBuildings === "number"
    ? currentLevelOrBuildings
    : currentLevelOrBuildings.find((building) => building.type === buildingType)?.level ?? 0;
  const fromLevel = safeLevel(value.fromLevel, buildingType === "royalPalace");
  const targetLevel = safeLevel(value.targetLevel);
  const startedAt = safeTimestamp(value.startedAt);
  const endsAt = safeTimestamp(value.endsAt);
  const requiredClanHallLevel = safeLevel(value.requiredClanHallLevel);
  const cost = safeResources(value.cost);
  const definitions = buildingType === "royalPalace" ? ROYAL_PALACE_UPGRADES : WORKER_LODGE_UPGRADES;
  const definition = definitions.find(
    (entry) => entry.targetLevel === targetLevel
  );
  if (
    fromLevel == null ||
    targetLevel == null ||
    targetLevel !== fromLevel + 1 ||
    currentLevel !== fromLevel ||
    startedAt == null ||
    endsAt == null ||
    endsAt < startedAt ||
    requiredClanHallLevel == null ||
    !cost ||
    !definition
  ) {
    return null;
  }
  // Persisted values are snapshots: balancing changes must not alter an
  // upgrade that was already paid for and started.
  return {
    buildingType,
    fromLevel,
    targetLevel,
    startedAt,
    endsAt,
    cost,
    requiredClanHallLevel
  };
}

export function reconcileWorkerLodgeUpgrade(
  buildings: VillageBuilding[],
  activeUpgrade: WorkerLodgeUpgrade | null,
  now: number
) {
  if (!activeUpgrade || !Number.isFinite(now) || now < activeUpgrade.endsAt) {
    return { buildings, activeUpgrade, completed: false };
  }
  const buildingsAfterUpgrade = buildings.map((building) =>
    building.type === (activeUpgrade.buildingType ?? "workerShelter") && building.level < activeUpgrade.targetLevel
      ? { ...building, level: activeUpgrade.targetLevel }
      : building
  );
  return {
    buildings: buildingsAfterUpgrade,
    activeUpgrade: null,
    completed: true,
    completedBuildingType: activeUpgrade.buildingType ?? "workerShelter"
  };
}
