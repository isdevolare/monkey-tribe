import type {
  BananaWorkerClass,
  IdleWorker,
  LumberMissionTier,
  LumberWorkerClass,
  ResourceKind,
  Resources,
  StoneWorkerClass,
  WorkerClass,
  WorkerCountSelection,
  WorkerExpedition,
  WorkerExpeditionOutcome,
  WorkerExpeditionStatus,
  WorkerProductionItem,
  WorkerProductionStartResult
} from "../types/game";
import { productionLevelMultiplier } from "../config/buildings";

export type WorkerClassDefinition = {
  id: WorkerClass;
  cost: Resources;
  productionMs: number;
  expeditionMs: number;
  baseYield: number;
  unlockLodgeLevel?: number;
};

export const WORKER_CLASSES: Record<WorkerClass, WorkerClassDefinition> = {
  gatherer: {
    id: "gatherer",
    cost: { bananas: 10, stones: 0, wood: 0 },
    productionMs: 30_000,
    expeditionMs: 5 * 60_000,
    baseYield: 10
  },
  skilled: {
    id: "skilled",
    cost: { bananas: 25, stones: 0, wood: 0 },
    productionMs: 45_000,
    expeditionMs: 8 * 60_000,
    baseYield: 25
  },
  master: {
    id: "master",
    cost: { bananas: 50, stones: 0, wood: 0 },
    productionMs: 60_000,
    expeditionMs: 12 * 60_000,
    baseYield: 50
  },
  worker_lumber_apprentice: {
    id: "worker_lumber_apprentice",
    cost: { bananas: 0, stones: 0, wood: 10 },
    productionMs: 30_000,
    expeditionMs: 5 * 60_000,
    baseYield: 10,
    unlockLodgeLevel: 1
  },
  worker_lumber_skilled: {
    id: "worker_lumber_skilled",
    cost: { bananas: 0, stones: 0, wood: 25 },
    productionMs: 45_000,
    expeditionMs: 10 * 60_000,
    baseYield: 25,
    unlockLodgeLevel: 2
  },
  worker_lumber_master: {
    id: "worker_lumber_master",
    cost: { bananas: 0, stones: 0, wood: 50 },
    productionMs: 60_000,
    expeditionMs: 20 * 60_000,
    baseYield: 50,
    unlockLodgeLevel: 3
  },
  worker_stone_apprentice: {
    id: "worker_stone_apprentice",
    cost: { bananas: 0, stones: 10, wood: 0 },
    productionMs: 30_000,
    expeditionMs: 5 * 60_000,
    baseYield: 10,
    unlockLodgeLevel: 1
  },
  worker_stone_experienced: {
    id: "worker_stone_experienced",
    cost: { bananas: 0, stones: 25, wood: 0 },
    productionMs: 45_000,
    expeditionMs: 10 * 60_000,
    baseYield: 25,
    unlockLodgeLevel: 2
  },
  worker_stone_master: {
    id: "worker_stone_master",
    cost: { bananas: 0, stones: 50, wood: 0 },
    productionMs: 60_000,
    expeditionMs: 20 * 60_000,
    baseYield: 50,
    unlockLodgeLevel: 3
  }
};

export const WORKER_CLASS_ORDER: readonly BananaWorkerClass[] = [
  "gatherer",
  "skilled",
  "master"
];

export const LUMBER_WORKER_ORDER: readonly LumberWorkerClass[] = [
  "worker_lumber_apprentice",
  "worker_lumber_skilled",
  "worker_lumber_master"
];

export const STONE_WORKER_ORDER: readonly StoneWorkerClass[] = [
  "worker_stone_apprentice",
  "worker_stone_experienced",
  "worker_stone_master"
];

