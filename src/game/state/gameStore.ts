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
  PRODUCTION_SLOTS,
  RAID_REWARD,
  RUSH_GEM_COST,
  STARTING_RESOURCES,
  VILLAGE_REGEN_PER_SEC,
  WATCH_TOWER_DAMAGE_REDUCTION,
  WORKER_PRODUCTION_DURATION_MS,
  unitCombatStats,
  unitCost
} from "../config/constants";
import {
  DEFAULT_BUILDINGS,
  buildingName,
  productionLevelMultiplier,
  storageCap,
  storageCanHoldCost,
  upgradeCost,
  workerLodgeUpgrade
} from "../config/buildings";
import { STRONGHOLD_BASE_LEVEL, getCamp, campName, type RaidCamp } from "../config/camps";
import {
  TROOPS,
  TROOP_TYPES,
  armyCapacity,
  armyHousing,
  calculateTroopPower,
  isLivingPlayerTroop,
  isTroopType,
  migrateTroopType,
  sanitizeTroopUpgrades,
  summarizeRaidArmy,
  trainingFinishAt,
  troopUpgradeCost,
  troopUpgradeRequirement
} from "../config/troops";
import { DAILY_REWARDS, nextDailyRewardDay, resolveDailyReward, todayKey } from "../config/dailyRewards";
import { QUESTS, isQuestComplete, resolveQuestReward } from "../config/quests";
import {
  festivalFragmentRequirement,
  normalizeFestivalSeed,
  prepareFestivalChestOpen,
  sanitizeFestivalFragments,
  sanitizeFestivalTransaction
} from "../config/festivalCollection";
import {
  DEFAULT_PROFILE_MONKEY_ID,
  DEFAULT_PROFILE_SKIN_ID,
  FESTIVAL_PROFILE_SKINS,
  canEquipProfileSkin,
  getDefaultSkinId,
  getProfileMonkey,
  getProfileSkin,
  isActiveProfileSkin,
  sanitizeEquippedProfileMonkey,
  sanitizeEquippedProfileSkin,
  sanitizeNewProfileMonkeys,
  sanitizeNewProfileSkins,
  sanitizeOwnedProfileSkins,
  sanitizeUnlockedProfileMonkeys
} from "../config/profileMonkeys";
import { getResourceShopItem, resourceShopCapacityIssues } from "../config/shop";
import { t } from "../i18n";
import { createInitialMap, createInitialUnits, createUnit } from "../config/map";
import { applyRaidPenalty } from "./raidPenalty";
import {
  raidGemReward,
  resolveRaidVictoryReward,
  sanitizeRaidVictoryCounts
} from "./raidRewards";
import {
  WORKER_CLASSES,
  WORKER_MISSIONS,
  BANANA_GROVE_MAX_WORKERS,
  bananaGroveCapacity,
  createLumberExpedition,
  createStoneExpedition,
  createWorkerExpedition,
  expeditionStatus,
  isWorkerClass,
  isLumberMissionTier,
  isLumberWorkerClass,
  isStoneWorkerClass,
  isWorkerResource,
  managedWorkerCount,
  reconcileWorkerProduction,
  reconcileBananaGrove,
  reconcileLumberCamp,
  reconcileStoneQuarry,
  lumberCampCapacity,
  sanitizeBananaGroveStorage,
  sanitizeLumberCampStorage,
  sanitizeStoneQuarryStorage,
  sanitizeIdleWorkers,
  sanitizeWorkerExpeditions,
  sanitizeWorkerProductionQueue,
  stoneQuarryCapacity,
  workerCapacity
} from "./workerExpeditions";
import {
  reconcileWorkerLodgeUpgrade,
  sanitizeWorkerLodgeUpgrade
} from "./workerLodgeUpgrades";
import type {
  GameState,
  FestivalChestOpenResult,
  FestivalChestTransaction,
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
  BananaGroveCollectionSummary,
  LumberCampCollectionSummary,
  LumberWorkerClass,
  StoneQuarryCollectionSummary,
  StoneWorkerClass,
  TroopType,
  TroopUpgradeLevels,
  TroopUpgradeStat,
  WorkerCollectionSummary,
  WorkerProductionItem
} from "../types/game";

// Daily per-metric mission counter (immutably bumped by +1).
function bumpQuest(
  progress: Partial<Record<QuestMetric, number>>,
  metric: QuestMetric
): Partial<Record<QuestMetric, number>> {
  return { ...progress, [metric]: (progress[metric] ?? 0) + 1 };
}

function advanceDailyMission(
  state: Pick<GameState, "questProgress" | "questsClaimed" | "questDayKey">,
  metric: QuestMetric,
  now = Date.now()
) {
  const day = todayKey(now);
  const currentDay = state.questDayKey === day;
  return {
    questProgress: bumpQuest(currentDay ? state.questProgress : {}, metric),
    questsClaimed: currentDay ? state.questsClaimed : [],
    questDayKey: day
  };
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
  playerCampHp: number;
  enemyCampHp: number;
  lang: Lang;
  feedbackText: string | null;
};

function buildingLevel(buildings: VillageBuilding[], type: VillageBuildingType) {
  return buildings.find((building) => building.type === type)?.level ?? 0;
}

function normalizeUnitType(value: unknown): UnitType | null {
  if (value === "worker") {
    return "worker";
  }
  return migrateTroopType(value);
}

function sanitizeCombatStats(
  type: UnitType,
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

  const stats = {
    maxHp: Math.max(1, Math.round(value.maxHp)),
    attack: Math.max(0, Math.round(value.attack)),
    range: Math.max(1, Math.round(value.range)),
    attackIntervalMs: Number.isFinite(value.attackIntervalMs)
      ? Math.max(250, Math.round(value.attackIntervalMs))
      : fallback.attackIntervalMs,
    moveIntervalMs: Number.isFinite(value.moveIntervalMs)
      ? Math.max(150, Math.round(value.moveIntervalMs))
      : fallback.moveIntervalMs,
    resistance: Number.isFinite(value.resistance)
      ? Math.min(0.75, Math.max(0, value.resistance))
      : fallback.resistance,
    armorPenetration: Number.isFinite(value.armorPenetration)
      ? Math.min(0.9, Math.max(0, value.armorPenetration))
      : fallback.armorPenetration
  };
  return {
    ...stats,
    power: isTroopType(type) ? calculateTroopPower(type, stats) : 0
  };
}

