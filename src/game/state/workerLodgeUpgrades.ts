import type {
  Resources,
  VillageBuilding,
  WorkerLodgeUpgrade
} from "../types/game";
import { WORKER_LODGE_UPGRADES } from "../config/buildings";

function safeLevel(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 1
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
  currentLevel: number
): WorkerLodgeUpgrade | null {
  if (!value || typeof value !== "object") return null;
  const fromLevel = safeLevel(value.fromLevel);
  const targetLevel = safeLevel(value.targetLevel);
  const startedAt = safeTimestamp(value.startedAt);
  const endsAt = safeTimestamp(value.endsAt);
  const requiredClanHallLevel = safeLevel(value.requiredClanHallLevel);
  const cost = safeResources(value.cost);
  const definition = WORKER_LODGE_UPGRADES.find(
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
    building.type === "workerShelter" && building.level < activeUpgrade.targetLevel
      ? { ...building, level: activeUpgrade.targetLevel }
      : building
  );
  return {
    buildings: buildingsAfterUpgrade,
    activeUpgrade: null,
    completed: true
  };
}
