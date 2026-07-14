import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  ATTACK_INTERVAL_MS,
  BOARD_SIZE,
  CAMP_MAX_HP,
  ENEMY_CAMP,
  ENEMY_DETECTION_RANGE,
  MOVE_INTERVAL_MS,
  PLAYER_CAMP,
  PRODUCTION_DURATION_MS,
  PRODUCTION_SLOTS,
  RAID_REWARD,
  RUSH_GEM_COST,
  STARTING_RESOURCES,
  VILLAGE_REGEN_PER_SEC,
  WATCH_TOWER_DAMAGE_REDUCTION,
  effectiveRaidAttack,
  unitCombatStats,
  unitCost
} from "../config/constants";
import {
  DEFAULT_BUILDINGS,
  buildingName,
  populationCap,
  productionLevelMultiplier,
  storageCap,
  upgradeCost
} from "../config/buildings";
import { STRONGHOLD_BASE_LEVEL, getCamp, campName, type RaidCamp } from "../config/camps";
import { DAILY_REWARDS, dayDiff, todayKey } from "../config/dailyRewards";
import { QUESTS, isQuestComplete } from "../config/quests";
import {
  DEFAULT_PROFILE_MONKEY_ID,
  DEFAULT_PROFILE_SKIN_ID,
  getDefaultSkinId,
  getProfileMonkey,
  getProfileSkin,
  sanitizeEquippedProfileMonkey,
  sanitizeEquippedProfileSkin,
  sanitizeNewProfileMonkeys,
  sanitizeNewProfileSkins,
  sanitizeOwnedProfileSkins,
  sanitizeUnlockedProfileMonkeys
} from "../config/profileMonkeys";
import { SHOP_ITEMS } from "../config/shop";
import { t } from "../i18n";
import { createInitialMap, createInitialUnits, createUnit } from "../config/map";
import { applyRaidPenalty } from "./raidPenalty";
import {
  resolveRaidVictoryReward,
  sanitizeRaidVictoryCounts
} from "./raidRewards";
import {
  WORKER_CLASSES,
  createWorkerExpedition,
  expeditionStatus,
  isWorkerClass,
  isWorkerResource,
  managedWorkerCount,
  reconcileWorkerProduction,
  sanitizeIdleWorkers,
  sanitizeWorkerExpeditions,
  sanitizeWorkerProductionQueue,
  workerCapacity
} from "./workerExpeditions";
import type {
  GameState,
  GatherTarget,
  IdleWorker,
  Lang,
  OfflineReport,
  Owner,
  Position,
  PersistedUnit,
  ProfileMonkeyId,
  ProfileMonkeyUnlockResult,
  ProfileSkinId,
  ProductionItem,
  QuestMetric,
  Resources,
  Unit,
  UnitCombatStats,
  UnitTarget,
  UnitType,
  VillageBuilding,
  VillageBuildingType,
  VillageSave,
  WorkerCollectionSummary,
  WorkerProductionItem
} from "../types/game";

// Cumulative per-metric quest counter (immutably bumped by +1).
function bumpQuest(
  progress: Partial<Record<QuestMetric, number>>,
  metric: QuestMetric
): Partial<Record<QuestMetric, number>> {
  return { ...progress, [metric]: (progress[metric] ?? 0) + 1 };
}

/**
 * Adds `delta` to `resources` in place, clamping every resource to the
 * Clan Hall storage cap. Returns true when anything was clipped so the
 * caller can surface a "storage full" hint.
 */
function addResourcesCapped(resources: Resources, delta: Partial<Resources>, cap: number) {
  let clipped = false;
  for (const key of ["bananas", "stones", "wood"] as const) {
    const gain = delta[key] ?? 0;
    const next = resources[key] + gain;
    if (next > cap) {
      resources[key] = Math.max(resources[key], cap);
      if (gain > 0) {
        clipped = true;
      }
    } else {
      resources[key] = next;
    }
  }
  return clipped;
}

export const SAVE_KEY = "monkey-tribe:save";

type MutableGame = {
  units: Unit[];
  resources: Resources;
  buildings: VillageBuilding[];
  maxPopulation: number;
  playerCampHp: number;
  enemyCampHp: number;
  lang: Lang;
  feedbackText: string | null;
};

function buildingLevel(buildings: VillageBuilding[], type: VillageBuildingType) {
  return buildings.find((building) => building.type === type)?.level ?? 0;
}

const UNIT_TYPES: UnitType[] = ["worker", "fighter", "archer", "guardian"];

function isUnitType(value: unknown): value is UnitType {
  return typeof value === "string" && UNIT_TYPES.includes(value as UnitType);
}

function sanitizeCombatStats(
  value: UnitCombatStats | null | undefined,
  fallback: UnitCombatStats
): UnitCombatStats {
  if (
    !value ||
    !Number.isFinite(value.maxHp) ||
    value.maxHp <= 0 ||
    !Number.isFinite(value.attack) ||
    value.attack < 0 ||
    !Number.isFinite(value.range) ||
    value.range <= 0
  ) {
    return { ...fallback };
  }

  return {
    maxHp: Math.max(1, Math.round(value.maxHp)),
    attack: Math.max(0, Math.round(value.attack)),
    range: Math.max(1, Math.round(value.range))
  };
}

function normalizeProductionQueue(
  queue: ProductionItem[] | undefined,
  nestLevel: number,
  now: number
) {
  return (queue ?? [])
    .filter((item) => isUnitType(item?.type))
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `migrated-prod-${now}-${index}`,
      type: item.type,
      finishAt: Number.isFinite(item.finishAt) ? item.finishAt : now,
      combatStats: sanitizeCombatStats(
        item.combatStats,
        unitCombatStats(item.type, nestLevel)
      )
    })) satisfies ProductionItem[];
}

// Units that fight in a raid (as opposed to workers).
function isCombatant(unit: Unit) {
  return unit.type === "fighter" || unit.type === "archer" || unit.type === "guardian";
}

function cloneBuildings(buildings: VillageBuilding[]): VillageBuilding[] {
  return buildings.map((building) => ({ ...building }));
}

// Monotonic counter so units created in the same millisecond still get
// unique ids (Date.now() alone collides on rapid creation / fast taps).
let unitSerial = 0;
let workerSerial = 0;

