import type { ActiveWorkTask, Resources } from "../types/game";

const RESOURCE_KEYS = ["bananas", "stones", "wood"] as const;

export type WorkProductionResult = {
  activeWorkTask: ActiveWorkTask | null;
  resources: Resources;
  earned: Resources;
  accruedMs: number;
  completed: boolean;
};

function finiteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
}

/** Rejects corrupt tasks and normalizes counters without inventing production time. */
export function sanitizeActiveWorkTask(task: ActiveWorkTask | null | undefined) {
  if (
    !task ||
    !Number.isFinite(task.startedAt) ||
    !Number.isFinite(task.endsAt) ||
    !Number.isFinite(task.accruedUntil) ||
    !finiteNonNegative(task.workerCount) ||
    task.endsAt < task.startedAt ||
    !RESOURCE_KEYS.every((key) => finiteNonNegative(task.productionPerSecond?.[key]))
  ) {
    return null;
  }

  return {
    startedAt: task.startedAt,
    endsAt: task.endsAt,
    accruedUntil: Math.min(task.endsAt, Math.max(task.startedAt, task.accruedUntil)),
    workerCount: Math.floor(task.workerCount),
    productionPerSecond: { ...task.productionPerSecond }
  } satisfies ActiveWorkTask;
}

/**
 * Applies exactly the uncredited part of a work task. The returned task owns
 * the advanced cursor, so replaying the result at the same `now` earns zero.
 */
export function reconcileWorkProduction(
  task: ActiveWorkTask | null | undefined,
  currentResources: Resources,
  storageLimit: number,
  now: number
): WorkProductionResult {
  const activeTask = sanitizeActiveWorkTask(task);
  const resources = { ...currentResources };
  const earned: Resources = { bananas: 0, stones: 0, wood: 0 };
  const cap = Math.max(0, Number.isFinite(storageLimit) ? storageLimit : 0);

  if (!activeTask || !Number.isFinite(now)) {
    return {
      activeWorkTask: activeTask,
      resources,
      earned,
      accruedMs: 0,
      completed: false
    };
  }

  const intervalStart = Math.max(activeTask.accruedUntil, activeTask.startedAt);
  const intervalEnd = Math.min(now, activeTask.endsAt);
  const accruedMs = Math.max(0, intervalEnd - intervalStart);
  const elapsedSeconds = accruedMs / 1000;

  for (const key of RESOURCE_KEYS) {
    const before = Math.min(cap, Math.max(0, resources[key]));
    const after = Math.min(
      cap,
      before + activeTask.productionPerSecond[key] * elapsedSeconds
    );
    resources[key] = after;
    earned[key] = after - before;
  }

  const completed = now >= activeTask.endsAt;
  const nextAccruedUntil = Math.max(
    activeTask.accruedUntil,
    Math.min(activeTask.endsAt, intervalEnd)
  );

  return {
    activeWorkTask: completed
      ? null
      : { ...activeTask, accruedUntil: nextAccruedUntil },
    resources,
    earned,
    accruedMs,
    completed
  };
}
