import { describe, expect, it } from "vitest";
import type { IdleWorker, WorkerCountSelection } from "../types/game";
import {
  WORKER_CLASSES,
  WORKER_MISSIONS,
  calculateWorkerGroupExpectedReward,
  calculateWorkerFinalReward,
  createWorkerExpeditionBatch,
  evaluateWorkerProductionStart,
  reconcileResourceWorkplace,
  removeDispatchedWorkers,
  sanitizeIdleWorkers,
  sanitizeWorkerExpeditions,
  selectedWorkersFromCounts,
  workerDispatchFitsCapacity
} from "./workerExpeditions";

function worker(id: string, workerClass: IdleWorker["workerClass"]): IdleWorker {
  return { id, workerClass, producedAt: Number(id.replace(/\D/g, "")) || 1 };
}

describe("worker production decisions", () => {
  const available = { bananas: 100, stones: 100, wood: 100 };

  it("accepts a valid Tier I production start", () => {
    expect(evaluateWorkerProductionStart({
      workerClass: "gatherer",
      lodgeLevel: 1,
      managedWorkers: 0,
      capacity: 3,
      resources: available,
      queue: []
    })).toBe("queued");
  });

  it("rejects insufficient resources and full Lodge capacity", () => {
    expect(evaluateWorkerProductionStart({
      workerClass: "gatherer",
      lodgeLevel: 1,
      managedWorkers: 0,
      capacity: 3,
      resources: { bananas: 0, stones: 0, wood: 0 },
      queue: []
    })).toBe("insufficient-resources");
    expect(evaluateWorkerProductionStart({
      workerClass: "gatherer",
      lodgeLevel: 1,
      managedWorkers: 3,
      capacity: 3,
      resources: available,
      queue: []
    })).toBe("capacity-full");
  });
});

describe("single-use worker batch dispatch", () => {
  it("sends only three of four selected-tier workers and leaves one idle", () => {
    const idle = [1, 2, 3, 4].map((n) => worker(`w${n}`, "worker_lumber_apprentice"));
    const selection: WorkerCountSelection = { worker_lumber_apprentice: 3 };
    const selected = selectedWorkersFromCounts(idle, selection);
    expect(selected).toHaveLength(3);
    expect(removeDispatchedWorkers(idle, selected).map((entry) => entry.id)).toEqual(["w4"]);
    expect(workerDispatchFitsCapacity(0, selected.length, 3)).toBe(true);
    expect(workerDispatchFitsCapacity(0, idle.length, 3)).toBe(false);
  });

  it("supports mixed tiers with unchanged mission duration and shared reward math", () => {
    const selected = [
      worker("w1", "worker_lumber_apprentice"),
      worker("w2", "worker_lumber_apprentice"),
      worker("w3", "worker_lumber_skilled")
    ];
    const now = 10_000;
    const bonus = 2 * 0.03;
    const expected = calculateWorkerGroupExpectedReward(
      selected,
      WORKER_MISSIONS.safe.multiplier,
      bonus
    );
    const expeditions = createWorkerExpeditionBatch(
      "dispatch-1",
      selected,
      "wood",
      "safe",
      2,
      now
    );
    expect(expeditions).toHaveLength(3);
    expect(expeditions.every((entry) => entry.dispatchId === "dispatch-1")).toBe(true);
    expect(expeditions.every((entry) => entry.returnsAt - now === WORKER_MISSIONS.safe.durationMs)).toBe(true);
    expect(expeditions.reduce((sum, entry) => sum + entry.expectedReward, 0)).toBe(expected);
    expect(
      expeditions.every(
        (entry) =>
          entry.reward === calculateWorkerFinalReward(entry.expectedReward, entry.outcome)
      )
    ).toBe(true);
  });

  it("keeps Banana worker class durations unchanged in a mixed dispatch", () => {
    const selected = [worker("b1", "gatherer"), worker("b2", "master")];
    const now = 2_000;
    const expeditions = createWorkerExpeditionBatch(
      "dispatch-bananas",
      selected,
      "bananas",
      "safe",
      1,
      now
    );
    expect(expeditions.map((entry) => entry.returnsAt - now)).toEqual([
      WORKER_CLASSES.gatherer.expeditionMs,
      WORKER_CLASSES.master.expeditionMs
    ]);
  });

  it("credits completed rewards once and preserves the workplace storage cap", () => {
    const selected = [worker("s1", "worker_stone_apprentice"), worker("s2", "worker_stone_experienced")];
    const expeditions = createWorkerExpeditionBatch(
      "dispatch-stone",
      selected,
      "stones",
      "safe",
      1,
      0
    );
    const completed = reconcileResourceWorkplace(expeditions, 95, 100, 999_999, "stones");
    expect(completed.storage).toBe(100);
    expect(completed.expeditions.every((entry) => entry.storedReward !== undefined)).toBe(true);
    const repeated = reconcileResourceWorkplace(completed.expeditions, completed.storage, 100, 999_999, "stones");
    expect(repeated.storage).toBe(100);
    expect(repeated.completed).toBe(0);
  });

  it("preserves legacy active expeditions that have no dispatch id", () => {
    const legacy = createWorkerExpeditionBatch(
      "legacy-group",
      [worker("l1", "worker_lumber_apprentice")],
      "wood",
      "safe",
      1,
      10
    ).map(({ dispatchId: _dispatchId, ...entry }) => entry);
    const sanitized = sanitizeWorkerExpeditions(legacy);
    expect(sanitized).toHaveLength(1);
    expect(sanitized[0]?.workerId).toBe("l1");
    expect(sanitized[0]?.dispatchId).toBeUndefined();
    expect(sanitizeIdleWorkers([worker("idle-1", "gatherer")], 100)).toEqual([
      worker("idle-1", "gatherer")
    ]);
  });
});