export const WORKER_MISSIONS: Record<LumberMissionTier, {
  id: LumberMissionTier;
  multiplier: number;
  durationMs: number;
  success: number;
  partial: number;
}> = {
  safe: { id: "safe", multiplier: 2, durationMs: 5 * 60_000, success: 0.96, partial: 0.03 },
  risky: { id: "risky", multiplier: 4, durationMs: 10 * 60_000, success: 0.82, partial: 0.12 },
  dangerous: { id: "dangerous", multiplier: 8, durationMs: 20 * 60_000, success: 0.62, partial: 0.23 }
};

// Existing Lumber UI name retained while both resources share this data.
export const LUMBER_MISSIONS = WORKER_MISSIONS;

export const LUMBER_MISSION_ORDER: readonly LumberMissionTier[] = ["safe", "risky", "dangerous"];

export const WORKER_RESOURCE_ORDER: readonly ResourceKind[] = [
  "bananas",
  "stones",
  "wood"
];

export const BANANA_GROVE_MAX_WORKERS = 3;
export const RESOURCE_WORKPLACE_MAX_WORKERS = 3;

export function isLumberWorkerClass(value: unknown): value is LumberWorkerClass {
  return LUMBER_WORKER_ORDER.includes(value as LumberWorkerClass);
}

export function isBananaWorkerClass(value: unknown): value is BananaWorkerClass {
  return WORKER_CLASS_ORDER.includes(value as BananaWorkerClass);
}

export function isStoneWorkerClass(value: unknown): value is StoneWorkerClass {
  return STONE_WORKER_ORDER.includes(value as StoneWorkerClass);
}

export function isLumberMissionTier(value: unknown): value is LumberMissionTier {
  return value === "safe" || value === "risky" || value === "dangerous";
}

export function bananaGroveCapacity(groveLevel: number) {
  const level = Number.isFinite(groveLevel) ? Math.max(1, Math.floor(groveLevel)) : 1;
  const fixed = [0, 100, 200, 350, 550, 800];
  if (level <= 5) return fixed[level] ?? 100;
  // Continues the increasing storage steps naturally: +300, +325, +350...
  const extraLevels = level - 5;
  return 800 + extraLevels * 275 + (extraLevels * (extraLevels + 1) * 25) / 2;
}

export function lumberCampCapacity(campLevel: number) {
  const level = Number.isFinite(campLevel) ? Math.max(1, Math.floor(campLevel)) : 1;
  const capacities = [0, 100, 200, 350, 550, 800, 1150, 1600, 2200, 3000, 4000];
  return capacities[Math.min(10, level)] ?? 100;
}

export function stoneQuarryCapacity(quarryLevel: number) {
  return lumberCampCapacity(quarryLevel);
}

export function sanitizeLumberCampStorage(value: unknown, capacity: number) {
  return sanitizeBananaGroveStorage(value, capacity);
}

export function sanitizeStoneQuarryStorage(value: unknown, capacity: number) {
  return sanitizeBananaGroveStorage(value, capacity);
}

export function sanitizeBananaGroveStorage(value: unknown, capacity: number) {
  return Math.min(
    capacity,
    Math.max(0, typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0)
  );
}

export function workerCapacity(lodgeLevel: number) {
  const level = Number.isFinite(lodgeLevel)
    ? Math.max(1, Math.floor(lodgeLevel))
    : 1;
  if (level === 1) return 3;
  if (level === 2) return 5;
  if (level === 3) return 8;
  if (level === 4) return 12;
  if (level === 5) return 15;
  return 20;
}

export function isWorkerClass(value: unknown): value is WorkerClass {
  return typeof value === "string" && value in WORKER_CLASSES;
}

export function isWorkerResource(value: unknown): value is ResourceKind {
  return WORKER_RESOURCE_ORDER.includes(value as ResourceKind);
}

function finiteTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function sanitizeWorkerProductionQueue(
  value: WorkerProductionItem[] | undefined,
  _now: number
) {
  const seen = new Set<string>();
  const sorted: WorkerProductionItem[] = [];
  for (const item of Array.isArray(value) ? value : []) {
    if (
      !item ||
      typeof item.id !== "string" ||
      typeof item.workerId !== "string" ||
      !isWorkerClass(item.workerClass) ||
      !finiteTimestamp(item.startedAt) ||
      !finiteTimestamp(item.finishesAt) ||
      item.finishesAt < item.startedAt ||
      seen.has(item.id)
    ) {
      continue;
    }
    seen.add(item.id);
    sorted.push({ ...item });
  }
  sorted.sort((a, b) => a.finishesAt - b.finishesAt);
  const normalized: WorkerProductionItem[] = [];
  for (const item of sorted) {
    const previous = normalized[normalized.length - 1];
    if (!previous || item.startedAt >= previous.finishesAt) {
      normalized.push(item);
      continue;
    }
    const duration = Math.max(0, item.finishesAt - item.startedAt);
    normalized.push({
      ...item,
      startedAt: previous.finishesAt,
      finishesAt: previous.finishesAt + duration
    });
  }
  return normalized;
}

export function sanitizeIdleWorkers(value: IdleWorker[] | undefined, now: number) {
  const seen = new Set<string>();
  const workers: IdleWorker[] = [];
  for (const worker of Array.isArray(value) ? value : []) {
    if (
      !worker ||
      typeof worker.id !== "string" ||
      !isWorkerClass(worker.workerClass) ||
      seen.has(worker.id)
    ) {
      continue;
    }
    seen.add(worker.id);
    workers.push({
      ...worker,
      producedAt: finiteTimestamp(worker.producedAt) ? worker.producedAt : now
    });
  }
  return workers;
}

export function sanitizeWorkerExpeditions(
  value: WorkerExpedition[] | undefined
) {
  const seen = new Set<string>();
  const expeditions: WorkerExpedition[] = [];
  for (const expedition of Array.isArray(value) ? value : []) {
    if (
      !expedition ||
      typeof expedition.id !== "string" ||
      typeof expedition.workerId !== "string" ||
      !isWorkerClass(expedition.workerClass) ||
      !isWorkerResource(expedition.resource) ||
      !finiteTimestamp(expedition.startedAt) ||
      !finiteTimestamp(expedition.returnsAt) ||
      expedition.returnsAt < expedition.startedAt ||
      !Number.isFinite(expedition.expectedReward) ||
      expedition.expectedReward < 0 ||
      !Number.isFinite(expedition.reward) ||
      expedition.reward < 0 ||
      !isWorkerOutcome(expedition.outcome) ||
      seen.has(expedition.id)
    ) {
      continue;
    }
    seen.add(expedition.id);
    expeditions.push({
      ...expedition,
      dispatchId:
        typeof expedition.dispatchId === "string" && expedition.dispatchId.length > 0
          ? expedition.dispatchId
          : undefined,
      expectedReward: Math.round(expedition.expectedReward),
      reward: Math.round(expedition.reward),
      storedReward:
        isWorkerResource(expedition.resource) &&
        typeof expedition.storedReward === "number" &&
        Number.isFinite(expedition.storedReward) &&
        expedition.storedReward >= 0
          ? Math.round(expedition.storedReward)
          : undefined,
      missionTier:
        isWorkerResource(expedition.resource) &&
        isLumberMissionTier(expedition.missionTier)
          ? expedition.missionTier
          : undefined,
      missionMultiplier:
        isWorkerResource(expedition.resource) && typeof expedition.missionMultiplier === "number" && Number.isFinite(expedition.missionMultiplier)
          ? expedition.missionMultiplier
          : undefined,
      buildingBonus:
        isWorkerResource(expedition.resource) && typeof expedition.buildingBonus === "number" && Number.isFinite(expedition.buildingBonus)
          ? expedition.buildingBonus
          : undefined
    });
  }
  return expeditions;
}