function createFreshState(now: number) {
  return {
    currentScreen: "menu" as const,
    gameStatus: "menu" as const,
    gameMode: "village" as const,
    raidStatus: "idle" as const,
    mapTiles: createInitialMap(),
    units: createInitialUnits(now),
    resources: { ...STARTING_RESOURCES },
    buildings: cloneBuildings(DEFAULT_BUILDINGS),
    maxPopulation: populationCap(1),
    gems: 0,
    unlockedProfileMonkeys: [DEFAULT_PROFILE_MONKEY_ID] as ProfileMonkeyId[],
    equippedProfileMonkey: DEFAULT_PROFILE_MONKEY_ID,
    ownedProfileSkins: [DEFAULT_PROFILE_SKIN_ID] as ProfileSkinId[],
    equippedProfileSkin: DEFAULT_PROFILE_SKIN_ID,
    newProfileMonkeys: [] as ProfileMonkeyId[],
    newProfileSkins: [] as ProfileSkinId[],
    productionQueue: [] as ProductionItem[],
    workerProductionQueue: [] as WorkerProductionItem[],
    idleWorkers: [],
    workerExpeditions: [],
    playerCampHp: CAMP_MAX_HP,
    enemyCampHp: CAMP_MAX_HP,
    enemyCampMaxHp: CAMP_MAX_HP,
    activeCampId: null,
    raidStars: 0,
    raidLevel: STRONGHOLD_BASE_LEVEL,
    raidVictoryCounts: {} as Record<string, number>,
    lastRaidReward: null,
    lastRaidPenalty: null,
    questProgress: {} as Partial<Record<QuestMetric, number>>,
    questsClaimed: [] as string[],
    offlineReport: null as OfflineReport | null,
    dailyStreak: 0,
    dailyLastClaim: null as string | null,
    lastProductionAt: now,
    language: "tr" as Lang,
    feedback: null
  };
}

function cloneTarget(target: UnitTarget | undefined): UnitTarget | undefined {
  if (!target) {
    return undefined;
  }

  return { ...target };
}

function cloneGatherTarget(target: GatherTarget | undefined): GatherTarget | undefined {
  if (!target) {
    return undefined;
  }

  return { ...target };
}

function cloneUnit(unit: Unit): Unit {
  return {
    ...unit,
    carriedResource: unit.carriedResource ? { ...unit.carriedResource } : null,
    target: cloneTarget(unit.target),
    gatherTarget: cloneGatherTarget(unit.gatherTarget)
  };
}

function campPosition(owner: Owner): Position {
  return owner === "player" ? PLAYER_CAMP : ENEMY_CAMP;
}

function distance(a: Position, b: Position) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isInsideBoard(x: number, y: number) {
  return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
}

function hasResources(resources: Resources, cost: Resources) {
  return (
    resources.bananas >= cost.bananas &&
    resources.stones >= cost.stones &&
    resources.wood >= cost.wood
  );
}

function spendResources(resources: Resources, cost: Resources): Resources {
  return {
    bananas: resources.bananas - cost.bananas,
    stones: resources.stones - cost.stones,
    wood: resources.wood - cost.wood
  };
}

