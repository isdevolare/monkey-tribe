import type {
  IdleWorker,
  ResourceKind,
  Resources,
  WorkerClass,
  WorkerExpedition,
  WorkerExpeditionOutcome,
  WorkerExpeditionStatus,
  WorkerProductionItem
} from "../types/game";

export type WorkerClassDefinition = {
  id: WorkerClass;
  cost: Resources;
  productionMs: number;
  expeditionMs: number;
  reward: number;
};

// Costs use all three village resources while preserving the requested
// 50 / 100 / 200 total price points.
export const WORKER_CLASSES: Record<WorkerClass, WorkerClassDefinition> = {
  gatherer: {
    id: "gatherer",
    cost: { bananas: 30, stones: 10, wood: 10 },
    productionMs: 30_000,
    expeditionMs: 5 * 60_000,
    reward: 150
  },
  skilled: {
    id: "skilled",
    cost: { bananas: 60, stones: 20, wood: 20 },
    productionMs: 45_000,
    expeditionMs: 8 * 60_000,
    reward: 350
  },
  master: {
    id: "master",
    cost: { bananas: 120, stones: 40, wood: 40 },
    productionMs: 60_000,
    expeditionMs: 12 * 60_000,
    reward: 700
  }
};

export const WORKER_CLASS_ORDER: readonly WorkerClass[] = [
  "gatherer",
  "skilled",
  "master"
];

export const WORKER_RESOURCE_ORDER: readonly ResourceKind[] = [
  "bananas",
  "stones",
  "wood"
];

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
      expectedReward: Math.round(expedition.expectedReward),
      reward: Math.round(expedition.reward)
    });
  }
  return expeditions;
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
  rewardMultiplier = 1
): WorkerExpedition {
  const definition = WORKER_CLASSES[worker.workerClass];
  const expectedReward = Math.round(
    definition.reward * Math.max(0, Number.isFinite(rewardMultiplier) ? rewardMultiplier : 1)
  );
  const outcome = expeditionOutcome(id);
  const reward =
    outcome === "success"
      ? expectedReward
      : outcome === "half"
        ? Math.round(expectedReward / 2)
        : 0;
  return {
    id,
    workerId: worker.id,
    workerClass: worker.workerClass,
    resource,
    startedAt: now,
    returnsAt: now + definition.expeditionMs,
    expectedReward,
    reward,
    outcome
  };
}

export function managedWorkerCount(
  queue: WorkerProductionItem[],
  idleWorkers: IdleWorker[],
  expeditions: WorkerExpedition[]
) {
  return queue.length + idleWorkers.length + expeditions.length;
}