/** Credits completed resource missions into finite building storage exactly once. */
export function reconcileResourceWorkplace(
  expeditions: WorkerExpedition[],
  storage: number,
  capacity: number,
  now: number,
  resource: ResourceKind
) {
  let nextStorage = sanitizeBananaGroveStorage(storage, capacity);
  let changed = nextStorage !== storage;
  let completed = 0;
  const nextExpeditions = expeditions.map((expedition) => {
    if (expedition.resource !== resource || expedition.returnsAt > now || expedition.storedReward !== undefined) {
      return expedition;
    }
    const credited = Math.min(Math.max(0, capacity - nextStorage), expedition.reward);
    nextStorage += credited;
    completed += 1;
    changed = true;
    return { ...expedition, storedReward: credited };
  });
  return { expeditions: changed ? nextExpeditions : expeditions, storage: nextStorage, completed };
}

export function reconcileLumberCamp(
  expeditions: WorkerExpedition[],
  storage: number,
  capacity: number,
  now: number
) {
  return reconcileResourceWorkplace(expeditions, storage, capacity, now, "wood");
}

export function reconcileStoneQuarry(
  expeditions: WorkerExpedition[],
  storage: number,
  capacity: number,
  now: number
) {
  return reconcileResourceWorkplace(expeditions, storage, capacity, now, "stones");
}

/**
 * Credits completed Banana Grove contracts into local Grove storage once.
 * `storedReward` is the persisted idempotency marker, including when the
 * Grove was full and the credited amount is zero.
 */
export function reconcileBananaGrove(
  expeditions: WorkerExpedition[],
  storage: number,
  capacity: number,
  now: number
) {
  return reconcileResourceWorkplace(expeditions, storage, capacity, now, "bananas");
}

function isWorkerOutcome(value: unknown): value is WorkerExpeditionOutcome {
  return value === "success" || value === "half" || value === "empty";
}

/** Moves every finished sequential production item into the idle roster once. */
export function reconcileWorkerProduction(
  queue: WorkerProductionItem[],
  idleWorkers: IdleWorker[],
  now: number
) {
  if (!Number.isFinite(now)) {
    return { queue, idleWorkers, completed: [] as WorkerProductionItem[] };
  }
  const completed = queue.filter((item) => item.finishesAt <= now);
  if (completed.length === 0) {
    return { queue, idleWorkers, completed };
  }
  const existing = new Set(idleWorkers.map((worker) => worker.id));
  const produced = completed
    .filter((item) => !existing.has(item.workerId))
    .map((item) => ({
      id: item.workerId,
      workerClass: item.workerClass,
      producedAt: item.finishesAt
    } satisfies IdleWorker));
  return {
    queue: queue.filter((item) => item.finishesAt > now),
    idleWorkers: [...idleWorkers, ...produced],
    completed
  };
}

export function expeditionStatus(
  expedition: WorkerExpedition,
  now: number
): WorkerExpeditionStatus {
  if (now >= expedition.returnsAt) {
    return "completed";
  }
  const duration = Math.max(1, expedition.returnsAt - expedition.startedAt);
  const returnPhaseAt = expedition.startedAt + duration * 0.8;
  return now >= returnPhaseAt ? "returning" : "active";
}

function stableRoll(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0x1_0000_0000;
}

/** Shared base-yield economy used by every resource worker mission. */
export function calculateWorkerExpectedReward(
  baseYield: number,
  missionMultiplier: number,
  buildingBonus = 0
) {
  const safeBase = Number.isFinite(baseYield) ? Math.max(0, baseYield) : 0;
  const safeMultiplier = Number.isFinite(missionMultiplier) ? Math.max(0, missionMultiplier) : 0;
  const safeBonus = Number.isFinite(buildingBonus) ? Math.max(0, buildingBonus) : 0;
  return Math.round(safeBase * safeMultiplier * (1 + safeBonus));
}

/** Shared selection math used by workplace previews and persisted expeditions. */
export function calculateWorkerGroupExpectedReward(
  workers: readonly IdleWorker[],
  missionMultiplier: number,
  buildingBonus = 0
) {
  return workers.reduce(
    (total, worker) =>
      total +
      calculateWorkerExpectedReward(
        WORKER_CLASSES[worker.workerClass].baseYield,
        missionMultiplier,
        buildingBonus
      ),
    0
  );
}

