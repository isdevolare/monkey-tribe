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
  storageCap,
  upgradeCost,
  workerCapacity
} from "../config/buildings";
import { STRONGHOLD_BASE_LEVEL, getCamp, campName, type RaidCamp } from "../config/camps";
import {
  TROOPS,
  TROOP_TYPES,
  armyCapacity,
  armyHousing,
  calculateTroopPower,
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
import { getGemPackByProductId } from "../config/gemPacks";
import {
  ROYAL_PALACE_SAVE_VERSION,
  createRoyalCharacterDisplays,
  migrateRoyalPalaceActiveUpgrade,
  migrateRoyalPalaceLevel,
  revealNewRoyalCharacters,
  resolveRoyalPalaceRush,
  sanitizeRoyalCharacterDisplays,
  selectRoyalCharacterSkin,
  setRoyalCharacterVisibility,
  startRoyalPalaceUpgrade
} from "../config/royalPalace";
import { t } from "../i18n";
import { createInitialMap, createInitialUnits, createUnit } from "../config/map";
import { applyRaidPenalty } from "./raidPenalty";
import {
  livingVillageRosterAfterRaid,
  raidSelectionStats,
  selectedRaidUnits
} from "./raidArmy";
import {
  RAID_REWARD_VERSION,
  migrateRaidVictoryCounts,
  resolveCampRaidGemReward,
  resolveRaidVictoryReward
} from "./raidRewards";
import { addResourcesCapped, RESOURCE_KEYS, type CappedResourceGrant } from "./resources";
import {
  WORKER_CLASSES,
  BANANA_GROVE_MAX_WORKERS,
  RESOURCE_WORKPLACE_MAX_WORKERS,
  bananaGroveCapacity,
  createWorkerExpeditionBatch,
  expeditionStatus,
  evaluateWorkerProductionStart,
  isWorkerClass,
  isLumberMissionTier,
  isLumberWorkerClass,
  isStoneWorkerClass,
  isWorkerRewardFullyStored,
  isWorkerResource,
  managedWorkerCount,
  reconcileWorkerProduction,
  reconcileBananaGrove,
  reconcileLumberCamp,
  reconcileStoneQuarry,
  removeDispatchedWorkers,
  lumberCampCapacity,
  sanitizeBananaGroveStorage,
  sanitizeLumberCampStorage,
  sanitizeStoneQuarryStorage,
  sanitizeIdleWorkers,
  sanitizeWorkerExpeditions,
  sanitizeWorkerProductionQueue,
  stoneQuarryCapacity,
  workerDispatchFitsCapacity,
  workerDispatchQuestCredit,
  workerProductionQuestCredit
} from "./workerExpeditions";
import {
  evaluateWorkerLodgeUpgrade,
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
  WorkerDispatchResult,
  WorkerProductionStartResult,
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

function advanceDailyMissionBy(
  state: Pick<GameState, "questProgress" | "questsClaimed" | "questDayKey">,
  metric: QuestMetric,
  amount: number,
  now = Date.now()
) {
  const day = todayKey(now);
  const currentDay = state.questDayKey === day;
  const questProgress = currentDay ? state.questProgress : {};
  return {
    questProgress: {
      ...questProgress,
      [metric]: (questProgress[metric] ?? 0) + Math.max(0, Math.floor(amount))
    },
    questsClaimed: currentDay ? state.questsClaimed : [],
    questDayKey: day
  };
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
    processedIapTransactionIds: [] as string[],
    redeemedQaCodes: [] as string[],
    unlockedProfileMonkeys: [DEFAULT_PROFILE_MONKEY_ID] as ProfileMonkeyId[],
    ownedProfileSkins: [DEFAULT_PROFILE_SKIN_ID] as ProfileSkinId[],
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
    royalCharacterDisplays: createRoyalCharacterDisplays(0, [DEFAULT_PROFILE_MONKEY_ID], [DEFAULT_PROFILE_SKIN_ID]),
    playerCampHp: CAMP_MAX_HP,
    enemyCampHp: CAMP_MAX_HP,
    enemyCampMaxHp: CAMP_MAX_HP,
    activeCampId: null,
    activeRaidUnitIds: [] as string[],
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

function resourceGrantText(resources: Resources, lang: Lang) {
  return RESOURCE_KEYS
    .filter((resource) => resources[resource] > 0)
    .map(
      (resource) =>
        `${Math.floor(resources[resource])} ${t(`res.${resource}`, lang)}`
    )
    .join(", ");
}

function cappedGrantFeedback(
  grant: CappedResourceGrant,
  lang: Lang,
  fallbackKey: Parameters<typeof t>[0]
) {
  if (!grant.clipped) return t(fallbackKey, lang);
  return t("fb.resourcesCapped", lang, {
    received: resourceGrantText(grant.received, lang) || "0",
    lost: resourceGrantText(grant.discarded, lang)
  });
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

function nearestPlayerInRange(
  enemy: Unit,
  units: Unit[],
  deployedUnitIds: ReadonlySet<string>
) {
  const playerUnits = units.filter(
    (unit) =>
      unit.owner === "player" &&
      deployedUnitIds.has(unit.id) &&
      isCombatant(unit) &&
      unit.state !== "dead" &&
      unit.hp > 0
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

function assignEnemyOrders(units: Unit[], deployedUnitIds: ReadonlySet<string>) {
  for (const unit of units) {
    if (unit.owner !== "enemy" || unit.state === "dead" || unit.hp <= 0) {
      continue;
    }

    const playerTarget = nearestPlayerInRange(unit, units, deployedUnitIds);
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

function deployRaidUnits(
  units: Unit[],
  now: number,
  camp: RaidCamp,
  deployedUnitIds: ReadonlySet<string>
) {
  let fighterIndex = 0;

  return [
    ...units
      .filter((unit) => unit.owner === "player")
      .map((unit) => {
        if (
          !deployedUnitIds.has(unit.id) ||
          !isCombatant(unit) ||
          unit.state === "dead" ||
          unit.hp <= 0
        ) {
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

  return livingVillageRosterAfterRaid(units)
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

function assignRaidOrders(units: Unit[], deployedUnitIds: ReadonlySet<string>) {
  assignEnemyOrders(units, deployedUnitIds);

  for (const unit of units) {
    if (
      unit.owner !== "player" ||
      !deployedUnitIds.has(unit.id) ||
      !isCombatant(unit) ||
      unit.state === "dead" ||
      unit.hp <= 0
    ) {
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

  if (type === "royalPalace") {
    const now = Date.now();
    const started = startRoyalPalaceUpgrade({
      palaceLevel: level,
      clanLevel: buildingLevel(state.buildings, "clanHall"),
      resources: state.resources,
      gems: state.gems,
      activeUpgrade: state.activeWorkerLodgeUpgrade,
      now
    });
    const definition = started.definition;
    if (!definition || started.result === "max-level") {
      return { ...state, feedback: { id: now, text: t("royalPalace.maxLevel", state.language) } };
    }
    if (started.result !== "started") {
      const text = started.result === "upgrade-active"
        ? t("royalPalace.otherUpgradeActive", state.language)
        : started.result === "clan-level"
          ? t("royalPalace.needClanHall", state.language, { level: definition.requiredClanHallLevel })
          : t("royalPalace.needResources", state.language, { cost: costText(definition.cost) });
      return { ...state, feedback: { id: now, text } };
    }
    return {
      ...state,
      resources: started.resources,
      gems: started.gems,
      activeWorkerLodgeUpgrade: started.activeUpgrade,
      ...advanceDailyMission(state, "upgradeAny", now),
      feedback: {
        id: now,
        text: t("royalPalace.upgradeStarted", state.language, { level: definition.targetLevel })
      }
    };
  }

  if (type === "workerShelter") {
    const now = Date.now();
    const clanLevel = buildingLevel(state.buildings, "clanHall");
    const eligibility = evaluateWorkerLodgeUpgrade({
      lodgeLevel: level,
      clanLevel,
      resources: state.resources,
      activeUpgrade: state.activeWorkerLodgeUpgrade
    });
    const definition = eligibility.definition;
    if (!definition) {
      return {
        ...state,
        feedback: { id: now, text: t("workerLodge.maxLevel", state.language) }
      };
    }
    if (eligibility.block?.reason === "upgrade-active") {
      return {
        ...state,
        feedback: { id: now, text: t("workerLodge.upgradeAlreadyActive", state.language) }
      };
    }
    if (eligibility.block?.reason === "clan-level") {
      return {
        ...state,
        feedback: {
          id: now,
          text: t("workerLodge.needClanLevel", state.language, {
            level: eligibility.block.requiredLevel
          })
        }
      };
    }
    if (eligibility.block?.reason === "storage") {
      return {
        ...state,
        feedback: {
          id: now,
          text: t("workerLodge.needStorage", state.language, { amount: eligibility.block.capacity })
        }
      };
    }
    if (eligibility.block?.reason === "resource") {
      return {
        ...state,
        feedback: {
          id: now,
          text: t("workerLodge.resourceMissing", state.language, {
            amount: eligibility.block.missing,
            resource: t(`res.${eligibility.block.resource}`, state.language)
          })
        }
      };
    }
    return {
      ...state,
      resources: spendResources(state.resources, definition.cost),
      activeWorkerLodgeUpgrade: {
        buildingType: "workerShelter",
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
      activeRaidUnitIds: [],
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
        level: building.type === "royalPalace"
          ? migrateRoyalPalaceLevel(levels.get(building.type) ?? building.level, save.royalPalaceVersion)
          : levels.get(building.type) ?? building.level
      }));
      const savedWorkerLodgeUpgrade = sanitizeWorkerLodgeUpgrade(
        migrateRoyalPalaceActiveUpgrade(save.activeWorkerLodgeUpgrade, save.royalPalaceVersion),
        buildings
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
      const royalCharacterDisplays = sanitizeRoyalCharacterDisplays({
        value: save.royalCharacterDisplays,
        legacySlots: save.royalPalaceSlots,
        palaceLevel: buildingLevel(buildings, "royalPalace"),
        ownedMonkeys: unlockedProfileMonkeys,
        ownedSkins: ownedProfileSkins,
        legacyEquippedMonkey: equippedProfileMonkey,
        legacyEquippedSkin: equippedProfileSkin
      });
      // Preserve legacy overflow instead of silently deleting paid or earned
      // stock. addResourcesCapped gives overflow zero headroom, so future
      // production/rewards cannot grow it until the player spends below cap.
      const savedResources = addResourcesCapped(save.resources, {}, cap).resources;

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
        processedIapTransactionIds: Array.isArray(save.processedIapTransactionIds)
          ? Array.from(
              new Set(
                save.processedIapTransactionIds.filter(
                  (value): value is string => typeof value === "string" && value.length > 0
                )
              )
            )
          : [],
        redeemedQaCodes: Array.isArray(save.redeemedQaCodes)
          ? save.redeemedQaCodes.filter((value): value is string => typeof value === "string")
          : [],
        unlockedProfileMonkeys,
        ownedProfileSkins,
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
        royalCharacterDisplays,
        language: save.language ?? state.language,
        // Migration: older saves tracked the stronghold from Sv4; the ladder
        // now has handcrafted camps through Sv7, so lift stale levels to the
        // new base (higher progress is kept as-is).
        raidLevel: Math.max(save.raidLevel ?? STRONGHOLD_BASE_LEVEL, STRONGHOLD_BASE_LEVEL),
        raidVictoryCounts: migrateRaidVictoryCounts(
          save.raidVictoryCounts,
          save.raidLevel,
          save.raidRewardVersion
        ),
        activeRaidUnitIds: [],
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
  upgradeBuilding: (type) => set((state) => {
    const next = upgradeVillageBuilding(state, type);
    if (type === "royalPalace" && next !== state && next.activeWorkerLodgeUpgrade !== state.activeWorkerLodgeUpgrade) {
      void persistVillage(next);
    }
    return next;
  }),
  selectRoyalCharacterSkin: (characterId, skinId) => {
    let result: ReturnType<typeof selectRoyalCharacterSkin>["result"] = "invalid-slot";
    set((state) => {
      const selected = selectRoyalCharacterSkin(
        state.royalCharacterDisplays,
        characterId,
        skinId,
        buildingLevel(state.buildings, "royalPalace"),
        state.unlockedProfileMonkeys,
        state.ownedProfileSkins
      );
      result = selected.result;
      if (selected.result !== "placed") return state;
      const next: GameState = {
        ...state,
        royalCharacterDisplays: selected.displays,
        feedback: { id: Date.now(), text: t("royalPalace.skinSelected", state.language) }
      };
      void persistVillage(next);
      return next;
    });
    return result;
  },
  setRoyalCharacterVisibility: (characterId, visible) => {
    let result: ReturnType<typeof setRoyalCharacterVisibility>["result"] = "invalid-slot";
    set((state) => {
      const changed = setRoyalCharacterVisibility(
        state.royalCharacterDisplays,
        characterId,
        visible,
        buildingLevel(state.buildings, "royalPalace"),
        state.unlockedProfileMonkeys
      );
      result = changed.result;
      if (changed.result !== "placed") return state;
      const next: GameState = {
        ...state,
        royalCharacterDisplays: changed.displays,
        feedback: { id: Date.now(), text: t(visible ? "royalPalace.characterShown" : "royalPalace.characterHidden", state.language) }
      };
      void persistVillage(next);
      return next;
    });
    return result;
  },
  rushRoyalPalaceUpgrade: () => {
    let rushed = false;
    set((state) => {
      const rushedUpgrade = resolveRoyalPalaceRush(state.activeWorkerLodgeUpgrade, state.gems, Date.now());
      if (rushedUpgrade.result !== "rushed") {
        return rushedUpgrade.result === "gems"
          ? { ...state, feedback: { id: Date.now(), text: t("fb.needGems", state.language) } }
          : state;
      }
      const now = rushedUpgrade.activeUpgrade.endsAt;
      const completed = reconcileWorkerLodgeUpgrade(
        state.buildings,
        rushedUpgrade.activeUpgrade,
        now
      );
      if (!completed.completed) return state;
      const royalCharacterDisplays = revealNewRoyalCharacters(
        state.royalCharacterDisplays,
        state.activeWorkerLodgeUpgrade?.fromLevel ?? 0,
        state.activeWorkerLodgeUpgrade?.targetLevel ?? 0,
        state.unlockedProfileMonkeys
      );
      rushed = true;
      const next: GameState = {
        ...state,
        gems: rushedUpgrade.gems,
        buildings: completed.buildings,
        activeWorkerLodgeUpgrade: completed.activeUpgrade,
        royalCharacterDisplays,
        feedback: { id: now, text: t("royalPalace.rushComplete", state.language) }
      };
      void persistVillage(next);
      return next;
    });
    return rushed;
  },
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
  startRaidOn: (campId, selection) =>
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

      const requestedCount = TROOP_TYPES.reduce(
        (sum, type) => sum + Math.max(0, Math.floor(selection[type] ?? 0)),
        0
      );
      const fighters = selectedRaidUnits(state.units, selection);
      const selectionStats = raidSelectionStats(state.units, selection);
      const capacity = armyCapacity(buildingLevel(state.buildings, "trainingNest"));

      if (
        fighters.length <= 0 ||
        fighters.length !== requestedCount ||
        selectionStats.housing > capacity
      ) {
        return {
          ...state,
          feedback: { id: now, text: t("raid.confirm.invalidSelection", state.language) }
        };
      }

      const activeRaidUnitIds = fighters.map((unit) => unit.id);
      const deployedUnitIds = new Set(activeRaidUnitIds);

      return {
        ...state,
        gameMode: "raid",
        raidStatus: "active",
        activeCampId: camp.id,
        activeRaidUnitIds,
        enemyCampHp: camp.campHp,
        enemyCampMaxHp: camp.campHp,
        raidStars: 0,
        lastRaidReward: null,
        lastRaidPenalty: null,
        lastRaidArmyResult: null,
        units: deployRaidUnits(state.units, now, camp, deployedUnitIds),
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
        lastRaidArmyResult: summarizeRaidArmy(
          state.units,
          state.activeRaidUnitIds
        ),
        feedback: { id: now, text: t("fb.raidRetreated", state.language) }
      };
    }),
  returnToVillage: () =>
    set((state) => ({
      ...state,
      gameMode: "village",
      raidStatus: "idle",
      activeCampId: null,
      activeRaidUnitIds: [],
      lastRaidReward: null,
      lastRaidPenalty: null,
      lastRaidArmyResult: null,
      units: returnPlayerUnitsToVillage(state.units),
      lastProductionAt: Date.now(),
      feedback: { id: Date.now(), text: t("fb.returned", state.language) }
    })),
  queueWorker: (workerClass, count = 1) => {
    let result: WorkerProductionStartResult = "invalid";
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
      const definition = WORKER_CLASSES[workerClass];
      const requiredLodgeLevel = definition.unlockLodgeLevel ?? 1;
      const safeCount = Number.isFinite(count) ? Math.floor(count) : 0;
      const startResult = evaluateWorkerProductionStart({
        workerClass,
        lodgeLevel: buildingLevel(state.buildings, "workerShelter"),
        managedWorkers: managedWorkerCount(
          reconciled.queue,
          reconciled.idleWorkers,
          state.workerExpeditions
        ),
        capacity,
        resources: state.resources,
        count: safeCount
      });
      if (startResult !== "queued") {
        result = startResult;
        const feedbackText = startResult === "capacity-full"
          ? t("worker.capacityFull", state.language, { n: capacity })
          : startResult === "locked"
            ? t("lumberCamp.workerLocked", state.language, { level: requiredLodgeLevel })
            : t("fb.needCost", state.language, {
                name: t(`worker.${workerClass}.name`, state.language),
                cost: costText({
                  bananas: definition.cost.bananas * Math.max(1, safeCount),
                  stones: definition.cost.stones * Math.max(1, safeCount),
                  wood: definition.cost.wood * Math.max(1, safeCount)
                })
              });
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers,
          feedback: { id: now, text: feedbackText }
        };
      }
      let startedAt = Math.max(
        now,
        reconciled.queue[reconciled.queue.length - 1]?.finishesAt ?? now
      );
      const items: WorkerProductionItem[] = [];
      for (let index = 0; index < safeCount; index += 1) {
        workerSerial += 1;
        const finishesAt = startedAt + definition.productionMs;
        items.push({
          id: `worker-production-${now}-${workerSerial}`,
          workerId: `worker-${now}-${workerSerial}`,
          workerClass,
          startedAt,
          finishesAt
        });
        startedAt = finishesAt;
      }
      const totalCost = {
        bananas: definition.cost.bananas * safeCount,
        stones: definition.cost.stones * safeCount,
        wood: definition.cost.wood * safeCount
      };
      result = "queued";
      return {
        ...state,
        resources: spendResources(state.resources, totalCost),
        workerProductionQueue: [...reconciled.queue, ...items],
        idleWorkers: reconciled.idleWorkers,
        ...advanceDailyMissionBy(
          state,
          "trainAny",
          workerProductionQuestCredit("queued", safeCount),
          now
        ),
        feedback: {
          id: now,
          text: t("worker.batchQueued", state.language, {
            n: safeCount,
            name: t(`worker.${workerClass}.name`, state.language)
          })
        }
      };
    });
    return result;
  },
  sendWorkerExpedition: (workerId, resource, missionTier) => {
    useGameStore.getState().sendWorkerExpeditionBatch([workerId], resource, missionTier);
  },
  sendWorkerExpeditionBatch: (workerIds, resource, missionTier) => {
    let result: WorkerDispatchResult = "invalid";
    set((state) => {
      if (
        state.gameStatus !== "playing" ||
        !Array.isArray(workerIds) ||
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
      const uniqueIds = [...new Set(workerIds.filter((id): id is string => typeof id === "string"))];
      const selectedWorkers = uniqueIds
        .map((id) => reconciled.idleWorkers.find((worker) => worker.id === id))
        .filter((worker): worker is NonNullable<typeof worker> => worker != null);
      const validTier = isLumberMissionTier(missionTier) ? missionTier : "safe";
      const validWorkers = selectedWorkers.every((worker) =>
        resource === "bananas"
          ? worker.workerClass === "gatherer" || worker.workerClass === "skilled" || worker.workerClass === "master"
          : resource === "wood"
            ? isLumberWorkerClass(worker.workerClass)
            : isStoneWorkerClass(worker.workerClass)
      );
      if (selectedWorkers.length === 0 || selectedWorkers.length !== uniqueIds.length || !validWorkers) {
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers,
          feedback: { id: now, text: t("worker.invalidSelection", state.language) }
        };
      }
      const buildingType = resource === "bananas" ? "bananaGrove" : resource === "wood" ? "lumberCamp" : "stoneQuarry";
      const buildingLevelValue = buildingLevel(state.buildings, buildingType);
      const storageCapacity = resource === "bananas"
        ? bananaGroveCapacity(buildingLevelValue)
        : resource === "wood"
          ? lumberCampCapacity(buildingLevelValue)
          : stoneQuarryCapacity(buildingLevelValue);
      const reconciledWorkplace = resource === "bananas"
        ? reconcileBananaGrove(state.workerExpeditions, state.bananaGroveStorage, storageCapacity, now)
        : resource === "wood"
          ? reconcileLumberCamp(state.workerExpeditions, state.lumberCampStorage, storageCapacity, now)
          : reconcileStoneQuarry(state.workerExpeditions, state.stoneQuarryStorage, storageCapacity, now);
      const assigned = reconciledWorkplace.expeditions.filter((entry) => entry.resource === resource);
      const workerLimit = resource === "bananas" ? BANANA_GROVE_MAX_WORKERS : RESOURCE_WORKPLACE_MAX_WORKERS;
      if (reconciledWorkplace.storage >= storageCapacity) {
        result = "storage-full";
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers,
          workerExpeditions: reconciledWorkplace.expeditions,
          ...(resource === "bananas" ? { bananaGroveStorage: reconciledWorkplace.storage } : resource === "wood" ? { lumberCampStorage: reconciledWorkplace.storage } : { stoneQuarryStorage: reconciledWorkplace.storage }),
          feedback: {
            id: now,
            text: t(resource === "bananas" ? "bananaGrove.storageFullFeedback" : resource === "wood" ? "lumberCamp.storageFullFeedback" : "stoneQuarry.storageFullFeedback", state.language)
          }
        };
      }
      if (resource !== "bananas" && assigned.length > 0) {
        result = "busy";
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers,
          workerExpeditions: reconciledWorkplace.expeditions,
          feedback: { id: now, text: t(resource === "wood" ? "lumberCamp.busyFeedback" : "stoneQuarry.busyFeedback", state.language) }
        };
      }
      if (!workerDispatchFitsCapacity(assigned.length, selectedWorkers.length, workerLimit)) {
        result = "capacity-full";
        return {
          ...state,
          workerProductionQueue: reconciled.queue,
          idleWorkers: reconciled.idleWorkers,
          workerExpeditions: reconciledWorkplace.expeditions,
          feedback: { id: now, text: t("worker.workplaceCapacityFull", state.language, { n: workerLimit }) }
        };
      }
      workerSerial += 1;
      const dispatchId = `worker-dispatch-${now}-${workerSerial}`;
      const expeditions = createWorkerExpeditionBatch(
        dispatchId,
        selectedWorkers,
        resource,
        validTier,
        buildingLevelValue,
        now,
      );
      result = "sent";
      return {
        ...state,
        workerProductionQueue: reconciled.queue,
        idleWorkers: removeDispatchedWorkers(reconciled.idleWorkers, selectedWorkers),
        workerExpeditions: [...reconciledWorkplace.expeditions, ...expeditions],
        ...(resource === "bananas" ? { bananaGroveStorage: reconciledWorkplace.storage } : resource === "wood" ? { lumberCampStorage: reconciledWorkplace.storage } : { stoneQuarryStorage: reconciledWorkplace.storage }),
        ...advanceDailyMissionBy(
          state,
          "workShift",
          workerDispatchQuestCredit("sent"),
          now
        ),
        feedback: {
          id: now,
          text: t("worker.batchSent", state.language, { n: selectedWorkers.length, resource: t(`res.${resource}`, state.language) })
        }
      };
    });
    return result;
  },
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
      const grant = addResourcesCapped(
        state.resources,
        { [expedition.resource]: expedition.reward },
        storageCap(buildingLevel(state.buildings, "clanHall"))
      );
      const collected = grant.received[expedition.resource];
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
        resources: grant.resources,
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
        (entry) => entry.resource === "bananas" && isWorkerRewardFullyStored(entry)
      );
      if (finished.length === 0 && grove.storage <= 0) {
        return {
          ...state,
          workerExpeditions: grove.expeditions,
          bananaGroveStorage: grove.storage
        };
      }
      const grant = addResourcesCapped(
        state.resources,
        { bananas: grove.storage },
        storageCap(buildingLevel(state.buildings, "clanHall"))
      );
      const collected = grant.received.bananas;
      const remainingStorage = Math.max(0, grove.storage - collected);
      summary = {
        collected,
        remainingStorage,
        workerClasses: finished.map((entry) => entry.workerClass)
      };
      return {
        ...state,
        resources: grant.resources,
        workerExpeditions: grove.expeditions.filter(
          (entry) => !(entry.resource === "bananas" && isWorkerRewardFullyStored(entry))
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
      const finished = camp.expeditions.filter(
        (entry) => entry.resource === "wood" && isWorkerRewardFullyStored(entry) && isLumberWorkerClass(entry.workerClass)
      );
      if (finished.length === 0 && camp.storage <= 0) {
        return { ...state, workerExpeditions: camp.expeditions, lumberCampStorage: camp.storage };
      }
      const grant = addResourcesCapped(state.resources, { wood: camp.storage }, storageCap(buildingLevel(state.buildings, "clanHall")));
      const collected = grant.received.wood;
      const remainingStorage = Math.max(0, camp.storage - collected);
      const expectedReward = finished.reduce((sum, entry) => sum + entry.expectedReward, 0);
      const reward = finished.reduce((sum, entry) => sum + entry.reward, 0);
      const storedReward = finished.reduce((sum, entry) => sum + (entry.storedReward ?? 0), 0);
      const outcome = finished.length === 0 ? undefined : reward >= expectedReward ? "success" : reward > 0 ? "half" : "empty";
      const workerClasses = finished.map((entry) => entry.workerClass as LumberWorkerClass);
      const finishedIds = new Set(finished.map((entry) => entry.id));
      summary = {
        collected,
        remainingStorage,
        workerClass: workerClasses[0],
        workerClasses,
        workerCount: workerClasses.length,
        outcome,
        expectedReward,
        reward,
        storedReward
      };
      return {
        ...state,
        resources: grant.resources,
        workerExpeditions: camp.expeditions.filter((entry) => !finishedIds.has(entry.id)),
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
      const finished = quarry.expeditions.filter(
        (entry) => entry.resource === "stones" && isWorkerRewardFullyStored(entry) && isStoneWorkerClass(entry.workerClass)
      );
      if (finished.length === 0 && quarry.storage <= 0) {
        return { ...state, workerExpeditions: quarry.expeditions, stoneQuarryStorage: quarry.storage };
      }
      const grant = addResourcesCapped(state.resources, { stones: quarry.storage }, storageCap(buildingLevel(state.buildings, "clanHall")));
      const collected = grant.received.stones;
      const remainingStorage = Math.max(0, quarry.storage - collected);
      const expectedReward = finished.reduce((sum, entry) => sum + entry.expectedReward, 0);
      const reward = finished.reduce((sum, entry) => sum + entry.reward, 0);
      const storedReward = finished.reduce((sum, entry) => sum + (entry.storedReward ?? 0), 0);
      const outcome = finished.length === 0 ? undefined : reward >= expectedReward ? "success" : reward > 0 ? "half" : "empty";
      const workerClasses = finished.map((entry) => entry.workerClass as StoneWorkerClass);
      const finishedIds = new Set(finished.map((entry) => entry.id));
      summary = {
        collected,
        remainingStorage,
        workerClass: workerClasses[0],
        workerClasses,
        workerCount: workerClasses.length,
        outcome,
        expectedReward,
        reward,
        storedReward
      };
      return {
        ...state,
        resources: grant.resources,
        workerExpeditions: quarry.expeditions.filter((entry) => !finishedIds.has(entry.id)),
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
      const grant = addResourcesCapped(
        state.resources,
        reward,
        storageCap(buildingLevel(state.buildings, "clanHall"))
      );
      return {
        ...state,
        resources: grant.resources,
        gems: state.gems + (reward.gems ?? 0),
        questProgress,
        questsClaimed: [...questsClaimed, id],
        questDayKey: day,
        feedback: {
          id: now,
          text: cappedGrantFeedback(grant, state.language, "fb.questClaimed")
        }
      };
    }),
  dismissOfflineReport: () => set(() => ({ offlineReport: null })),
  buyShopItem: (id: string) =>
    set((state) => {
      const item = getResourceShopItem(id);
      if (!item) {
        return state;
      }
      if (state.gems < item.gemCost) {
        return { ...state, feedback: { id: Date.now(), text: t("fb.needGems", state.language) } };
      }
      const now = Date.now();
      const cap = storageCap(buildingLevel(state.buildings, "clanHall"));
      const grant = addResourcesCapped(state.resources, item.reward, cap);
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
        resources: grant.resources,
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

      const unlockedProfileMonkeys = [...state.unlockedProfileMonkeys, id];
      const palaceVisibility = setRoyalCharacterVisibility(
        state.royalCharacterDisplays,
        id,
        true,
        buildingLevel(state.buildings, "royalPalace"),
        unlockedProfileMonkeys
      );

      const next: GameState = {
        ...state,
        gems: Math.max(0, state.gems - monkey.price),
        unlockedProfileMonkeys,
        ownedProfileSkins: Array.from(
          new Set([...state.ownedProfileSkins, getDefaultSkinId(id)])
        ),
        newProfileMonkeys: [...state.newProfileMonkeys, id],
        newProfileSkins: Array.from(
          new Set([...state.newProfileSkins, getDefaultSkinId(id)])
        ),
        royalCharacterDisplays: palaceVisibility.result === "placed"
          ? palaceVisibility.displays
          : state.royalCharacterDisplays
      };
      result = "unlocked";
      void persistVillage(next);
      return next;
    });
    return result;
  },
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
  openFestivalChest: () => {
    let result: FestivalChestOpenResult = { status: "complete" };
    set((state) => {
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
          free: false,
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
      const palaceVisibility = grant.unlockMonkeyId
        ? setRoyalCharacterVisibility(
            state.royalCharacterDisplays,
            grant.unlockMonkeyId,
            true,
            buildingLevel(state.buildings, "royalPalace"),
            unlockedProfileMonkeys
          )
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
        royalCharacterDisplays: palaceVisibility?.result === "placed"
          ? palaceVisibility.displays
          : state.royalCharacterDisplays,
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
      const royalCharacterDisplays = lodgeUpgrade.completed && lodgeUpgrade.completedBuildingType === "royalPalace"
        ? revealNewRoyalCharacters(
            state.royalCharacterDisplays,
            state.activeWorkerLodgeUpgrade?.fromLevel ?? 0,
            state.activeWorkerLodgeUpgrade?.targetLevel ?? 0,
            state.unlockedProfileMonkeys
          )
        : state.royalCharacterDisplays;
      return {
        ...state,
        buildings: lodgeUpgrade.buildings,
        activeWorkerLodgeUpgrade: lodgeUpgrade.activeUpgrade,
        royalCharacterDisplays,
        workerProductionQueue: reconciled.queue,
        idleWorkers: reconciled.idleWorkers,
        workerExpeditions: stone.expeditions,
        bananaGroveStorage: grove.storage,
        lumberCampStorage: lumber.storage,
        stoneQuarryStorage: stone.storage,
        feedback: reconciled.completed.length > 0
          ? { id: now, text: t("worker.productionReady", state.language) }
          : lodgeUpgrade.completed
            ? { id: now, text: t(lodgeUpgrade.completedBuildingType === "royalPalace" ? "royalPalace.upgradeComplete" : "workerLodge.upgradeComplete", state.language) }
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
      const royalCharacterDisplays = lodgeUpgrade.completed && lodgeUpgrade.completedBuildingType === "royalPalace"
        ? revealNewRoyalCharacters(
            state.royalCharacterDisplays,
            state.activeWorkerLodgeUpgrade?.fromLevel ?? 0,
            state.activeWorkerLodgeUpgrade?.targetLevel ?? 0,
            state.unlockedProfileMonkeys
          )
        : state.royalCharacterDisplays;
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
        game.feedbackText = t(lodgeUpgrade.completedBuildingType === "royalPalace" ? "royalPalace.upgradeComplete" : "workerLodge.upgradeComplete", state.language);
      } else if (reconciledGrove.completed > 0) {
        game.feedbackText = t("bananaGrove.harvestReady", state.language);
      } else if (reconciledLumber.completed > 0) {
        game.feedbackText = t("lumberCamp.harvestReady", state.language);
      } else if (reconciledStone.completed > 0) {
        game.feedbackText = t("stoneQuarry.harvestReady", state.language);
      }

      if (state.gameMode === "raid" && state.raidStatus === "active") {
        const deployedUnitIds = new Set(state.activeRaidUnitIds);
        assignRaidOrders(units, deployedUnitIds);

        for (const unit of units) {
          if (
            unit.owner === "enemy" ||
            (unit.owner === "player" && deployedUnitIds.has(unit.id) && isCombatant(unit))
          ) {
            processUnit(unit, game, now);
          }
        }

        const raidFightersAlive = units.some(
          (unit) =>
            unit.owner === "player" &&
            deployedUnitIds.has(unit.id) &&
            isCombatant(unit) &&
            unit.state !== "dead" &&
            unit.hp > 0
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
            (unit) =>
              unit.owner === "player" &&
              deployedUnitIds.has(unit.id) &&
              isCombatant(unit)
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
          const gemReward = camp
            ? resolveCampRaidGemReward(camp.id, stars, previousVictories)
            : { gems: 0, reason: "none" as const };

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
            royalCharacterDisplays,
            enemyCampHp: 0,
            raidStars: stars,
            raidVictoryCounts,
            lastRaidReward: {
              loot,
              discardedLoot: reward.discardedLoot,
              multiplier: rewardMultiplier,
              gems: gemReward.gems,
              gemReason: gemReward.reason
            },
            gems: state.gems + gemReward.gems,
            ...advanceDailyMission(state, "winRaid", now),
            lastRaidPenalty: null,
            lastRaidArmyResult: summarizeRaidArmy(
              game.units,
              state.activeRaidUnitIds
            ),
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
            royalCharacterDisplays,
            enemyCampHp: game.enemyCampHp,
            feedback: { id: now, text: t("fb.raidFailed", state.language) },
            raidStatus: "defeat",
            lastRaidPenalty: { reason: "defeat", amounts: penalized.amounts },
            lastRaidArmyResult: summarizeRaidArmy(
              game.units,
              state.activeRaidUnitIds
            )
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
          royalCharacterDisplays,
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
        royalCharacterDisplays,
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
function villageSavePayload(state: GameState): VillageSave {
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
    processedIapTransactionIds: state.processedIapTransactionIds,
    redeemedQaCodes: state.redeemedQaCodes,
    unlockedProfileMonkeys: state.unlockedProfileMonkeys,
    ownedProfileSkins: state.ownedProfileSkins,
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
    royalPalaceVersion: ROYAL_PALACE_SAVE_VERSION,
    royalCharacterDisplays: state.royalCharacterDisplays,
    language: state.language,
    raidLevel: state.raidLevel,
    raidVictoryCounts: state.raidVictoryCounts,
    raidRewardVersion: RAID_REWARD_VERSION,
    questProgress: state.questProgress,
    questsClaimed: state.questsClaimed,
    questDayKey: state.questDayKey,
    dailyStreak: state.dailyStreak,
    dailyLastClaim: state.dailyLastClaim,
    lastSeenAt: Date.now()
  };
  return payload;
}

let persistenceQueue: Promise<void> = Promise.resolve();

function enqueuePersistence<T>(operation: () => Promise<T>) {
  const result = persistenceQueue.then(operation);
  persistenceQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function writeVillageSnapshot(state: GameState) {
  return AsyncStorage.setItem(SAVE_KEY, JSON.stringify(villageSavePayload(state)));
}

function persistVillage(_requestedState?: GameState) {
  // Resolve the latest store state only when this queued write executes. This
  // prevents an older throttled snapshot from overwriting a completed IAP
  // delivery that was persisted ahead of it.
  return enqueuePersistence(() => writeVillageSnapshot(useGameStore.getState()));
}

export type IapGemDeliveryResult =
  | { status: "delivered"; gems: number }
  | { status: "already-delivered"; gems: number }
  | { status: "unknown-product"; gems: 0 };

/**
 * Atomically persists the Gem grant and idempotency marker in the one village
 * save record. StoreKit must only finish the transaction after this resolves.
 */
export function deliverStoreKitGemPurchase(
  transactionId: string,
  productId: string
): Promise<IapGemDeliveryResult> {
  return enqueuePersistence(async () => {
    const state = useGameStore.getState();
    const pack = getGemPackByProductId(productId);
    if (!pack) {
      return { status: "unknown-product", gems: 0 };
    }
    if (state.processedIapTransactionIds.includes(transactionId)) {
      return { status: "already-delivered", gems: pack.gems };
    }

    const processedIapTransactionIds = [
      ...state.processedIapTransactionIds,
      transactionId
    ];
    const gems = state.gems + pack.gems;
    const persistedState = {
      ...state,
      gems,
      processedIapTransactionIds
    };

    await writeVillageSnapshot(persistedState);
    useGameStore.setState({ gems, processedIapTransactionIds });
    return { status: "delivered", gems: pack.gems };
  });
}

/** Flushes the latest reconciled village snapshot before the app is suspended. */
export function flushVillageSave() {
  const state = useGameStore.getState();
  if (state.gameStatus !== "playing") {
    return Promise.resolve();
  }
  return persistVillage();
}

/** Persists the current village even while Settings is open from the main menu. */
export function persistVillageNow() {
  return persistVillage();
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
    void persistVillage();
    return;
  }
  if (now - lastSaveAt < 3000) {
    return;
  }
  lastSaveAt = now;
  void persistVillage();
});