function currentPopulation(units: Unit[]) {
  return units.filter((unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0)
    .length;
}

function costText(cost: Resources) {
  const parts = [
    cost.bananas > 0 ? `${cost.bananas} muz` : null,
    cost.stones > 0 ? `${cost.stones} taş` : null,
    cost.wood > 0 ? `${cost.wood} odun` : null
  ].filter(Boolean);
  return parts.join(" + ");
}

function nextStepToward(unit: Unit, target: Position): Position {
  if (unit.x < target.x) {
    return { x: unit.x + 1, y: unit.y };
  }

  if (unit.x > target.x) {
    return { x: unit.x - 1, y: unit.y };
  }

  if (unit.y < target.y) {
    return { x: unit.x, y: unit.y + 1 };
  }

  if (unit.y > target.y) {
    return { x: unit.x, y: unit.y - 1 };
  }

  return { x: unit.x, y: unit.y };
}

function moveUnitToward(unit: Unit, target: Position, now: number) {
  if (now - unit.lastStepAt < MOVE_INTERVAL_MS) {
    return;
  }

  // Clamp instead of giving up: a step that would leave the board slides
  // along the edge, so a unit near (or past) the border keeps fighting.
  const step = nextStepToward(unit, target);
  unit.x = Math.min(BOARD_SIZE - 1, Math.max(0, step.x));
  unit.y = Math.min(BOARD_SIZE - 1, Math.max(0, step.y));
  unit.lastStepAt = now;
}

function resolveTargetPosition(units: Unit[], target: UnitTarget): Position | null {
  if (target.kind === "tile") {
    return { x: target.x, y: target.y };
  }

  if (target.kind === "camp") {
    return campPosition(target.owner);
  }

  const targetUnit = units.find(
    (unit) => unit.id === target.unitId && unit.state !== "dead" && unit.hp > 0
  );
  return targetUnit ? { x: targetUnit.x, y: targetUnit.y } : null;
}

function nearestPlayerInRange(enemy: Unit, units: Unit[]) {
  const playerUnits = units.filter(
    (unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0
  );
  let closest: Unit | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const player of playerUnits) {
    const range = distance(enemy, player);
    if (range <= ENEMY_DETECTION_RANGE && range < closestDistance) {
      closest = player;
      closestDistance = range;
    }
  }

  return closest;
}

function assignEnemyOrders(units: Unit[]) {
  for (const unit of units) {
    if (unit.owner !== "enemy" || unit.state === "dead" || unit.hp <= 0) {
      continue;
    }

    const playerTarget = nearestPlayerInRange(unit, units);
    if (playerTarget) {
      unit.state = "attacking";
      unit.target = { kind: "unit", unitId: playerTarget.id };
      continue;
    }

    if (distance(unit, PLAYER_CAMP) <= unit.range) {
      unit.state = "attacking";
      unit.target = { kind: "camp", owner: "player" };
      continue;
    }

    if (unit.state === "attacking") {
      unit.state = "idle";
      unit.target = undefined;
    }
  }
}

function damageUnit(units: Unit[], unitId: string, amount: number) {
  const target = units.find((unit) => unit.id === unitId);
  if (!target || target.state === "dead") {
    return;
  }

  target.hp = Math.max(0, target.hp - amount);
  if (target.hp <= 0) {
    target.state = "dead";
    target.target = undefined;
    target.gatherTarget = undefined;
    target.carriedResource = null;
  }
}

function processAttacking(
  unit: Unit,
  game: MutableGame,
  now: number,
  raidCombat: boolean
) {
  if (!unit.target) {
    unit.state = "idle";
    return;
  }

  const targetPosition = resolveTargetPosition(game.units, unit.target);
  if (!targetPosition) {
    unit.state = "idle";
    unit.target = undefined;
    return;
  }

  if (distance(unit, targetPosition) > unit.range) {
    moveUnitToward(unit, targetPosition, now);
    return;
  }

  if (now - unit.lastActionAt < ATTACK_INTERVAL_MS) {
    return;
  }

  const attack =
    raidCombat && unit.owner === "player"
      ? effectiveRaidAttack(
          unit.type,
          unit.attack,
          buildingLevel(game.buildings, "watchTower")
        )
      : unit.attack;

  if (unit.target.kind === "unit") {
    damageUnit(game.units, unit.target.unitId, attack);
    game.feedbackText = t(unit.owner === "player" ? "fb.hitEnemy" : "fb.enemyCounter", game.lang);
  } else if (unit.target.kind === "camp") {
    if (unit.target.owner === "player") {
      const blocked =
        buildingLevel(game.buildings, "watchTower") * WATCH_TOWER_DAMAGE_REDUCTION;
      const damage = Math.max(1, unit.attack - blocked);
      game.playerCampHp = Math.max(0, game.playerCampHp - damage);
      game.feedbackText =
        blocked > 0
          ? t("fb.towerBlocked", game.lang, { n: blocked })
          : t("fb.enemyHitVillage", game.lang);
    } else {
      game.enemyCampHp = Math.max(0, game.enemyCampHp - attack);
      game.feedbackText = t("fb.hitCamp", game.lang);
    }
  }

  unit.lastActionAt = now;
}

function processUnit(unit: Unit, game: MutableGame, now: number, raidCombat = false) {
  if (unit.state === "dead" || unit.hp <= 0) {
    unit.state = "dead";
    return;
  }

  if (unit.state === "attacking") {
    processAttacking(unit, game, now, raidCombat);
  }
}

function findSpawnPosition(units: Unit[], owner: Owner): Position {
  const camp = campPosition(owner);
  const candidates = [
    { x: camp.x, y: camp.y + (owner === "player" ? -1 : 1) },
    { x: camp.x + 1, y: camp.y },
    { x: camp.x - 1, y: camp.y },
    { x: camp.x, y: camp.y },
    { x: camp.x + 1, y: camp.y + (owner === "player" ? -1 : 1) },
    { x: camp.x - 1, y: camp.y + (owner === "player" ? -1 : 1) }
  ];

  for (const candidate of candidates) {
    const occupied = units.some(
      (unit) =>
        unit.state !== "dead" &&
        unit.hp > 0 &&
        unit.x === candidate.x &&
        unit.y === candidate.y
    );
    if (isInsideBoard(candidate.x, candidate.y) && !occupied) {
      return candidate;
    }
  }

  return camp;
}

// Enough unique tiles for the biggest tier-2 garrisons (12 defenders) —
// stacked units confuse targeting and read as one monkey on screen.
const ENEMY_DEPLOY_SPOTS: Position[] = [
  { x: 8, y: 2 },
  { x: 7, y: 1 },
  { x: 9, y: 1 },
  { x: 8, y: 3 },
  { x: 9, y: 3 },
  { x: 7, y: 2 },
  { x: 6, y: 1 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 6, y: 2 },
  { x: 8, y: 4 },
  { x: 9, y: 4 }
];

function createRaidEnemies(now: number, camp: RaidCamp): Unit[] {
  const total = camp.enemyCount + (camp.archerCount ?? 0);
  return Array.from({ length: total }, (_, index) => {
    const spot = ENEMY_DEPLOY_SPOTS[index % ENEMY_DEPLOY_SPOTS.length] ?? { x: 8, y: 2 };
    const isArcher = index >= camp.enemyCount;
    const unit = createUnit(
      `raid-enemy-${index}-${now}`,
      isArcher ? "archer" : "fighter",
      "enemy",
      spot.x,
      spot.y,
      now
    );
    unit.hp = camp.enemyHp;
    unit.maxHp = camp.enemyHp;
    unit.attack = camp.enemyAttack;
    if (isArcher) {
      unit.range = 3;
    }
    return unit;
  });
}

function deployRaidUnits(units: Unit[], now: number, camp: RaidCamp) {
  let fighterIndex = 0;

  return [
    ...units
      .filter((unit) => unit.owner === "player")
      .map((unit) => {
        if (!isCombatant(unit) || unit.state === "dead" || unit.hp <= 0) {
          return {
            ...unit,
            state: "idle" as const,
            target: undefined,
            gatherTarget: undefined,
            carriedResource: null
          };
        }

        const slot = fighterIndex;
        fighterIndex += 1;

        return {
          ...unit,
          // 3-wide column keeps even a 16-strong army on the 10x10 board
          // (the old 2-wide layout pushed slots 14+ off the bottom edge,
          // freezing them in a step-outside/idle loop forever).
          x: 5 + (slot % 3),
          y: 3 + Math.floor(slot / 3),
          state: "attacking" as const,
          target: { kind: "camp", owner: "enemy" } as UnitTarget,
          gatherTarget: undefined,
          carriedResource: null,
          lastStepAt: now,
          lastActionAt: now
        };
      }),
    ...createRaidEnemies(now, camp)
  ];
}

function returnPlayerUnitsToVillage(units: Unit[]) {
  let playerIndex = 0;

  return units
    .filter((unit) => unit.owner === "player")
    .map((unit) => {
      const slot = playerIndex;
      playerIndex += 1;

      return {
        ...unit,
        x: PLAYER_CAMP.x + (slot % 2),
        y: PLAYER_CAMP.y - 1 + Math.floor(slot / 2),
        state: unit.hp > 0 ? ("idle" as const) : ("dead" as const),
        target: undefined,
        gatherTarget: undefined,
        carriedResource: null
      };
    });
}

function nearestEnemyUnit(attacker: Unit, units: Unit[]): Unit | null {
  let closest: Unit | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const unit of units) {
    if (unit.owner !== "enemy" || unit.state === "dead" || unit.hp <= 0) {
      continue;
    }

    const range = distance(attacker, unit);
    if (range < closestDistance) {
      closest = unit;
      closestDistance = range;
    }
  }

  return closest;
}

function assignRaidOrders(units: Unit[]) {
  assignEnemyOrders(units);

  for (const unit of units) {
    if (unit.owner !== "player" || !isCombatant(unit) || unit.state === "dead" || unit.hp <= 0) {
      continue;
    }

    // Fight the nearest enemy first; once the defenders are gone, hit the camp.
    const enemyTarget = nearestEnemyUnit(unit, units);
    unit.state = "attacking";
    unit.target = enemyTarget
      ? { kind: "unit", unitId: enemyTarget.id }
      : { kind: "camp", owner: "enemy" };
  }
}

function createPlayerUnit(state: GameState, type: UnitType) {
  if (state.gameStatus !== "playing") {
    return state;
  }

  const unitLabel = t(`unit.${type}`, state.language);

  if (type === "fighter" && buildingLevel(state.buildings, "trainingNest") <= 0) {
    return {
      ...state,
      feedback: { id: Date.now(), text: t("fb.needTrainingNest", state.language) }
    };
  }

  if (type === "guardian" && buildingLevel(state.buildings, "trainingNest") <= 0) {
    return {
      ...state,
      feedback: { id: Date.now(), text: t("fb.needTrainingNest", state.language) }
    };
  }

  if (type === "archer" && buildingLevel(state.buildings, "watchTower") <= 0) {
    return {
      ...state,
      feedback: { id: Date.now(), text: t("fb.needWatchTower", state.language) }
    };
  }

  if (state.productionQueue.length >= PRODUCTION_SLOTS) {
    return {
      ...state,
      feedback: { id: Date.now(), text: t("fb.queueFull", state.language) }
    };
  }

  if (currentPopulation(state.units) + state.productionQueue.length >= state.maxPopulation) {
    return {
      ...state,
      feedback: { id: Date.now(), text: t("fb.capacityFull", state.language) }
    };
  }

  const nestLevel = buildingLevel(state.buildings, "trainingNest");
  const cost = unitCost(type, nestLevel);
  if (!hasResources(state.resources, cost)) {
    return {
      ...state,
      feedback: {
        id: Date.now(),
        text: t("fb.needCost", state.language, { name: unitLabel, cost: costText(cost) })
      }
    };
  }

  const now = Date.now();
  unitSerial += 1;
  const queueItem: ProductionItem = {
    id: `prod-${type}-${now}-${unitSerial}`,
    type,
    finishAt: now + PRODUCTION_DURATION_MS[type],
    combatStats: unitCombatStats(type, nestLevel)
  };

  return {
    ...state,
    resources: spendResources(state.resources, cost),
    productionQueue: [...state.productionQueue, queueItem],
    questProgress: bumpQuest(state.questProgress, "trainAny"),
    feedback: { id: now, text: t(`fb.queued.${type}`, state.language) }
  };
}

