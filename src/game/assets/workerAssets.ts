import type { GameAssetKey } from "./gameAssets";
import type {
  BananaWorkerClass,
  LumberWorkerClass,
  StoneWorkerClass,
  WorkerClass
} from "../types/game";

export const BANANA_WORKER_ASSETS: Record<BananaWorkerClass, GameAssetKey> = {
  gatherer: "bananaWorkerYoung",
  skilled: "bananaWorkerExperienced",
  master: "bananaWorkerMaster"
};

export const LUMBER_WORKER_ASSETS: Record<LumberWorkerClass, GameAssetKey> = {
  worker_lumber_apprentice: "lumberWorkerApprentice",
  worker_lumber_skilled: "lumberWorkerSkilled",
  worker_lumber_master: "lumberWorkerMaster"
};

export const STONE_WORKER_ASSETS: Record<StoneWorkerClass, GameAssetKey> = {
  worker_stone_apprentice: "stoneWorkerApprentice",
  worker_stone_experienced: "stoneWorkerExperienced",
  worker_stone_master: "stoneWorkerMaster"
};

/** One canonical role-to-art map shared by portraits and every job surface. */
export const WORKER_ASSETS: Record<WorkerClass, GameAssetKey> = {
  ...BANANA_WORKER_ASSETS,
  ...LUMBER_WORKER_ASSETS,
  ...STONE_WORKER_ASSETS
};