export function selectedWorkersFromCounts(
  workers: readonly IdleWorker[],
  selection: WorkerCountSelection
) {
  const selected: IdleWorker[] = [];
  for (const workerClass of Object.keys(WORKER_CLASSES) as WorkerClass[]) {
    const count = Math.max(0, Math.floor(selection[workerClass] ?? 0));
    selected.push(
      ...workers
        .filter((worker) => worker.workerClass === workerClass)
        .sort((left, right) => left.producedAt - right.producedAt || left.id.localeCompare(right.id))
        .slice(0, count)
    );
  }
  return selected;
}

export function removeDispatchedWorkers(
  idleWorkers: readonly IdleWorker[],
  dispatchedWorkers: readonly IdleWorker[]
) {
  const dispatchedIds = new Set(dispatchedWorkers.map((worker) => worker.id));
  return idleWorkers.filter((worker) => !dispatchedIds.has(worker.id));
}

export function workerDispatchFitsCapacity(
  assignedWorkers: number,
  selectedWorkers: number,
  capacity: number
) {
  return (
    selectedWorkers > 0 &&
    Math.max(0, assignedWorkers) + selectedWorkers <= Math.max(0, capacity)
  );
}

export function evaluateWorkerProductionStart({
  workerClass,
  lodgeLevel,
  managedWorkers,
  capacity,
  resources,
  queue
}: {
  workerClass: WorkerClass;
  lodgeLevel: number;
  managedWorkers: number;
  capacity: number;
  resources: Resources;
  queue: readonly WorkerProductionItem[];
}): WorkerProductionStartResult {
  const definition = WORKER_CLASSES[workerClass];
  if (!definition) return "invalid";
  if (managedWorkers >= capacity) return "capacity-full";
  if (lodgeLevel < (definition.unlockLodgeLevel ?? 1)) return "locked";
  if (queue.some((item) => item.workerClass === workerClass)) return "already-producing";
  if (
    resources.bananas < definition.cost.bananas ||
    resources.stones < definition.cost.stones ||
    resources.wood < definition.cost.wood
  ) {
    return "insufficient-resources";
  }
  return "queued";
}

export function workerDispatchId(expedition: WorkerExpedition) {
  return expedition.dispatchId ?? expedition.id;
}

export function groupWorkerExpeditions(expeditions: readonly WorkerExpedition[]) {
  const groups = new Map<string, WorkerExpedition[]>();
  for (const expedition of expeditions) {
    const id = workerDispatchId(expedition);
    const group = groups.get(id);
    if (group) group.push(expedition);
    else groups.set(id, [expedition]);
  }
  return [...groups.entries()].map(([id, workers]) => ({ id, workers }));
}

export function workerTierCounts(expeditions: readonly WorkerExpedition[]) {
  return expeditions.reduce<Partial<Record<WorkerClass, number>>>((counts, expedition) => {
    counts[expedition.workerClass] = (counts[expedition.workerClass] ?? 0) + 1;
    return counts;
  }, {});
}

export function calculateWorkerFinalReward(
  expectedReward: number,
  outcome: WorkerExpeditionOutcome
) {
  if (outcome === "success") return expectedReward;
  if (outcome === "half") return Math.round(expectedReward / 2);
  return 0;
}

export function lumberExpeditionOutcome(seed: string, missionTier: LumberMissionTier): WorkerExpeditionOutcome {
  const roll = stableRoll(seed);
  const mission = WORKER_MISSIONS[missionTier];
  if (roll < mission.success) return "success";
  if (roll < mission.success + mission.partial) return "half";
  return "empty";
}

export const workerMissionOutcome = lumberExpeditionOutcome;

