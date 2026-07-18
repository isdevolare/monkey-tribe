import { describe, expect, it } from "vitest";
import type { IdleWorker, WorkerCountSelection } from "../types/game";
import { resourceBuildingProductionBonus } from "../config/buildings";
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
  workerDispatchFitsCapacity,
  workerDispatchQuestCredit,
  workerProductionQuestCredit
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
      resources: available
    })).toBe("queued");
  });

  it("rejects insufficient resources and full Lodge capacity", () => {
    expect(evaluateWorkerProductionStart({
      workerClass: "gatherer",
      lodgeLevel: 1,
      managedWorkers: 0,
      capacity: 3,
      resources: { bananas: 0, stones: 0, wood: 0 }
    })).toBe("insufficient-resources");
    expect(evaluateWorkerProductionStart({
      workerClass: "gatherer",
      lodgeLevel: 1,
      managedWorkers: 3,
      capacity: 3,
      resources: available
    })).toBe("capacity-full");
  });

  it("allows consecutive same-tier batches while checking their full cost and capacity", () => {
    expect(evaluateWorkerProductionStart({
      workerClass: "gatherer",
      lodgeLevel: 1,
      managedWorkers: 1,
      capacity: 6,
      resources: { bananas: 50, stones: 0, wood: 0 },
      count: 5
    })).toBe("queued");
    expect(evaluateWorkerProductionStart({
      workerClass: "gatherer",
      lodgeLevel: 1,
      managedWorkers: 2,
      capacity: 6,
      resources: { bananas: 50, stones: 0, wood: 0 },
      count: 5
    })).toBe("capacity-full");
    expect(evaluateWorkerProductionStart({
      workerClass: "gatherer",
      lodgeLevel: 1,
      managedWorkers: 0,
      capacity: 10,
      resources: { bananas: 49, stones: 0, wood: 0 },
      count: 5
    })).toBe("insufficient-resources");
  });

  it("credits quests by accepted worker count and never by failed batches", () => {
    expect(workerProductionQuestCredit("queued", 5)).toBe(5);
    expect(workerProductionQuestCredit("queued", 10)).toBe(10);
    expect(workerProductionQuestCredit("capacity-full", 10)).toBe(0);
    expect(workerProductionQuestCredit("insufficient-resources", 5)).toBe(0);
    expect(workerDispatchQuestCredit("sent")).toBe(1);
    expect(workerDispatchQuestCredit("capacity-full")).toBe(0);
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

  it("credits completed rewards once and preserves overflow until later collection", () => {
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
    expect(completed.expeditions.reduce((sum, entry) => sum + (entry.storedReward ?? 0), 0)).toBe(5);
    const repeated = reconcileResourceWorkplace(completed.expeditions, completed.storage, 100, 999_999, "stones");
    expect(repeated.storage).toBe(100);
    expect(repeated.completed).toBe(0);

    const afterCollection = reconcileResourceWorkplace(repeated.expeditions, 0, 100, 999_999, "stones");
    expect(afterCollection.storage).toBeGreaterThan(0);
    expect(afterCollection.expeditions.reduce((sum, entry) => sum + (entry.storedReward ?? 0), 0)).toBeGreaterThan(5);
    const offlineRepeat = reconcileResourceWorkplace(
      afterCollection.expeditions,
      afterCollection.storage,
      100,
      999_999,
      "stones"
    );
    expect(offlineRepeat.storage).toBe(afterCollection.storage);
    expect(offlineRepeat.completed).toBe(0);
  });

  it("marks an empty completed expedition collectible without inventing resources", () => {
    const [created] = createWorkerExpeditionBatch(
      "empty-reward",
      [worker("empty-1", "gatherer")],
      "bananas",
      "safe",
      1,
      0
    );
    const empty = created ? [{ ...created, outcome: "empty" as const, reward: 0 }] : [];
    const completed = reconcileResourceWorkplace(empty, 0, 100, 999_999, "bananas");
    expect(completed.storage).toBe(0);
    expect(completed.completed).toBe(1);
    expect(completed.expeditions[0]?.storedReward).toBe(0);
    const repeated = reconcileResourceWorkplace(completed.expeditions, 0, 100, 999_999, "bananas");
    expect(repeated.completed).toBe(0);
  });

  it.each([
    ["bananas", "gatherer", "bananaGrove"],
    ["wood", "worker_lumber_apprentice", "lumberCamp"],
    ["stones", "worker_stone_apprentice", "stoneQuarry"]
  ] as const)("matches %s preview with the full credited reward", (resource, workerClass, buildingType) => {
    const selected = [worker("preview-1", workerClass)];
    const level = 4;
    const bonus = resourceBuildingProductionBonus(buildingType, level);
    const preview = calculateWorkerGroupExpectedReward(
      selected,
      WORKER_MISSIONS.safe.multiplier,
      bonus
    );
    const [created] = createWorkerExpeditionBatch(
      `preview-${resource}`,
      selected,
      resource,
      "safe",
      level,
      0
    );
    expect(created?.expectedReward).toBe(preview);
    const fullSuccess = created
      ? [{ ...created, outcome: "success" as const, reward: calculateWorkerFinalReward(created.expectedReward, "success") }]
      : [];
    const credited = reconcileResourceWorkplace(fullSuccess, 0, 10_000, 999_999, resource);
    expect(credited.storage).toBe(preview);
    expect(credited.expeditions[0]?.storedReward).toBe(preview);
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