function upgradeVillageBuilding(state: GameState, type: VillageBuildingType): GameState {
  if (state.gameStatus !== "playing") {
    return state;
  }

  const level = buildingLevel(state.buildings, type);
  const name = buildingName(type, state.language);

  // Other buildings cannot exceed the Clan Hall level (it gates progression).
  if (type !== "clanHall" && level >= buildingLevel(state.buildings, "clanHall")) {
    return {
      ...state,
      feedback: { id: Date.now(), text: t("fb.clanHallFirst", state.language) }
    };
  }

  const cost = upgradeCost(type, level);
  if (!hasResources(state.resources, cost)) {
    return {
      ...state,
      feedback: {
        id: Date.now(),
        text: t("fb.needCost", state.language, { name, cost: costText(cost) })
      }
    };
  }

  const buildings = state.buildings.map((building) =>
    building.type === type ? { ...building, level: building.level + 1 } : building
  );
  const now = Date.now();
  const shelterLevel = buildingLevel(buildings, "workerShelter");

  return {
    ...state,
    buildings,
    resources: spendResources(state.resources, cost),
    maxPopulation: populationCap(shelterLevel),
    questProgress: bumpQuest(state.questProgress, "upgradeAny"),
    feedback: { id: now, text: t("fb.upgraded", state.language, { name, level: level + 1 }) }
  };
}