export function createResourceWorkerExpedition(
  id: string,
  worker: IdleWorker,
  resource: "wood" | "stones",
  missionTier: LumberMissionTier,
  buildingLevel: number,
  now: number
): WorkerExpedition {
  const validWorker = resource === "wood"
    ? isLumberWorkerClass(worker.workerClass)
    : isStoneWorkerClass(worker.workerClass);
  if (!validWorker) {
    throw new Error(`Worker class does not belong to ${resource}.`);
  }
  const definition = WORKER_CLASSES[worker.workerClass];
  const mission = WORKER_MISSIONS[missionTier];
  const buildingBonus = Math.max(0, Math.floor(buildingLevel)) * 0.03;
  const expectedReward = calculateWorkerExpectedReward(
    definition.baseYield,
    mission.multiplier,
    buildingBonus
  );
  const outcome = workerMissionOutcome(id, missionTier);
  return {
    id,
    workerId: worker.id,
    workerClass: worker.workerClass,
    resource,
    startedAt: now,
    returnsAt: now + mission.durationMs,
    expectedReward,
    reward: calculateWorkerFinalReward(expectedReward, outcome),
    outcome,
    missionTier,
    missionMultiplier: mission.multiplier,
    buildingBonus
  };
}

export function createLumberExpedition(
  id: string,
  worker: IdleWorker,
  missionTier: LumberMissionTier,
  campLevel: number,
  now: number
): WorkerExpedition {
  return createResourceWorkerExpedition(id, worker, "wood", missionTier, campLevel, now);
}

export function createStoneExpedition(
  id: string,
  worker: IdleWorker,
  missionTier: LumberMissionTier,
  quarryLevel: number,
  now: number
): WorkerExpedition {
  return createResourceWorkerExpedition(id, worker, "stones", missionTier, quarryLevel, now);
}

// 97% full success, 2% half reward, 1% empty. The result is fixed at
// dispatch so reloading cannot reroll a failed or successful expedition.
export function expeditionOutcome(seed: string): WorkerExpeditionOutcome {
  const roll = stableRoll(seed);
  if (roll < 0.97) return "success";
  if (roll < 0.99) return "half";
  return "empty";
}

export function createWorkerExpedition(
  id: string,
  worker: IdleWorker,
  resource: ResourceKind,
  now: number,
  missionMultiplier = 2,
  buildingBonus = 0,
  missionTier: LumberMissionTier = "safe"
): WorkerExpedition {
  const definition = WORKER_CLASSES[worker.workerClass];
  const expectedReward = calculateWorkerExpectedReward(
    definition.baseYield,
    missionMultiplier,
    buildingBonus
  );
  const outcome = expeditionOutcome(id);
  const reward = calculateWorkerFinalReward(expectedReward, outcome);
  return {
    id,
    workerId: worker.id,
    workerClass: worker.workerClass,
    resource,
    startedAt: now,
    returnsAt: now + definition.expeditionMs,
    expectedReward,
    reward,
    outcome,
    missionTier,
    missionMultiplier,
    buildingBonus
  };
}

/** Creates one persisted consumable contract per worker under one dispatch id. */
export function createWorkerExpeditionBatch(
  dispatchId: string,
  workers: readonly IdleWorker[],
  resource: ResourceKind,
  missionTier: LumberMissionTier,
  buildingLevel: number,
  now: number
) {
  return workers.map((worker, index) => {
    const id = `${dispatchId}-worker-${index + 1}`;
    const expedition =
      resource === "wood"
        ? createLumberExpedition(id, worker, missionTier, buildingLevel, now)
        : resource === "stones"
          ? createStoneExpedition(id, worker, missionTier, buildingLevel, now)
          : createWorkerExpedition(
              id,
              worker,
              resource,
              now,
              WORKER_MISSIONS[missionTier].multiplier,
              productionLevelMultiplier(buildingLevel) - 1,
              missionTier
            );
    return { ...expedition, dispatchId };
  });
}

export function managedWorkerCount(
  queue: WorkerProductionItem[],
  idleWorkers: IdleWorker[],
  expeditions: WorkerExpedition[]
) {
  return queue.length + idleWorkers.length + expeditions.length;
}