function normalizeProductionQueue(
  queue: ProductionItem[] | undefined,
  nestLevel: number,
  now: number,
  upgrades: TroopUpgradeLevels
) {
  return (queue ?? [])
    .map((item, index) => {
      const type = normalizeUnitType(item?.type);
      if (!type || type === "worker") {
        return null;
      }
      return {
        id: typeof item.id === "string" ? item.id : `migrated-prod-${now}-${index}`,
        type,
        finishAt: Number.isFinite(item.finishAt) ? item.finishAt : now,
        combatStats: sanitizeCombatStats(
          type,
          item.combatStats,
          unitCombatStats(type, nestLevel, upgrades)
        )
      } satisfies ProductionItem;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

// Units that fight in a raid (as opposed to workers).
function isCombatant(unit: Unit) {
  return isTroopType(unit.type);
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
    gems: 0,
    unlockedProfileMonkeys: [DEFAULT_PROFILE_MONKEY_ID] as ProfileMonkeyId[],
    equippedProfileMonkey: DEFAULT_PROFILE_MONKEY_ID,
    ownedProfileSkins: [DEFAULT_PROFILE_SKIN_ID] as ProfileSkinId[],
    equippedProfileSkin: DEFAULT_PROFILE_SKIN_ID,
    newProfileMonkeys: [] as ProfileMonkeyId[],
    newProfileSkins: [] as ProfileSkinId[],
    festivalFragments: {},
    festivalChestRngSeed: normalizeFestivalSeed(now),
    pendingFestivalChest: null as FestivalChestTransaction | null,
    claimedFestivalChest: null as FestivalChestTransaction | null,
    productionQueue: [] as ProductionItem[],
    troopUpgrades: sanitizeTroopUpgrades(undefined),
    workerProductionQueue: [] as WorkerProductionItem[],
    idleWorkers: [],
    workerExpeditions: [],
    bananaGroveStorage: 0,
    lumberCampStorage: 0,
    stoneQuarryStorage: 0,
    activeWorkerLodgeUpgrade: null,
    playerCampHp: CAMP_MAX_HP,
    enemyCampHp: CAMP_MAX_HP,
    enemyCampMaxHp: CAMP_MAX_HP,
    activeCampId: null,
    raidStars: 0,
    raidLevel: STRONGHOLD_BASE_LEVEL,
    raidVictoryCounts: {} as Record<string, number>,
    lastRaidReward: null,
    lastRaidPenalty: null,
    lastRaidArmyResult: null,
    questProgress: {} as Partial<Record<QuestMetric, number>>,
    questsClaimed: [] as string[],
    questDayKey: todayKey(),
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
  if (now - unit.lastStepAt < (unit.moveIntervalMs || MOVE_INTERVAL_MS)) {
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
    (unit) => unit.owner === "player" && isCombatant(unit) && unit.state !== "dead" && unit.hp > 0
  );
  let closest: Unit | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const player of playerUnits) {
    const range = distance(enemy, player);
    const guardianPriority = player.type === "shield_guardian" ? -2 : 0;
    const score = range + guardianPriority;
    if (range <= ENEMY_DETECTION_RANGE && score < closestDistance) {
      closest = player;
      closestDistance = score;
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

function damageUnit(units: Unit[], unitId: string, amount: number, armorPenetration = 0) {
  const target = units.find((unit) => unit.id === unitId);
  if (!target || target.state === "dead") {
    return;
  }

  const effectiveResistance = Math.max(0, target.resistance - armorPenetration);
  const damage = Math.max(1, Math.round(amount * (1 - effectiveResistance)));
  target.hp = Math.max(0, target.hp - damage);
  if (target.hp <= 0) {
    target.state = "dead";
    target.target = undefined;
    target.gatherTarget = undefined;
    target.carriedResource = null;
  }
}

function processAttacking(unit: Unit, game: MutableGame, now: number) {
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

  if (now - unit.lastActionAt < (unit.attackIntervalMs || ATTACK_INTERVAL_MS)) {
    return;
  }

  const attack = unit.attack;

  if (unit.target.kind === "unit") {
    damageUnit(game.units, unit.target.unitId, attack, unit.armorPenetration);
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

function processUnit(unit: Unit, game: MutableGame, now: number) {
  if (unit.state === "dead" || unit.hp <= 0) {
    unit.state = "dead";
    return;
  }

  if (unit.state === "attacking") {
    processAttacking(unit, game, now);
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
  { x: 9, y: 4 },
  { x: 6, y: 3 },
  { x: 8, y: 5 },
  { x: 7, y: 4 },
  { x: 6, y: 4 },
  { x: 9, y: 5 },
  { x: 7, y: 5 }
];

function createRaidEnemies(now: number, camp: RaidCamp): Unit[] {
  const types = TROOP_TYPES.flatMap((type) =>
    Array.from({ length: camp.defenders[type] }, () => type)
  );
  return types.map((type, index) => {
    const spot = ENEMY_DEPLOY_SPOTS[index % ENEMY_DEPLOY_SPOTS.length] ?? { x: 8, y: 2 };
    const unit = createUnit(
      `raid-enemy-${index}-${now}`,
      type,
      "enemy",
      spot.x,
      spot.y,
      now
    );
    const hpFactor = type === "shield_guardian" ? 1.7 : type === "crossbowman" ? 1.15 : type === "archer" ? 0.78 : 1;
    const attackFactor = type === "crossbowman" ? 1.65 : type === "archer" ? 0.85 : type === "shield_guardian" ? 0.7 : 1;
    unit.hp = Math.round(camp.enemyHp * hpFactor);
    unit.maxHp = unit.hp;
    unit.attack = Math.round(camp.enemyAttack * attackFactor);
    unit.range = type === "crossbowman" ? 4 : type === "archer" ? 3 : 1;
    unit.resistance = type === "shield_guardian" ? 0.22 : type === "crossbowman" ? 0.06 : 0;
    unit.armorPenetration = type === "crossbowman" ? 0.3 : 0;
    unit.attackIntervalMs = type === "crossbowman" ? 1_350 : type === "archer" ? 720 : type === "shield_guardian" ? 1_100 : 850;
    unit.moveIntervalMs = type === "shield_guardian" ? 520 : type === "crossbowman" ? 410 : type === "archer" ? 300 : 340;
    unit.power = calculateTroopPower(type, unit);
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
    .filter(isLivingPlayerTroop)
    .map((unit) => {
      const slot = playerIndex;
      playerIndex += 1;

      return {
        ...unit,
        x: PLAYER_CAMP.x + (slot % 2),
        y: PLAYER_CAMP.y - 1 + Math.floor(slot / 2),
        state: "idle" as const,
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
    const priority = attacker.type === "crossbowman"
      ? range - Math.min(3, unit.maxHp / 80)
      : range;
    if (priority < closestDistance) {
      closest = unit;
      closestDistance = priority;
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

function createPlayerUnit(state: GameState, type: TroopType) {
  if (state.gameStatus !== "playing") {
    return state;
  }

  const unitLabel = t(`unit.${type}`, state.language);

  const nestLevel = buildingLevel(state.buildings, "trainingNest");
  if (nestLevel < TROOPS[type].unlockLevel) {
    return {
      ...state,
      feedback: {
        id: Date.now(),
        text: t("trainingNest.lockedFeedback", state.language, { level: TROOPS[type].unlockLevel })
      }
    };
  }

  if (state.productionQueue.length >= PRODUCTION_SLOTS) {
    return {
      ...state,
      feedback: { id: Date.now(), text: t("fb.queueFull", state.language) }
    };
  }

  const queuedTroops = state.productionQueue
    .map((item) => item.type)
    .filter(isTroopType);
  const usedHousing = armyHousing(state.units, queuedTroops);
  if (usedHousing + TROOPS[type].housing > armyCapacity(nestLevel)) {
    return {
      ...state,
      feedback: { id: Date.now(), text: t("fb.capacityFull", state.language) }
    };
  }

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
    finishAt: trainingFinishAt(state.productionQueue, type, now),
    combatStats: unitCombatStats(type, nestLevel, state.troopUpgrades)
  };

  return {
    ...state,
    resources: spendResources(state.resources, cost),
    productionQueue: [...state.productionQueue, queueItem],
    ...advanceDailyMission(state, "trainAny", now),
    feedback: { id: now, text: t(`fb.queued.${type}`, state.language) }
  };
}

function upgradeTroopStat(
  state: GameState,
  type: TroopType,
  stat: TroopUpgradeStat
): GameState {
  if (!TROOPS[type].upgradeStats.includes(stat)) {
    return state;
  }
  const now = Date.now();
  const currentLevel = state.troopUpgrades[type]?.[stat] ?? 0;
  if (currentLevel >= 5) {
    return { ...state, feedback: { id: now, text: t("trainingNest.upgradeMax", state.language) } };
  }
  const nextLevel = currentLevel + 1;
  const requiredNestLevel = troopUpgradeRequirement(type, currentLevel);
  if (buildingLevel(state.buildings, "trainingNest") < requiredNestLevel) {
    return {
      ...state,
      feedback: {
        id: now,
        text: t("trainingNest.upgradeLocked", state.language, { level: requiredNestLevel })
      }
    };
  }
  const cost = troopUpgradeCost(type, stat, nextLevel);
  if (!hasResources(state.resources, cost)) {
    return {
      ...state,
      feedback: {
        id: now,
        text: t("fb.needCost", state.language, {
          name: t(`unit.${type}`, state.language),
          cost: costText(cost)
        })
      }
    };
  }
  return {
    ...state,
    resources: spendResources(state.resources, cost),
    troopUpgrades: {
      ...state.troopUpgrades,
      [type]: { ...state.troopUpgrades[type], [stat]: nextLevel }
    },
    feedback: {
      id: now,
      text: t("trainingNest.upgradeComplete", state.language, {
        name: t(`unit.${type}`, state.language),
        level: nextLevel
      })
    }
  };
}

function upgradeVillageBuilding(state: GameState, type: VillageBuildingType): GameState {
  if (state.gameStatus !== "playing") {
    return state;
  }

  const level = buildingLevel(state.buildings, type);
  const name = buildingName(type, state.language);

  if (type === "workerShelter") {
    const now = Date.now();
    const definition = workerLodgeUpgrade(level);
    if (!definition) {
      return {
        ...state,
        feedback: { id: now, text: t("workerLodge.maxLevel", state.language) }
      };
    }
    if (state.activeWorkerLodgeUpgrade) {
      return {
        ...state,
        feedback: { id: now, text: t("workerLodge.upgradeAlreadyActive", state.language) }
      };
    }
    const clanLevel = buildingLevel(state.buildings, "clanHall");
    if (clanLevel < definition.requiredClanHallLevel) {
      return {
        ...state,
        feedback: {
          id: now,
          text: t("workerLodge.needClanLevel", state.language, {
            level: definition.requiredClanHallLevel
          })
        }
      };
    }
    const cap = storageCap(clanLevel);
    if (!storageCanHoldCost(cap, definition.cost)) {
      return {
        ...state,
        feedback: {
          id: now,
          text: t("workerLodge.needStorage", state.language, { amount: cap })
        }
      };
    }
    if (!hasResources(state.resources, definition.cost)) {
      return {
        ...state,
        feedback: {
          id: now,
          text: t("fb.needCost", state.language, {
            name,
            cost: costText(definition.cost)
          })
        }
      };
    }
    return {
      ...state,
      resources: spendResources(state.resources, definition.cost),
      activeWorkerLodgeUpgrade: {
        fromLevel: level,
        targetLevel: definition.targetLevel,
        startedAt: now,
        endsAt: now + definition.durationMs,
        cost: { ...definition.cost },
        requiredClanHallLevel: definition.requiredClanHallLevel
      },
      ...advanceDailyMission(state, "upgradeAny", now),
      feedback: {
        id: now,
        text: t("workerLodge.upgradeStarted", state.language, {
          level: definition.targetLevel
        })
      }
    };
  }

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
  return {
    ...state,
    buildings,
    resources: spendResources(state.resources, cost),
    ...advanceDailyMission(state, "upgradeAny", now),
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
      lastRaidArmyResult: null,
      lastProductionAt: Date.now(),
      feedback: null
    })),
  hydrate: (save: VillageSave) =>
    set((state) => {
      const now = Date.now();
      const levels = new Map(save.buildings.map((building) => [building.type, building.level]));
      let buildings = DEFAULT_BUILDINGS.map((building) => ({
        type: building.type,
        level: levels.get(building.type) ?? building.level
      }));
      const savedWorkerLodgeUpgrade = sanitizeWorkerLodgeUpgrade(
        save.activeWorkerLodgeUpgrade,
        buildingLevel(buildings, "workerShelter")
      );
      const reconciledWorkerLodgeUpgrade = reconcileWorkerLodgeUpgrade(
        buildings,
        savedWorkerLodgeUpgrade,
        now
      );
      buildings = reconciledWorkerLodgeUpgrade.buildings;
      const cap = storageCap(buildingLevel(buildings, "clanHall"));

      const nestLevel = buildingLevel(buildings, "trainingNest");
      const troopUpgrades = sanitizeTroopUpgrades(save.troopUpgrades);

      // Current saves preserve each living unit's exact combat stats and HP.
      // Legacy permanent workers are migrated once into the Lodge's idle
      // roster; only combatants remain map/raid units.
      let units: Unit[] = [];
      let legacyWorkerCount = 0;
      if (Array.isArray(save.unitRoster)) {
        for (const savedUnit of save.unitRoster) {
          const type = normalizeUnitType(savedUnit?.type);
          if (!type) {
            continue;
          }
          if (type === "worker") {
            legacyWorkerCount += 1;
            continue;
          }
          const stats = sanitizeCombatStats(
            type,
            savedUnit,
            unitCombatStats(type, nestLevel, troopUpgrades)
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
            `player-${type}-${now}-${unitSerial}`,
            type,
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
        for (const [legacyType, count] of Object.entries(save.unitCounts)) {
          const type = normalizeUnitType(legacyType);
          if (!type) {
            continue;
          }
          const safeCount = Number.isFinite(count)
            ? Math.max(0, Math.floor(count ?? 0))
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
                unitCombatStats(type, nestLevel, troopUpgrades)
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
        now,
        troopUpgrades
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
            startedAt: Math.max(0, finishesAt - WORKER_PRODUCTION_DURATION_MS),
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
      const sanitizedWorkerExpeditions = sanitizeWorkerExpeditions(save.workerExpeditions);
      const groveCapacity = bananaGroveCapacity(buildingLevel(buildings, "bananaGrove"));
      const reconciledGrove = reconcileBananaGrove(
        sanitizedWorkerExpeditions,
        sanitizeBananaGroveStorage(save.bananaGroveStorage, groveCapacity),
        groveCapacity,
        now
      );
      const lumberCapacity = lumberCampCapacity(buildingLevel(buildings, "lumberCamp"));
      const reconciledLumber = reconcileLumberCamp(
        reconciledGrove.expeditions,
        sanitizeLumberCampStorage(save.lumberCampStorage, lumberCapacity),
        lumberCapacity,
        now
      );
      const stoneCapacity = stoneQuarryCapacity(buildingLevel(buildings, "stoneQuarry"));
      const reconciledStone = reconcileStoneQuarry(
        reconciledLumber.expeditions,
        sanitizeStoneQuarryStorage(save.stoneQuarryStorage, stoneCapacity),
        stoneCapacity,
        now
      );
      const workerExpeditions = reconciledStone.expeditions;
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
        unlockedProfileMonkeys,
        save.equippedProfileSkin
      );
      const baseOwnedProfileSkins = sanitizeOwnedProfileSkins(
        save.ownedProfileSkins,
        unlockedProfileMonkeys
      );
      const claimedFestivalChest = sanitizeFestivalTransaction(save.claimedFestivalChest);
      const savedPendingFestivalChest = sanitizeFestivalTransaction(save.pendingFestivalChest);
      const pendingFestivalChest = savedPendingFestivalChest?.id === claimedFestivalChest?.id
        ? null
        : savedPendingFestivalChest;
      let festivalFragments = sanitizeFestivalFragments(
        save.festivalFragments,
        baseOwnedProfileSkins
      );
      if (pendingFestivalChest) {
        festivalFragments = {
          ...festivalFragments,
          [pendingFestivalChest.skinId]: Math.max(
            festivalFragments[pendingFestivalChest.skinId] ?? 0,
            pendingFestivalChest.nextFragments
          )
        };
      }
      const completedFestivalSkins = FESTIVAL_PROFILE_SKINS
        .filter((skin) => (festivalFragments[skin.id] ?? 0) >= festivalFragmentRequirement(skin.id))
        .map((skin) => skin.id);
      const ownedProfileSkins = Array.from(
        new Set([...baseOwnedProfileSkins, ...completedFestivalSkins])
      );
      festivalFragments = sanitizeFestivalFragments(festivalFragments, ownedProfileSkins);
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
        gems: save.gems ?? state.gems,
        unlockedProfileMonkeys,
        equippedProfileMonkey,
        ownedProfileSkins,
        equippedProfileSkin,
        newProfileMonkeys,
        newProfileSkins,
        festivalFragments,
        festivalChestRngSeed: normalizeFestivalSeed(save.festivalChestRngSeed, state.festivalChestRngSeed),
        pendingFestivalChest,
        claimedFestivalChest,
        productionQueue,
        troopUpgrades,
        workerProductionQueue: reconciledWorkers.queue,
        idleWorkers: reconciledWorkers.idleWorkers,
        workerExpeditions,
        bananaGroveStorage: reconciledGrove.storage,
        lumberCampStorage: reconciledLumber.storage,
        stoneQuarryStorage: reconciledStone.storage,
        activeWorkerLodgeUpgrade: reconciledWorkerLodgeUpgrade.activeUpgrade,
        language: save.language ?? state.language,
        // Migration: older saves tracked the stronghold from Sv4; the ladder
        // now has handcrafted camps through Sv7, so lift stale levels to the
        // new base (higher progress is kept as-is).
        raidLevel: Math.max(save.raidLevel ?? STRONGHOLD_BASE_LEVEL, STRONGHOLD_BASE_LEVEL),
        raidVictoryCounts: sanitizeRaidVictoryCounts(save.raidVictoryCounts),
        lastRaidReward: null,
        lastRaidArmyResult: null,
        questProgress: save.questDayKey === todayKey() ? save.questProgress ?? {} : {},
        questsClaimed: save.questDayKey === todayKey() ? save.questsClaimed ?? [] : [],
        questDayKey: todayKey(),
        dailyStreak: save.dailyStreak ?? 0,
        dailyLastClaim: save.dailyLastClaim ?? null,
        lastProductionAt: Date.now(),
        feedback: null
      };
    }),
  dismissFeedback: (id) =>
    set((state) => state.feedback?.id === id ? { ...state, feedback: null } : state),
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

      if (
        buildingLevel(state.buildings, "trainingNest") <
        camp.requiredTrainingNestLevel
      ) {
        return {
          ...state,
          feedback: {
            id: now,
            text: t("raidmap.unlockNest", state.language, {
              level: camp.requiredTrainingNestLevel
            })
          }
        };
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
        lastRaidArmyResult: null,
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
        lastRaidArmyResult: summarizeRaidArmy(state.units),
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
      lastRaidArmyResult: null,
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
      const requiredLodgeLevel = definition.unlockLodgeLevel ?? 1;
      if (buildingLevel(state.buildings, "workerShelter") < requiredLodgeLevel) {
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers,
          feedback: { id: now, text: t("lumberCamp.workerLocked", state.language, { level: requiredLodgeLevel }) }
        };
      }
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
        ...advanceDailyMission(state, "trainAny", now),
        feedback: {
          id: now,
          text: t("worker.queued", state.language, {
            name: t(`worker.${workerClass}.name`, state.language)
          })
        }
      };
    }),
  sendWorkerExpedition: (workerId, resource, missionTier) =>
    set((state) => {
      if (
        state.gameStatus !== "playing" ||
        typeof workerId !== "string" ||
        !isWorkerResource(resource) ||
        (resource !== "bananas" && resource !== "wood" && resource !== "stones")
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
      if (resource === "wood") {
        const capacity = lumberCampCapacity(buildingLevel(state.buildings, "lumberCamp"));
        const lumber = reconcileLumberCamp(state.workerExpeditions, state.lumberCampStorage, capacity, now);
        const lumberMission = lumber.expeditions.find((entry) => entry.resource === "wood");
        if (!isLumberWorkerClass(worker.workerClass) || !isLumberMissionTier(missionTier) || lumberMission || lumber.storage >= capacity) {
          return {
            ...state,
            workerProductionQueue: reconciled.queue,
            idleWorkers: reconciled.idleWorkers,
            workerExpeditions: lumber.expeditions,
            lumberCampStorage: lumber.storage,
            feedback: {
              id: now,
              text: t(lumber.storage >= capacity ? "lumberCamp.storageFullFeedback" : lumberMission ? "lumberCamp.busyFeedback" : "lumberCamp.invalidWorker", state.language)
            }
          };
        }
        workerSerial += 1;
        const expedition = createLumberExpedition(
          `lumber-expedition-${now}-${workerSerial}`,
          worker,
          missionTier,
          buildingLevel(state.buildings, "lumberCamp"),
          now
        );
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers.filter((entry) => entry.id !== workerId),
          workerExpeditions: [...lumber.expeditions, expedition],
          lumberCampStorage: lumber.storage,
          ...advanceDailyMission(state, "workShift", now),
          feedback: { id: now, text: t("lumberCamp.missionStarted", state.language) }
        };
      }
      if (resource === "stones") {
        const capacity = stoneQuarryCapacity(buildingLevel(state.buildings, "stoneQuarry"));
        const quarry = reconcileStoneQuarry(state.workerExpeditions, state.stoneQuarryStorage, capacity, now);
        const stoneMission = quarry.expeditions.find((entry) => entry.resource === "stones");
        if (!isStoneWorkerClass(worker.workerClass) || !isLumberMissionTier(missionTier) || stoneMission || quarry.storage >= capacity) {
          return {
            ...state,
            workerProductionQueue: reconciled.queue,
            idleWorkers: reconciled.idleWorkers,
            workerExpeditions: quarry.expeditions,
            stoneQuarryStorage: quarry.storage,
            feedback: {
              id: now,
              text: t(quarry.storage >= capacity ? "stoneQuarry.storageFullFeedback" : stoneMission ? "stoneQuarry.busyFeedback" : "stoneQuarry.invalidWorker", state.language)
            }
          };
        }
        workerSerial += 1;
        const expedition = createStoneExpedition(
          `stone-expedition-${now}-${workerSerial}`,
          worker,
          missionTier,
          buildingLevel(state.buildings, "stoneQuarry"),
          now
        );
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers.filter((entry) => entry.id !== workerId),
          workerExpeditions: [...quarry.expeditions, expedition],
          stoneQuarryStorage: quarry.storage,
          ...advanceDailyMission(state, "workShift", now),
          feedback: { id: now, text: t("stoneQuarry.missionStarted", state.language) }
        };
      }
      if (!(["gatherer", "skilled", "master"] as string[]).includes(worker.workerClass)) {
        return { ...state, workerProductionQueue: reconciled.queue, idleWorkers: reconciled.idleWorkers };
      }
      const groveCapacity = bananaGroveCapacity(
        buildingLevel(state.buildings, "bananaGrove")
      );
      const grove = reconcileBananaGrove(
        state.workerExpeditions,
        state.bananaGroveStorage,
        groveCapacity,
        now
      );
      const assignedBananaWorkers = grove.expeditions.filter(
        (entry) => entry.resource === "bananas"
      ).length;
      if (
        assignedBananaWorkers >= BANANA_GROVE_MAX_WORKERS ||
        grove.storage >= groveCapacity
      ) {
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers,
          workerExpeditions: grove.expeditions,
          bananaGroveStorage: grove.storage,
          feedback: {
            id: now,
            text: t(
              grove.storage >= groveCapacity
                ? "bananaGrove.storageFullFeedback"
                : "bananaGrove.busyFeedback",
              state.language
            )
          }
        };
      }
      workerSerial += 1;
      const bananaGroveLevel = buildingLevel(state.buildings, "bananaGrove");
      const bananaMissionTier = isLumberMissionTier(missionTier) ? missionTier : "safe";
      const expedition = createWorkerExpedition(
        `worker-expedition-${now}-${workerSerial}`,
        worker,
        resource,
        now,
        WORKER_MISSIONS[bananaMissionTier].multiplier,
        productionLevelMultiplier(bananaGroveLevel) - 1,
        bananaMissionTier
      );
      return {
        ...state,
        workerProductionQueue: reconciled.queue,
        idleWorkers: reconciled.idleWorkers.filter((entry) => entry.id !== workerId),
        workerExpeditions: [...grove.expeditions, expedition],
        bananaGroveStorage: grove.storage,
        ...advanceDailyMission(state, "workShift", now),
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
      if (
        !expedition ||
        (expedition.resource === "bananas" || expedition.resource === "wood" || expedition.resource === "stones") ||
        expeditionStatus(expedition, now) !== "completed"
      ) {
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
  collectBananaGrove: () => {
    let summary: BananaGroveCollectionSummary | null = null;
    set((state) => {
      const now = Date.now();
      const capacity = bananaGroveCapacity(buildingLevel(state.buildings, "bananaGrove"));
      const grove = reconcileBananaGrove(
        state.workerExpeditions,
        state.bananaGroveStorage,
        capacity,
        now
      );
      const finished = grove.expeditions.filter(
        (entry) => entry.resource === "bananas" && entry.storedReward !== undefined
      );
      if (finished.length === 0 && grove.storage <= 0) {
        return {
          ...state,
          workerExpeditions: grove.expeditions,
          bananaGroveStorage: grove.storage
        };
      }
      const resources = { ...state.resources };
      const before = resources.bananas;
      addResourcesCapped(
        resources,
        { bananas: grove.storage },
        storageCap(buildingLevel(state.buildings, "clanHall"))
      );
      const collected = Math.max(0, resources.bananas - before);
      const remainingStorage = Math.max(0, grove.storage - collected);
      summary = {
        collected,
        remainingStorage,
        workerClasses: finished.map((entry) => entry.workerClass)
      };
      return {
        ...state,
        resources,
        workerExpeditions: grove.expeditions.filter(
          (entry) => !(entry.resource === "bananas" && entry.storedReward !== undefined)
        ),
        bananaGroveStorage: remainingStorage,
        feedback: {
          id: now,
          text: t("worker.collected", state.language, {
            amount: Math.floor(collected),
            resource: t("res.bananas", state.language)
          })
        }
      };
    });
    return summary;
  },
  collectLumberCamp: () => {
    let summary: LumberCampCollectionSummary | null = null;
    set((state) => {
      const now = Date.now();
      const capacity = lumberCampCapacity(buildingLevel(state.buildings, "lumberCamp"));
      const camp = reconcileLumberCamp(state.workerExpeditions, state.lumberCampStorage, capacity, now);
      const finished = camp.expeditions.find(
        (entry) => entry.resource === "wood" && entry.storedReward !== undefined && isLumberWorkerClass(entry.workerClass)
      );
      if (!finished && camp.storage <= 0) {
        return { ...state, workerExpeditions: camp.expeditions, lumberCampStorage: camp.storage };
      }
      const resources = { ...state.resources };
      const before = resources.wood;
      addResourcesCapped(resources, { wood: camp.storage }, storageCap(buildingLevel(state.buildings, "clanHall")));
      const collected = Math.max(0, resources.wood - before);
      const remainingStorage = Math.max(0, camp.storage - collected);
      summary = {
        collected,
        remainingStorage,
        workerClass: finished?.workerClass as LumberWorkerClass | undefined,
        outcome: finished?.outcome,
        reward: finished?.reward ?? 0,
        storedReward: finished?.storedReward ?? 0
      };
      return {
        ...state,
        resources,
        workerExpeditions: finished ? camp.expeditions.filter((entry) => entry.id !== finished.id) : camp.expeditions,
        lumberCampStorage: remainingStorage,
        feedback: { id: now, text: t("worker.collected", state.language, { amount: Math.floor(collected), resource: t("res.wood", state.language) }) }
      };
    });
    return summary;
  },
  collectStoneQuarry: () => {
    let summary: StoneQuarryCollectionSummary | null = null;
    set((state) => {
      const now = Date.now();
      const capacity = stoneQuarryCapacity(buildingLevel(state.buildings, "stoneQuarry"));
      const quarry = reconcileStoneQuarry(state.workerExpeditions, state.stoneQuarryStorage, capacity, now);
      const finished = quarry.expeditions.find(
        (entry) => entry.resource === "stones" && entry.storedReward !== undefined && isStoneWorkerClass(entry.workerClass)
      );
      if (!finished && quarry.storage <= 0) {
        return { ...state, workerExpeditions: quarry.expeditions, stoneQuarryStorage: quarry.storage };
      }
      const resources = { ...state.resources };
      const before = resources.stones;
      addResourcesCapped(resources, { stones: quarry.storage }, storageCap(buildingLevel(state.buildings, "clanHall")));
      const collected = Math.max(0, resources.stones - before);
      const remainingStorage = Math.max(0, quarry.storage - collected);
      summary = {
        collected,
        remainingStorage,
        workerClass: finished?.workerClass as StoneWorkerClass | undefined,
        outcome: finished?.outcome,
        reward: finished?.reward ?? 0,
        storedReward: finished?.storedReward ?? 0
      };
      return {
        ...state,
        resources,
        workerExpeditions: finished ? quarry.expeditions.filter((entry) => entry.id !== finished.id) : quarry.expeditions,
        stoneQuarryStorage: remainingStorage,
        feedback: { id: now, text: t("worker.collected", state.language, { amount: Math.floor(collected), resource: t("res.stones", state.language) }) }
      };
    });
    return summary;
  },
  claimQuest: (id: string) =>
    set((state) => {
      const quest = QUESTS.find((entry) => entry.id === id);
      const day = todayKey();
      const currentDay = state.questDayKey === day;
      const questProgress = currentDay ? state.questProgress : {};
      const questsClaimed = currentDay ? state.questsClaimed : [];
      if (
        !quest ||
        questsClaimed.includes(id) ||
        !isQuestComplete(questProgress, quest)
      ) {
        return state;
      }
      const now = Date.now();
      const reward = resolveQuestReward(
        quest,
        buildingLevel(state.buildings, "clanHall")
      );
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
        questProgress,
        questsClaimed: [...questsClaimed, id],
        questDayKey: day,
        feedback: { id: now, text: t("fb.questClaimed", state.language) }
      };
    }),
  dismissOfflineReport: () => set(() => ({ offlineReport: null })),
  buyShopItem: (id: string) =>
    set((state) => {
      const item = getResourceShopItem(
        id,
        buildingLevel(state.buildings, "clanHall")
      );
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
      const capacityIssue = resourceShopCapacityIssues(item, state.resources, cap)[0];
      if (capacityIssue) {
        return {
          ...state,
          feedback: {
            id: now,
            text: t("shop.storageInsufficient", state.language, {
              resource: t(`res.${capacityIssue.resource}`, state.language),
              free: capacityIssue.free,
              required: capacityIssue.requiredFree
            })
          }
        };
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
      if (monkey.acquisition !== "gems" && monkey.acquisition !== "daily_reward_or_gems") {
        result = "invalid";
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
  equipProfileSkin: (id) =>
    set((state) => {
      const skin = getProfileSkin(id);
      if (
        !canEquipProfileSkin(id, state.ownedProfileSkins, state.unlockedProfileMonkeys) ||
        !skin ||
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
  openFestivalChest: (options) => {
    let result: FestivalChestOpenResult = { status: "complete" };
    set((state) => {
      const free = __DEV__ && options?.free === true;
      const prepared = prepareFestivalChestOpen(
        {
          gems: state.gems,
          fragments: state.festivalFragments,
          ownedSkinIds: state.ownedProfileSkins,
          unlockedMonkeyIds: state.unlockedProfileMonkeys,
          rngSeed: state.festivalChestRngSeed,
          pendingTransaction: state.pendingFestivalChest
        },
        {
          free,
          seed: __DEV__ ? options?.seed : undefined,
          now: Date.now()
        }
      );
      result = prepared.result;
      if (prepared.result.status !== "opened") return state;
      const transaction = prepared.result.transaction;
      const next: GameState = {
        ...state,
        gems: prepared.snapshot.gems,
        festivalFragments: prepared.snapshot.fragments,
        festivalChestRngSeed: prepared.snapshot.rngSeed,
        pendingFestivalChest: transaction,
        ownedProfileSkins: [...prepared.snapshot.ownedSkinIds],
        newProfileSkins: transaction.unlocked
          ? Array.from(new Set([...state.newProfileSkins, transaction.skinId]))
          : state.newProfileSkins
      };
      void persistVillage(next);
      return next;
    });
    return result;
  },
  claimFestivalChest: (transactionId) =>
    set((state) => {
      const transaction = state.pendingFestivalChest;
      if (!transaction || transaction.id !== transactionId) return state;
      const next: GameState = {
        ...state,
        pendingFestivalChest: null,
        claimedFestivalChest: transaction
      };
      void persistVillage(next);
      return next;
    }),
  addFestivalTestBalance: () =>
    set((state) => {
      if (!__DEV__) return state;
      const next: GameState = { ...state, gems: state.gems + 10000 };
      void persistVillage(next);
      return next;
    }),
  resetFestivalProgress: () =>
    set((state) => {
      if (!__DEV__) return state;
      const festivalIds = new Set(FESTIVAL_PROFILE_SKINS.map((skin) => skin.id));
      const equippedFestival = festivalIds.has(state.equippedProfileSkin);
      const next: GameState = {
        ...state,
        ownedProfileSkins: state.ownedProfileSkins.filter((id) => !festivalIds.has(id)),
        newProfileSkins: state.newProfileSkins.filter((id) => !festivalIds.has(id)),
        equippedProfileSkin: equippedFestival
          ? getDefaultSkinId(state.equippedProfileMonkey)
          : state.equippedProfileSkin,
        festivalFragments: {},
        festivalChestRngSeed: normalizeFestivalSeed(Date.now()),
        pendingFestivalChest: null,
        claimedFestivalChest: null
      };
      void persistVillage(next);
      return next;
    }),
  seedFestivalChestRng: (seed) =>
    set((state) => {
      if (!__DEV__) return state;
      const next: GameState = {
        ...state,
        festivalChestRngSeed: normalizeFestivalSeed(seed)
      };
      void persistVillage(next);
      return next;
    }),
  claimDaily: () =>
    set((state) => {
      const today = todayKey();
      const day = nextDailyRewardDay(state.dailyStreak, state.dailyLastClaim, today);
      if (day == null) return state;
      const reward = DAILY_REWARDS[day - 1];
      const now = Date.now();
      if (!reward) return state;
      const grant = resolveDailyReward(reward, state.unlockedProfileMonkeys);
      const unlockedProfileMonkeys = grant.unlockMonkeyId
        ? [...state.unlockedProfileMonkeys, grant.unlockMonkeyId]
        : state.unlockedProfileMonkeys;
      const unlockedDefaultSkin = grant.unlockMonkeyId
        ? getDefaultSkinId(grant.unlockMonkeyId)
        : null;
      const next: GameState = {
        ...state,
        gems: state.gems + grant.gems,
        unlockedProfileMonkeys,
        ownedProfileSkins: unlockedDefaultSkin
          ? Array.from(new Set([...state.ownedProfileSkins, unlockedDefaultSkin]))
          : state.ownedProfileSkins,
        newProfileMonkeys: grant.unlockMonkeyId
          ? Array.from(new Set([...state.newProfileMonkeys, grant.unlockMonkeyId]))
          : state.newProfileMonkeys,
        newProfileSkins: unlockedDefaultSkin
          ? Array.from(new Set([...state.newProfileSkins, unlockedDefaultSkin]))
          : state.newProfileSkins,
        dailyStreak: day,
        dailyLastClaim: today,
        feedback: {
          id: now,
          text: grant.unlockMonkeyId
            ? t("daily.scoutUnlocked", state.language)
            : t("daily.claimed", state.language, { amount: grant.gems })
        }
      };
      void persistVillage(next);
      return next;
    }),
  trainTroop: (type) => set((state) => createPlayerUnit(state, type)),
  upgradeTroopStat: (type, stat) => set((state) => upgradeTroopStat(state, type, stat)),
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
      const grove = reconcileBananaGrove(
        state.workerExpeditions,
        state.bananaGroveStorage,
        bananaGroveCapacity(buildingLevel(state.buildings, "bananaGrove")),
        now
      );
      const lumber = reconcileLumberCamp(
        grove.expeditions,
        state.lumberCampStorage,
        lumberCampCapacity(buildingLevel(state.buildings, "lumberCamp")),
        now
      );
      const stone = reconcileStoneQuarry(
        lumber.expeditions,
        state.stoneQuarryStorage,
        stoneQuarryCapacity(buildingLevel(state.buildings, "stoneQuarry")),
        now
      );
      const lodgeUpgrade = reconcileWorkerLodgeUpgrade(
        state.buildings,
        state.activeWorkerLodgeUpgrade,
        now
      );
      return {
        ...state,
        buildings: lodgeUpgrade.buildings,
        activeWorkerLodgeUpgrade: lodgeUpgrade.activeUpgrade,
        workerProductionQueue: reconciled.queue,
        idleWorkers: reconciled.idleWorkers,
        workerExpeditions: stone.expeditions,
        bananaGroveStorage: grove.storage,
        lumberCampStorage: lumber.storage,
        stoneQuarryStorage: stone.storage,
        feedback: reconciled.completed.length > 0
          ? { id: now, text: t("worker.productionReady", state.language) }
          : lodgeUpgrade.completed
            ? { id: now, text: t("workerLodge.upgradeComplete", state.language) }
          : grove.completed > 0
            ? { id: now, text: t("bananaGrove.harvestReady", state.language) }
          : lumber.completed > 0
            ? { id: now, text: t("lumberCamp.harvestReady", state.language) }
          : stone.completed > 0
            ? { id: now, text: t("stoneQuarry.harvestReady", state.language) }
          : state.feedback
      };
    }),
  tickGame: (now = Date.now()) =>
    set((state) => {
      if (state.gameStatus !== "playing") {
        return state;
      }

      const lodgeUpgrade = reconcileWorkerLodgeUpgrade(
        state.buildings,
        state.activeWorkerLodgeUpgrade,
        now
      );
      const units = state.units.map(cloneUnit);
      const game: MutableGame = {
        units,
        resources: { ...state.resources },
        buildings: cloneBuildings(lodgeUpgrade.buildings),
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
      const reconciledGrove = reconcileBananaGrove(
        state.workerExpeditions,
        state.bananaGroveStorage,
        bananaGroveCapacity(buildingLevel(state.buildings, "bananaGrove")),
        now
      );
      const reconciledLumber = reconcileLumberCamp(
        reconciledGrove.expeditions,
        state.lumberCampStorage,
        lumberCampCapacity(buildingLevel(state.buildings, "lumberCamp")),
        now
      );
      const reconciledStone = reconcileStoneQuarry(
        reconciledLumber.expeditions,
        state.stoneQuarryStorage,
        stoneQuarryCapacity(buildingLevel(state.buildings, "stoneQuarry")),
        now
      );
      const workerExpeditions = reconciledStone.expeditions;
      const bananaGroveStorage = reconciledGrove.storage;
      const lumberCampStorage = reconciledLumber.storage;
      const stoneQuarryStorage = reconciledStone.storage;
      if (reconciledWorkers.completed.length > 0) {
        game.feedbackText = t("worker.productionReady", state.language);
      } else if (lodgeUpgrade.completed) {
        game.feedbackText = t("workerLodge.upgradeComplete", state.language);
      } else if (reconciledGrove.completed > 0) {
        game.feedbackText = t("bananaGrove.harvestReady", state.language);
      } else if (reconciledLumber.completed > 0) {
        game.feedbackText = t("lumberCamp.harvestReady", state.language);
      } else if (reconciledStone.completed > 0) {
        game.feedbackText = t("stoneQuarry.harvestReady", state.language);
      }

      if (state.gameMode === "raid" && state.raidStatus === "active") {
        assignRaidOrders(units);

        for (const unit of units) {
          if (unit.owner === "enemy" || (unit.owner === "player" && isCombatant(unit))) {
            processUnit(unit, game, now);
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
          const gemsEarned = camp ? raidGemReward(stars, previousVictories) : 0;

          return {
            ...state,
            units: game.units,
            resources: reward.resources,
            workerProductionQueue,
            idleWorkers,
            workerExpeditions,
            bananaGroveStorage,
            lumberCampStorage,
            stoneQuarryStorage,
            buildings: game.buildings,
            activeWorkerLodgeUpgrade: lodgeUpgrade.activeUpgrade,
            enemyCampHp: 0,
            raidStars: stars,
            raidVictoryCounts,
            lastRaidReward: { loot, multiplier: rewardMultiplier, gems: gemsEarned },
            gems: state.gems + gemsEarned,
            ...advanceDailyMission(state, "winRaid", now),
            lastRaidPenalty: null,
            lastRaidArmyResult: summarizeRaidArmy(game.units),
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
            workerExpeditions,
            bananaGroveStorage,
            lumberCampStorage,
            stoneQuarryStorage,
            buildings: game.buildings,
            activeWorkerLodgeUpgrade: lodgeUpgrade.activeUpgrade,
            enemyCampHp: game.enemyCampHp,
            feedback: { id: now, text: t("fb.raidFailed", state.language) },
            raidStatus: "defeat",
            lastRaidPenalty: { reason: "defeat", amounts: penalized.amounts },
            lastRaidArmyResult: summarizeRaidArmy(game.units)
          };
        }

        return {
          ...state,
          units: game.units,
          resources: game.resources,
          workerProductionQueue,
          idleWorkers,
          workerExpeditions,
          bananaGroveStorage,
          lumberCampStorage,
          stoneQuarryStorage,
          buildings: game.buildings,
          activeWorkerLodgeUpgrade: lodgeUpgrade.activeUpgrade,
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
            item.type,
            item.combatStats,
            unitCombatStats(
              item.type,
              buildingLevel(game.buildings, "trainingNest"),
              state.troopUpgrades
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
        playerCampHp: game.playerCampHp,
        enemyCampHp: game.enemyCampHp,
        productionQueue,
        workerProductionQueue,
        idleWorkers,
        workerExpeditions,
        bananaGroveStorage,
        lumberCampStorage,
        stoneQuarryStorage,
        activeWorkerLodgeUpgrade: lodgeUpgrade.activeUpgrade,
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
        range: unit.range,
        attackIntervalMs: unit.attackIntervalMs,
        moveIntervalMs: unit.moveIntervalMs,
        resistance: unit.resistance,
        armorPenetration: unit.armorPenetration,
        power: unit.power
      });
    }
  }

  const payload: VillageSave = {
    buildings: state.buildings,
    resources: state.resources,
    unitRoster,
    gems: state.gems,
    unlockedProfileMonkeys: state.unlockedProfileMonkeys,
    equippedProfileMonkey: state.equippedProfileMonkey,
    ownedProfileSkins: state.ownedProfileSkins,
    equippedProfileSkin: state.equippedProfileSkin,
    newProfileMonkeys: state.newProfileMonkeys,
    newProfileSkins: state.newProfileSkins,
    festivalFragments: state.festivalFragments,
    festivalChestRngSeed: state.festivalChestRngSeed,
    pendingFestivalChest: state.pendingFestivalChest,
    claimedFestivalChest: state.claimedFestivalChest,
    productionQueue: state.productionQueue,
    troopUpgrades: state.troopUpgrades,
    workerProductionQueue: state.workerProductionQueue,
    idleWorkers: state.idleWorkers,
    workerExpeditions: state.workerExpeditions,
    bananaGroveStorage: state.bananaGroveStorage,
    lumberCampStorage: state.lumberCampStorage,
    stoneQuarryStorage: state.stoneQuarryStorage,
    activeWorkerLodgeUpgrade: state.activeWorkerLodgeUpgrade,
    language: state.language,
    raidLevel: state.raidLevel,
    raidVictoryCounts: state.raidVictoryCounts,
    questProgress: state.questProgress,
    questsClaimed: state.questsClaimed,
    questDayKey: state.questDayKey,
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
useGameStore.subscribe((state, previousState) => {
  if (state.gameStatus !== "playing") {
    return;
  }
  const now = Date.now();
  const workplaceStateChanged =
    state.lumberCampStorage !== previousState.lumberCampStorage ||
    state.stoneQuarryStorage !== previousState.stoneQuarryStorage ||
    (state.workerProductionQueue !== previousState.workerProductionQueue &&
      (state.workerProductionQueue.some((item) => isLumberWorkerClass(item.workerClass) || isStoneWorkerClass(item.workerClass)) || previousState.workerProductionQueue.some((item) => isLumberWorkerClass(item.workerClass) || isStoneWorkerClass(item.workerClass)))) ||
    (state.idleWorkers !== previousState.idleWorkers &&
      (state.idleWorkers.some((worker) => isLumberWorkerClass(worker.workerClass) || isStoneWorkerClass(worker.workerClass)) || previousState.idleWorkers.some((worker) => isLumberWorkerClass(worker.workerClass) || isStoneWorkerClass(worker.workerClass)))) ||
    (state.workerExpeditions !== previousState.workerExpeditions &&
      (state.workerExpeditions.some((mission) => mission.resource === "wood" || mission.resource === "stones") || previousState.workerExpeditions.some((mission) => mission.resource === "wood" || mission.resource === "stones")));
  if (workplaceStateChanged) {
    lastSaveAt = now;
    void persistVillage(state);
    return;
  }
  if (now - lastSaveAt < 3000) {
    return;
  }
  lastSaveAt = now;
  void persistVillage(state);
});