const initialNow = Date.now();
const initialState = createFreshState(initialNow);

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  startGame: () =>
    set((state) => ({
      // Keep the persistent village (buildings/resources/population); only
      // reset the per-session battle state.
      currentScreen: "game",
      gameStatus: "playing",
      gameMode: "village",
      raidStatus: "idle",
      units: returnPlayerUnitsToVillage(state.units),
      playerCampHp: CAMP_MAX_HP,
      enemyCampHp: CAMP_MAX_HP,
      activeCampId: null,
      raidStars: 0,
      lastRaidReward: null,
      lastRaidPenalty: null,
      lastProductionAt: Date.now(),
      feedback: null
    })),
  hydrate: (save: VillageSave) =>
    set((state) => {
      const now = Date.now();
      const levels = new Map(save.buildings.map((building) => [building.type, building.level]));
      const buildings = DEFAULT_BUILDINGS.map((building) => ({
        type: building.type,
        level: levels.get(building.type) ?? building.level
      }));
      const cap = storageCap(buildingLevel(buildings, "clanHall"));

      const nestLevel = buildingLevel(buildings, "trainingNest");

      // Current saves preserve each living unit's exact combat stats and HP.
      // Legacy permanent workers are migrated once into the Lodge's idle
      // roster; only combatants remain map/raid units.
      let units: Unit[] = [];
      let legacyWorkerCount = 0;
      if (Array.isArray(save.unitRoster)) {
        for (const savedUnit of save.unitRoster) {
          if (!isUnitType(savedUnit?.type)) {
            continue;
          }
          if (savedUnit.type === "worker") {
            legacyWorkerCount += 1;
            continue;
          }
          const stats = sanitizeCombatStats(
            savedUnit,
            unitCombatStats(savedUnit.type, nestLevel)
          );
          const hp = Number.isFinite(savedUnit.hp)
            ? Math.min(stats.maxHp, Math.max(0, savedUnit.hp))
            : stats.maxHp;
          if (hp <= 0) {
            continue;
          }
          unitSerial += 1;
          const spawn = findSpawnPosition(units, "player");
          const unit = createUnit(
            `player-${savedUnit.type}-${now}-${unitSerial}`,
            savedUnit.type,
            "player",
            spawn.x,
            spawn.y,
            now,
            stats
          );
          unit.hp = hp;
          units.push(unit);
        }
      } else if (save.unitCounts) {
        for (const [type, count] of Object.entries(save.unitCounts) as [UnitType, number][]) {
          if (!isUnitType(type)) {
            continue;
          }
          const safeCount = Number.isFinite(count)
            ? Math.max(0, Math.floor(count))
            : 0;
          if (type === "worker") {
            legacyWorkerCount += safeCount;
            continue;
          }
          for (let i = 0; i < safeCount; i++) {
            unitSerial += 1;
            const spawn = findSpawnPosition(units, "player");
            units.push(
              createUnit(
                `player-${type}-${now}-${unitSerial}`,
                type,
                "player",
                spawn.x,
                spawn.y,
                now,
                unitCombatStats(type, nestLevel)
              )
            );
          }
        }
      }
      if (units.length === 0) {
        units = createInitialUnits(now);
      }
      const productionQueue = normalizeProductionQueue(
        save.productionQueue?.filter((item) => item.type !== "worker"),
        nestLevel,
        now
      );
      const legacyQueuedWorkers: WorkerProductionItem[] = (save.productionQueue ?? [])
        .filter((item) => item.type === "worker")
        .map((item, index) => {
          const finishesAt = Number.isFinite(item.finishAt) ? item.finishAt : now;
          const id = typeof item.id === "string" ? item.id : `legacy-${now}-${index}`;
          return {
            id: `worker-production-${id}`,
            workerId: `worker-${id}`,
            workerClass: "gatherer",
            startedAt: Math.max(0, finishesAt - PRODUCTION_DURATION_MS.worker),
            finishesAt
          };
        });
      let workerProductionQueue = sanitizeWorkerProductionQueue(
        [...(save.workerProductionQueue ?? []), ...legacyQueuedWorkers],
        now
      );
      let idleWorkers = sanitizeIdleWorkers(save.idleWorkers, now);
      const migratedWorkers: IdleWorker[] = Array.from(
        { length: legacyWorkerCount },
        (_, index) => ({
          id: `migrated-gatherer-${now}-${index}`,
          workerClass: "gatherer",
          producedAt: now
        })
      );
      idleWorkers = [...idleWorkers, ...migratedWorkers];
      const workerExpeditions = sanitizeWorkerExpeditions(save.workerExpeditions);
      const expeditionWorkerIds = new Set(workerExpeditions.map((entry) => entry.workerId));
      idleWorkers = idleWorkers.filter((worker) => !expeditionWorkerIds.has(worker.id));
      workerProductionQueue = workerProductionQueue.filter(
        (item) =>
          !expeditionWorkerIds.has(item.workerId) &&
          !idleWorkers.some((worker) => worker.id === item.workerId)
      );
      const reconciledWorkers = reconcileWorkerProduction(
        workerProductionQueue,
        idleWorkers,
        now
      );
      const unlockedProfileMonkeys = sanitizeUnlockedProfileMonkeys(
        save.unlockedProfileMonkeys
      );
      const equippedProfileMonkey = sanitizeEquippedProfileMonkey(
        save.equippedProfileMonkey,
        unlockedProfileMonkeys
      );
      const ownedProfileSkins = sanitizeOwnedProfileSkins(
        save.ownedProfileSkins,
        unlockedProfileMonkeys
      );
      const equippedProfileSkin = sanitizeEquippedProfileSkin(
        save.equippedProfileSkin,
        equippedProfileMonkey,
        ownedProfileSkins
      );
      const newProfileMonkeys = sanitizeNewProfileMonkeys(
        save.newProfileMonkeys,
        unlockedProfileMonkeys
      );
      const newProfileSkins = sanitizeNewProfileSkins(
        save.newProfileSkins,
        ownedProfileSkins
      );
      // Migration squeeze: stockpiles from the pre-cap economy clamp to the
      // new depot limit.
      const savedResources = {
        bananas: Math.min(save.resources.bananas, cap),
        stones: Math.min(save.resources.stones, cap),
        wood: Math.min(save.resources.wood, cap)
      };

      // The legacy continuous work shift is intentionally cancelled. New
      // expeditions only grant resources when the player collects them.
      const resources = savedResources;
      const offlineReport: OfflineReport | null = null;

      return {
        buildings,
        units,
        resources,
        offlineReport,
        maxPopulation: save.maxPopulation,
        gems: save.gems ?? state.gems,
        unlockedProfileMonkeys,
        equippedProfileMonkey,
        ownedProfileSkins,
        equippedProfileSkin,
        newProfileMonkeys,
        newProfileSkins,
        productionQueue,
        workerProductionQueue: reconciledWorkers.queue,
        idleWorkers: reconciledWorkers.idleWorkers,
        workerExpeditions,
        language: save.language ?? state.language,
        // Migration: older saves tracked the stronghold from Sv4; the ladder
        // now has handcrafted camps through Sv7, so lift stale levels to the
        // new base (higher progress is kept as-is).
        raidLevel: Math.max(save.raidLevel ?? STRONGHOLD_BASE_LEVEL, STRONGHOLD_BASE_LEVEL),
        raidVictoryCounts: sanitizeRaidVictoryCounts(save.raidVictoryCounts),
        lastRaidReward: null,
        questProgress: save.questProgress ?? {},
        questsClaimed: save.questsClaimed ?? [],
        dailyStreak: save.dailyStreak ?? 0,
        dailyLastClaim: save.dailyLastClaim ?? null,
        lastProductionAt: Date.now()
      };
    }),
  setLanguage: (lang) =>
    set((state) => {
      const next = { ...state, language: lang };
      persistVillage(next);
      return { language: lang };
    }),
  upgradeBuilding: (type) => set((state) => upgradeVillageBuilding(state, type)),
  openRaidMap: () =>
    set((state) => ({
      ...state,
      gameMode: "raidMap",
      raidStatus: "idle",
      feedback: null
    })),
  closeRaidMap: () =>
    set((state) => ({
      ...state,
      gameMode: "village",
      lastProductionAt: Date.now(),
      feedback: null
    })),
  startRaidOn: (campId) =>
    set((state) => {
      const now = Date.now();
      const camp = getCamp(campId);
      if (!camp) {
        return state;
      }

      const fighters = state.units.filter(
        (unit) => unit.owner === "player" && isCombatant(unit) && unit.state !== "dead" && unit.hp > 0
      );

      if (fighters.length <= 0) {
        return {
          ...state,
          feedback: { id: now, text: t("fb.needFighter", state.language) }
        };
      }

      return {
        ...state,
        gameMode: "raid",
        raidStatus: "active",
        activeCampId: camp.id,
        enemyCampHp: camp.campHp,
        enemyCampMaxHp: camp.campHp,
        raidStars: 0,
        lastRaidReward: null,
        lastRaidPenalty: null,
        units: deployRaidUnits(state.units, now, camp),
        lastProductionAt: now,
        feedback: {
          id: now,
          text: t("fb.raidStarted", state.language, { name: campName(camp.id, state.language) })
        }
      };
    }),
  retreatFromRaid: () =>
    set((state) => {
      if (state.gameMode !== "raid" || state.raidStatus !== "active") {
        return state;
      }

      const now = Date.now();
      const penalized = applyRaidPenalty(state.resources, "retreat");
      return {
        ...state,
        resources: penalized.resources,
        raidStatus: "retreat",
        lastRaidPenalty: { reason: "retreat", amounts: penalized.amounts },
        feedback: { id: now, text: t("fb.raidRetreated", state.language) }
      };
    }),
  returnToVillage: () =>
    set((state) => ({
      ...state,
      gameMode: "village",
      raidStatus: "idle",
      activeCampId: null,
      lastRaidReward: null,
      lastRaidPenalty: null,
      units: returnPlayerUnitsToVillage(state.units),
      lastProductionAt: Date.now(),
      feedback: { id: Date.now(), text: t("fb.returned", state.language) }
    })),
  queueWorker: (workerClass) =>
    set((state) => {
      if (state.gameStatus !== "playing" || !isWorkerClass(workerClass)) {
        return state;
      }
      const now = Date.now();
      const reconciled = reconcileWorkerProduction(
        state.workerProductionQueue,
        state.idleWorkers,
        now
      );
      const capacity = workerCapacity(buildingLevel(state.buildings, "workerShelter"));
      if (
        managedWorkerCount(
          reconciled.queue,
          reconciled.idleWorkers,
          state.workerExpeditions
        ) >= capacity
      ) {
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers,
          feedback: { id: now, text: t("worker.capacityFull", state.language) }
        };
      }
      const definition = WORKER_CLASSES[workerClass];
      if (!hasResources(state.resources, definition.cost)) {
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers,
          feedback: {
            id: now,
            text: t("fb.needCost", state.language, {
              name: t(`worker.${workerClass}.name`, state.language),
              cost: costText(definition.cost)
            })
          }
        };
      }
      workerSerial += 1;
      const startedAt = Math.max(
        now,
        reconciled.queue[reconciled.queue.length - 1]?.finishesAt ?? now
      );
      const item: WorkerProductionItem = {
        id: `worker-production-${now}-${workerSerial}`,
        workerId: `worker-${now}-${workerSerial}`,
        workerClass,
        startedAt,
        finishesAt: startedAt + definition.productionMs
      };
      return {
        ...state,
        resources: spendResources(state.resources, definition.cost),
        workerProductionQueue: [...reconciled.queue, item],
        idleWorkers: reconciled.idleWorkers,
        questProgress: bumpQuest(state.questProgress, "trainAny"),
        feedback: {
          id: now,
          text: t("worker.queued", state.language, {
            name: t(`worker.${workerClass}.name`, state.language)
          })
        }
      };
    }),
  sendWorkerExpedition: (workerId, resource) =>
    set((state) => {
      if (
        state.gameStatus !== "playing" ||
        typeof workerId !== "string" ||
        !isWorkerResource(resource)
      ) {
        return state;
      }
      const now = Date.now();
      const reconciled = reconcileWorkerProduction(
        state.workerProductionQueue,
        state.idleWorkers,
        now
      );
      const worker = reconciled.idleWorkers.find((entry) => entry.id === workerId);
      if (!worker) {
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers
        };
      }
      workerSerial += 1;
      const expedition = createWorkerExpedition(
        `worker-expedition-${now}-${workerSerial}`,
        worker,
        resource,
        now,
        productionLevelMultiplier(
          buildingLevel(
            state.buildings,
            resource === "bananas"
              ? "bananaGrove"
              : resource === "stones"
                ? "stoneQuarry"
                : "lumberCamp"
          )
        )
      );
      return {
        ...state,
        workerProductionQueue: reconciled.queue,
        idleWorkers: reconciled.idleWorkers.filter((entry) => entry.id !== workerId),
        workerExpeditions: [...state.workerExpeditions, expedition],
        questProgress: bumpQuest(state.questProgress, "workShift"),
        feedback: {
          id: now,
          text: t("worker.expeditionSent", state.language, {
            name: t(`worker.${worker.workerClass}.name`, state.language),
            resource: t(`res.${resource}`, state.language)
          })
        }
      };
    }),
  collectWorkerExpedition: (expeditionId) => {
    let summary: WorkerCollectionSummary | null = null;
    set((state) => {
      const now = Date.now();
      const expedition = state.workerExpeditions.find(
        (entry) => entry.id === expeditionId
      );
      if (!expedition || expeditionStatus(expedition, now) !== "completed") {
        return state;
      }
      const resources = { ...state.resources };
      const before = resources[expedition.resource];
      addResourcesCapped(
        resources,
        { [expedition.resource]: expedition.reward },
        storageCap(buildingLevel(state.buildings, "clanHall"))
      );
      const collected = Math.max(0, resources[expedition.resource] - before);
      summary = {
        expeditionId: expedition.id,
        workerClass: expedition.workerClass,
        resource: expedition.resource,
        expectedReward: expedition.expectedReward,
        reward: expedition.reward,
        collected,
        outcome: expedition.outcome
      };
      return {
        ...state,
        resources,
        workerExpeditions: state.workerExpeditions.filter(
          (entry) => entry.id !== expedition.id
        ),
        feedback: {
          id: now,
          text: t("worker.collected", state.language, {
            amount: Math.floor(collected),
            resource: t(`res.${expedition.resource}`, state.language)
          })
        }
      };
    });
    return summary;
  },
  claimQuest: (id: string) =>
    set((state) => {
      const quest = QUESTS.find((entry) => entry.id === id);
      if (
        !quest ||
        state.questsClaimed.includes(id) ||
        !isQuestComplete(state.questProgress, quest)
      ) {
        return state;
      }
      const now = Date.now();
      const resources = { ...state.resources };
      addResourcesCapped(
        resources,
        quest.reward,
        storageCap(buildingLevel(state.buildings, "clanHall"))
      );
      return {
        ...state,
        resources,
        gems: state.gems + (quest.reward.gems ?? 0),
        questsClaimed: [...state.questsClaimed, id],
        feedback: { id: now, text: t("fb.questClaimed", state.language) }
      };
    }),
  dismissOfflineReport: () => set(() => ({ offlineReport: null })),
  buyShopItem: (id: string) =>
    set((state) => {
      const item = SHOP_ITEMS.find((entry) => entry.id === id);
      if (!item) {
        return state;
      }
      if (state.gems < item.gemCost) {
        return { ...state, feedback: { id: Date.now(), text: t("fb.needGems", state.language) } };
      }
      const now = Date.now();
      const cap = storageCap(buildingLevel(state.buildings, "clanHall"));
      // Never let gems buy resources the depot can't hold — block instead
      // of silently eating a paid pack.
      const overflows = (["bananas", "stones", "wood"] as const).some(
        (key) => state.resources[key] + (item.reward[key] ?? 0) > cap
      );
      if (overflows) {
        return { ...state, feedback: { id: now, text: t("fb.storageFull", state.language) } };
      }
      return {
        ...state,
        gems: state.gems - item.gemCost,
        resources: {
          bananas: state.resources.bananas + (item.reward.bananas ?? 0),
          stones: state.resources.stones + (item.reward.stones ?? 0),
          wood: state.resources.wood + (item.reward.wood ?? 0)
        },
        feedback: { id: now, text: t("shop.bought", state.language) }
      };
    }),
  unlockProfileMonkey: (id) => {
    let result: ProfileMonkeyUnlockResult = "invalid";
    set((state) => {
      const monkey = getProfileMonkey(id);
      if (!monkey) {
        result = "invalid";
        return state;
      }
      if (state.unlockedProfileMonkeys.includes(id)) {
        result = "owned";
        return state;
      }
      if (state.gems < monkey.price) {
        result = "insufficient";
        return state;
      }

      const next: GameState = {
        ...state,
        gems: Math.max(0, state.gems - monkey.price),
        unlockedProfileMonkeys: [...state.unlockedProfileMonkeys, id],
        ownedProfileSkins: Array.from(
          new Set([...state.ownedProfileSkins, getDefaultSkinId(id)])
        ),
        newProfileMonkeys: [...state.newProfileMonkeys, id],
        newProfileSkins: Array.from(
          new Set([...state.newProfileSkins, getDefaultSkinId(id)])
        )
      };
      result = "unlocked";
      void persistVillage(next);
      return next;
    });
    return result;
  },
  equipProfileMonkey: (id) =>
    set((state) => {
      const defaultSkinId = getDefaultSkinId(id);
      if (
        !state.unlockedProfileMonkeys.includes(id) ||
        !getProfileMonkey(id) ||
        (state.equippedProfileMonkey === id && state.equippedProfileSkin === defaultSkinId)
      ) {
        return state;
      }
      const next: GameState = {
        ...state,
        equippedProfileMonkey: id,
        equippedProfileSkin: defaultSkinId
      };
      void persistVillage(next);
      return next;
    }),
  unlockProfileSkin: (id) => {
    let result: ProfileMonkeyUnlockResult = "invalid";
    set((state) => {
      const skin = getProfileSkin(id);
      if (!skin) {
        result = "invalid";
        return state;
      }
      if (!state.unlockedProfileMonkeys.includes(skin.monkeyId)) {
        result = "requires_monkey";
        return state;
      }
      if (state.ownedProfileSkins.includes(id)) {
        result = "owned";
        return state;
      }
      if (state.gems < skin.price) {
        result = "insufficient";
        return state;
      }
      const next: GameState = {
        ...state,
        gems: Math.max(0, state.gems - skin.price),
        ownedProfileSkins: [...state.ownedProfileSkins, id],
        newProfileSkins: [...state.newProfileSkins, id]
      };
      result = "unlocked";
      void persistVillage(next);
      return next;
    });
    return result;
  },
  equipProfileSkin: (id) =>
    set((state) => {
      const skin = getProfileSkin(id);
      if (
        !skin ||
        !state.ownedProfileSkins.includes(id) ||
        !state.unlockedProfileMonkeys.includes(skin.monkeyId) ||
        (state.equippedProfileMonkey === skin.monkeyId && state.equippedProfileSkin === id)
      ) {
        return state;
      }
      const next: GameState = {
        ...state,
        equippedProfileMonkey: skin.monkeyId,
        equippedProfileSkin: id
      };
      void persistVillage(next);
      return next;
    }),
  markProfileMonkeySeen: (id) =>
    set((state) => {
      if (!state.newProfileMonkeys.includes(id)) return state;
      const next = {
        ...state,
        newProfileMonkeys: state.newProfileMonkeys.filter((entry) => entry !== id)
      };
      void persistVillage(next);
      return next;
    }),
  markProfileSkinSeen: (id) =>
    set((state) => {
      if (!state.newProfileSkins.includes(id)) return state;
      const next = {
        ...state,
        newProfileSkins: state.newProfileSkins.filter((entry) => entry !== id)
      };
      void persistVillage(next);
      return next;
    }),
  claimDaily: () =>
    set((state) => {
      const today = todayKey();
      if (state.dailyLastClaim === today) {
        return state;
      }
      // Next streak day if claimed yesterday; reset to day 1 if a day slipped.
      const consecutive =
        state.dailyLastClaim != null && dayDiff(state.dailyLastClaim, today) === 1;
      const day = consecutive ? (state.dailyStreak % DAILY_REWARDS.length) + 1 : 1;
      const reward = DAILY_REWARDS[day - 1] ?? {};
      const now = Date.now();
      const resources = { ...state.resources };
      addResourcesCapped(
        resources,
        reward,
        storageCap(buildingLevel(state.buildings, "clanHall"))
      );
      return {
        ...state,
        resources,
        gems: state.gems + (reward.gems ?? 0),
        dailyStreak: day,
        dailyLastClaim: today,
        feedback: { id: now, text: t("daily.claimed", state.language) }
      };
    }),
  trainFighter: () => set((state) => createPlayerUnit(state, "fighter")),
  trainArcher: () => set((state) => createPlayerUnit(state, "archer")),
  trainGuardian: () => set((state) => createPlayerUnit(state, "guardian")),
  rushProduction: () =>
    set((state) => {
      if (state.productionQueue.length === 0) {
        return state;
      }
      if (state.gems < RUSH_GEM_COST) {
        return { ...state, feedback: { id: Date.now(), text: t("fb.needGems", state.language) } };
      }
      const now = Date.now();
      return {
        ...state,
        gems: state.gems - RUSH_GEM_COST,
        productionQueue: state.productionQueue.map((item) => ({ ...item, finishAt: now })),
        feedback: { id: now, text: t("fb.rushed", state.language) }
      };
    }),
  reconcileWorkTask: (now = Date.now()) =>
    set((state) => {
      if (state.gameStatus !== "playing") {
        return state;
      }
      const reconciled = reconcileWorkerProduction(
        state.workerProductionQueue,
        state.idleWorkers,
        now
      );
      return {
        ...state,
        workerProductionQueue: reconciled.queue,
        idleWorkers: reconciled.idleWorkers,
        feedback: reconciled.completed.length > 0
          ? { id: now, text: t("worker.productionReady", state.language) }
          : state.feedback
      };
    }),
  tickGame: (now = Date.now()) =>
    set((state) => {
      if (state.gameStatus !== "playing") {
        return state;
      }

      const units = state.units.map(cloneUnit);
      const game: MutableGame = {
        units,
        resources: { ...state.resources },
        buildings: cloneBuildings(state.buildings),
        maxPopulation: state.maxPopulation,
        playerCampHp: state.playerCampHp,
        enemyCampHp: state.enemyCampHp,
        lang: state.language,
        feedbackText: null
      };

      // Worker production continues in every app mode. Expeditions only
      // become collectible here; rewards are never auto-claimed.
      const reconciledWorkers = reconcileWorkerProduction(
        state.workerProductionQueue,
        state.idleWorkers,
        now
      );
      const workerProductionQueue = reconciledWorkers.queue;
      const idleWorkers = reconciledWorkers.idleWorkers;
      if (reconciledWorkers.completed.length > 0) {
        game.feedbackText = t("worker.productionReady", state.language);
      }

      if (state.gameMode === "raid" && state.raidStatus === "active") {
        assignRaidOrders(units);

        for (const unit of units) {
          if (unit.owner === "enemy" || (unit.owner === "player" && isCombatant(unit))) {
            processUnit(unit, game, now, true);
          }
        }

        const raidFightersAlive = units.some(
          (unit) =>
            unit.owner === "player" && isCombatant(unit) && unit.state !== "dead" && unit.hp > 0
        );

        if (game.enemyCampHp <= 0) {
          const camp = getCamp(state.activeCampId ?? "");
          const baseLoot = camp ? camp.loot : RAID_REWARD;
          const previousVictories = camp
            ? state.raidVictoryCounts[camp.id] ?? 0
            : 0;
          const reward = resolveRaidVictoryReward(
            game.resources,
            baseLoot,
            storageCap(buildingLevel(state.buildings, "clanHall")),
            previousVictories
          );
          const { loot, multiplier: rewardMultiplier } = reward;
          const raidVictoryCounts = camp
            ? { ...state.raidVictoryCounts, [camp.id]: previousVictories + 1 }
            : state.raidVictoryCounts;
          const fighters = units.filter(
            (unit) => unit.owner === "player" && isCombatant(unit)
          );
          const aliveCount = fighters.filter(
            (unit) => unit.state !== "dead" && unit.hp > 0
          ).length;
          const stars =
            fighters.length > 0 && aliveCount === fighters.length
              ? 3
              : aliveCount >= Math.ceil(fighters.length / 2)
                ? 2
                : 1;

          return {
            ...state,
            units: game.units,
            resources: reward.resources,
            workerProductionQueue,
            idleWorkers,
            enemyCampHp: 0,
            raidStars: stars,
            raidVictoryCounts,
            lastRaidReward: { loot, multiplier: rewardMultiplier },
            gems: state.gems + stars,
            questProgress: bumpQuest(state.questProgress, "winRaid"),
            lastRaidPenalty: null,
            feedback: {
              id: now,
              text: t("fb.victoryLoot", state.language, {
                b: loot.bananas,
                s: loot.stones,
                w: loot.wood
              })
            },
            raidStatus: "victory",
            raidLevel:
              state.activeCampId === `stronghold-${state.raidLevel}`
                ? state.raidLevel + 1
                : state.raidLevel
          };
        }

        if (!raidFightersAlive) {
          const penalized = applyRaidPenalty(game.resources, "defeat");
          return {
            ...state,
            units: game.units,
            resources: penalized.resources,
            workerProductionQueue,
            idleWorkers,
            enemyCampHp: game.enemyCampHp,
            feedback: { id: now, text: t("fb.raidFailed", state.language) },
            raidStatus: "defeat",
            lastRaidPenalty: { reason: "defeat", amounts: penalized.amounts }
          };
        }

        return {
          ...state,
          units: game.units,
          resources: game.resources,
          workerProductionQueue,
          idleWorkers,
          enemyCampHp: game.enemyCampHp,
          feedback: game.feedbackText ? { id: now, text: game.feedbackText } : state.feedback
        };
      }

      for (const unit of units) {
        if (unit.owner === "player") {
          processUnit(unit, game, now);
        }
      }

      // Live elapsed time is still used for village healing.
      const elapsedSeconds = Math.max(0, (now - state.lastProductionAt) / 1000);

      // Units wounded in raids slowly heal while home in the village.
      for (const unit of game.units) {
        if (unit.owner === "player" && unit.state !== "dead" && unit.hp > 0 && unit.hp < unit.maxHp) {
          unit.hp = Math.min(unit.maxHp, unit.hp + VILLAGE_REGEN_PER_SEC * elapsedSeconds);
        }
      }

      // Complete finished production-queue items into the village.
      let productionQueue = state.productionQueue;
      const ready = productionQueue.filter((item) => item.finishAt <= now);
      if (ready.length > 0) {
        for (const item of ready) {
          unitSerial += 1;
          const spawn = findSpawnPosition(game.units, "player");
          const combatStats = sanitizeCombatStats(
            item.combatStats,
            unitCombatStats(
              item.type,
              buildingLevel(game.buildings, "trainingNest")
            )
          );
          game.units.push(
            createUnit(
              `player-${item.type}-${now}-${unitSerial}`,
              item.type,
              "player",
              spawn.x,
              spawn.y,
              now,
              combatStats
            )
          );
        }
        productionQueue = productionQueue.filter((item) => item.finishAt > now);
        const lastType = ready[ready.length - 1]?.type ?? "fighter";
        game.feedbackText = t(`fb.trained.${lastType}`, state.language);
      }

      const playerUnitsAlive = units.some(
        (unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0
      );
      const canRecover =
        managedWorkerCount(
          workerProductionQueue,
          idleWorkers,
          state.workerExpeditions
        ) > 0 ||
        hasResources(game.resources, WORKER_CLASSES.gatherer.cost) ||
        buildingLevel(state.buildings, "trainingNest") > 0 &&
        hasResources(
          game.resources,
          unitCost("fighter", buildingLevel(state.buildings, "trainingNest"))
        );
      const feedback = game.feedbackText
        ? { id: now, text: game.feedbackText }
        : state.feedback;
      const nextGame = {
        units: game.units,
        resources: game.resources,
        buildings: game.buildings,
        maxPopulation: game.maxPopulation,
        playerCampHp: game.playerCampHp,
        enemyCampHp: game.enemyCampHp,
        productionQueue,
        workerProductionQueue,
        idleWorkers,
        lastProductionAt: now
      };

      if (game.playerCampHp <= 0 || (!playerUnitsAlive && !canRecover)) {
        return {
          ...state,
          ...nextGame,
          feedback,
          currentScreen: "result",
          gameStatus: "defeat"
        };
      }

      return {
        ...state,
        ...nextGame,
        feedback
      };
    }),
  resetGame: () => {
    // Hard reset: wipe the saved village and start a brand new one.
    void AsyncStorage.removeItem(SAVE_KEY);
    set(() => ({
      ...createFreshState(Date.now()),
      currentScreen: "game",
      gameStatus: "playing",
      gameMode: "village",
      raidStatus: "idle"
    }));
  },
  goToMenu: () =>
    set(() => ({
      // Keep the village in memory; just return to the menu.
      currentScreen: "menu",
      gameStatus: "menu",
      gameMode: "village",
      raidStatus: "idle",
      feedback: null
    }))
}));

// Persist the village (buildings/resources/population/language).
function persistVillage(state: GameState) {
  // Persist exact living-unit stats and wounds so Nest upgrades and reloads
  // cannot retroactively alter already-trained troops.
  const unitRoster: PersistedUnit[] = [];
  for (const unit of state.units) {
    if (
      unit.owner === "player" &&
      unit.type !== "worker" &&
      unit.state !== "dead" &&
      unit.hp > 0
    ) {
      unitRoster.push({
        type: unit.type,
        hp: unit.hp,
        maxHp: unit.maxHp,
        attack: unit.attack,
        range: unit.range
      });
    }
  }

  const payload: VillageSave = {
    buildings: state.buildings,
    resources: state.resources,
    maxPopulation: state.maxPopulation,
    unitRoster,
    gems: state.gems,
    unlockedProfileMonkeys: state.unlockedProfileMonkeys,
    equippedProfileMonkey: state.equippedProfileMonkey,
    ownedProfileSkins: state.ownedProfileSkins,
    equippedProfileSkin: state.equippedProfileSkin,
    newProfileMonkeys: state.newProfileMonkeys,
    newProfileSkins: state.newProfileSkins,
    productionQueue: state.productionQueue,
    workerProductionQueue: state.workerProductionQueue,
    idleWorkers: state.idleWorkers,
    workerExpeditions: state.workerExpeditions,
    language: state.language,
    raidLevel: state.raidLevel,
    raidVictoryCounts: state.raidVictoryCounts,
    questProgress: state.questProgress,
    questsClaimed: state.questsClaimed,
    dailyStreak: state.dailyStreak,
    dailyLastClaim: state.dailyLastClaim,
    lastSeenAt: Date.now()
  };
  return AsyncStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

/** Flushes the latest reconciled village snapshot before the app is suspended. */
export function flushVillageSave() {
  const state = useGameStore.getState();
  if (state.gameStatus !== "playing") {
    return Promise.resolve();
  }
  return persistVillage(state);
}

// Save as the village changes, throttled.
let lastSaveAt = 0;
useGameStore.subscribe((state) => {
  if (state.gameStatus !== "playing") {
    return;
  }
  const now = Date.now();
  if (now - lastSaveAt < 3000) {
    return;
  }
  lastSaveAt = now;
  void persistVillage(state);
});
