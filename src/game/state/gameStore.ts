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
  UNIT_COSTS,
  VILLAGE_REGEN_PER_SEC,
  WATCH_TOWER_DAMAGE_REDUCTION,
  WORKER_BOOST,
  WORK_SHIFT_MS
} from "../config/constants";
import {
  BUILDING_PRODUCTION,
  DEFAULT_BUILDINGS,
  buildingName,
  populationCap,
  upgradeCost
} from "../config/buildings";
import { STRONGHOLD_BASE_LEVEL, getCamp, campName, type RaidCamp } from "../config/camps";
import { t } from "../i18n";
import { createInitialMap, createInitialUnits, createUnit } from "../config/map";
import type {
  GameState,
  GatherTarget,
  Lang,
  Owner,
  Position,
  ProductionItem,
  Resources,
  Unit,
  UnitTarget,
  UnitType,
  VillageBuilding,
  VillageBuildingType,
  VillageSave
} from "../types/game";

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

// Units that fight in a raid (as opposed to workers).
function isCombatant(unit: Unit) {
  return unit.type === "fighter" || unit.type === "archer";
}

function cloneBuildings(buildings: VillageBuilding[]): VillageBuilding[] {
  return buildings.map((building) => ({ ...building }));
}

// Monotonic counter so units created in the same millisecond still get
// unique ids (Date.now() alone collides on rapid creation / fast taps).
let unitSerial = 0;

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
    productionQueue: [] as ProductionItem[],
    playerCampHp: CAMP_MAX_HP,
    enemyCampHp: CAMP_MAX_HP,
    enemyCampMaxHp: CAMP_MAX_HP,
    activeCampId: null,
    raidStars: 0,
    raidLevel: STRONGHOLD_BASE_LEVEL,
    workShiftUntil: null as number | null,
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

  const step = nextStepToward(unit, target);
  if (!isInsideBoard(step.x, step.y)) {
    unit.state = "idle";
    unit.target = undefined;
    return;
  }

  unit.x = step.x;
  unit.y = step.y;
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

  if (now - unit.lastActionAt < ATTACK_INTERVAL_MS) {
    return;
  }

  if (unit.target.kind === "unit") {
    damageUnit(game.units, unit.target.unitId, unit.attack);
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
      game.enemyCampHp = Math.max(0, game.enemyCampHp - unit.attack);
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

const ENEMY_DEPLOY_SPOTS: Position[] = [
  { x: 8, y: 2 },
  { x: 7, y: 1 },
  { x: 9, y: 1 },
  { x: 8, y: 3 },
  { x: 9, y: 3 }
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
          x: 6 + (slot % 2),
          y: 3 + Math.floor(slot / 2),
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

  const cost = UNIT_COSTS[type];
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
    finishAt: now + PRODUCTION_DURATION_MS[type]
  };

  return {
    ...state,
    resources: spendResources(state.resources, cost),
    productionQueue: [...state.productionQueue, queueItem],
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
      units: createInitialUnits(Date.now()),
      playerCampHp: CAMP_MAX_HP,
      enemyCampHp: CAMP_MAX_HP,
      activeCampId: null,
      raidStars: 0,
      lastProductionAt: Date.now(),
      feedback: null
    })),
  hydrate: (save: VillageSave) =>
    set((state) => {
      const levels = new Map(save.buildings.map((building) => [building.type, building.level]));
      return {
        buildings: DEFAULT_BUILDINGS.map((building) => ({
          type: building.type,
          level: levels.get(building.type) ?? building.level
        })),
        resources: { ...save.resources },
        maxPopulation: save.maxPopulation,
        gems: save.gems ?? state.gems,
        productionQueue: save.productionQueue ?? [],
        language: save.language ?? state.language,
        raidLevel: save.raidLevel ?? STRONGHOLD_BASE_LEVEL,
        workShiftUntil: save.workShiftUntil ?? null,
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
        units: deployRaidUnits(state.units, now, camp),
        lastProductionAt: now,
        feedback: {
          id: now,
          text: t("fb.raidStarted", state.language, { name: campName(camp.id, state.language) })
        }
      };
    }),
  returnToVillage: () =>
    set((state) => ({
      ...state,
      gameMode: "village",
      raidStatus: "idle",
      activeCampId: null,
      units: returnPlayerUnitsToVillage(state.units),
      lastProductionAt: Date.now(),
      feedback: { id: Date.now(), text: t("fb.returned", state.language) }
    })),
  createWorker: () => set((state) => createPlayerUnit(state, "worker")),
  sendWorkersToWork: () =>
    set((state) => {
      if (state.gameStatus !== "playing") {
        return state;
      }
      const now = Date.now();
      if (state.workShiftUntil != null && now < state.workShiftUntil) {
        return state;
      }
      const workers = state.units.filter(
        (unit) =>
          unit.owner === "player" && unit.type === "worker" && unit.state !== "dead" && unit.hp > 0
      ).length;
      if (workers <= 0) {
        return { ...state, feedback: { id: now, text: t("fb.noWorkers", state.language) } };
      }
      return {
        ...state,
        workShiftUntil: now + WORK_SHIFT_MS,
        feedback: {
          id: now,
          text: t("fb.workersSent", state.language, { n: Math.round(WORKER_BOOST * 100 * workers) })
        }
      };
    }),
  trainFighter: () => set((state) => createPlayerUnit(state, "fighter")),
  trainArcher: () => set((state) => createPlayerUnit(state, "archer")),
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
          const loot = camp ? camp.loot : RAID_REWARD;
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
            resources: {
              bananas: game.resources.bananas + loot.bananas,
              stones: game.resources.stones + loot.stones,
              wood: game.resources.wood + loot.wood
            },
            enemyCampHp: 0,
            raidStars: stars,
            gems: state.gems + stars,
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
          return {
            ...state,
            units: game.units,
            enemyCampHp: game.enemyCampHp,
            feedback: { id: now, text: t("fb.raidFailed", state.language) },
            raidStatus: "defeat"
          };
        }

        return {
          ...state,
          units: game.units,
          enemyCampHp: game.enemyCampHp,
          feedback: game.feedbackText ? { id: now, text: game.feedbackText } : state.feedback
        };
      }

      for (const unit of units) {
        if (unit.owner === "player") {
          processUnit(unit, game, now);
        }
      }

      // Passive resource production from leveled buildings (time-based).
      // Workers on a shift boost the whole village's output.
      const elapsedSeconds = Math.max(0, (now - state.lastProductionAt) / 1000);
      const workerCount = units.filter(
        (unit) =>
          unit.owner === "player" && unit.type === "worker" && unit.state !== "dead" && unit.hp > 0
      ).length;
      let workShiftUntil = state.workShiftUntil;
      const shiftActive = workShiftUntil != null && now < workShiftUntil;
      const productionBoost = shiftActive ? 1 + WORKER_BOOST * workerCount : 1;
      if (workShiftUntil != null && now >= workShiftUntil) {
        workShiftUntil = null;
        game.feedbackText = t("fb.workersReturned", state.language);
      }
      for (const building of game.buildings) {
        const production = BUILDING_PRODUCTION[building.type];
        if (production) {
          game.resources[production.resource] +=
            production.perSecond * building.level * elapsedSeconds * productionBoost;
        }
      }

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
          game.units.push(
            createUnit(`player-${item.type}-${now}-${unitSerial}`, item.type, "player", spawn.x, spawn.y, now)
          );
        }
        productionQueue = productionQueue.filter((item) => item.finishAt > now);
        const lastType = ready[ready.length - 1]?.type ?? "worker";
        game.feedbackText = t(`fb.trained.${lastType}`, state.language);
      }

      const playerUnitsAlive = units.some(
        (unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0
      );
      const canRecover =
        hasResources(game.resources, UNIT_COSTS.worker) ||
        (buildingLevel(state.buildings, "trainingNest") > 0 &&
          hasResources(game.resources, UNIT_COSTS.fighter));
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
        workShiftUntil,
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
  const payload: VillageSave = {
    buildings: state.buildings,
    resources: state.resources,
    maxPopulation: state.maxPopulation,
    gems: state.gems,
    productionQueue: state.productionQueue,
    language: state.language,
    raidLevel: state.raidLevel,
    workShiftUntil: state.workShiftUntil
  };
  void AsyncStorage.setItem(SAVE_KEY, JSON.stringify(payload));
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
  persistVillage(state);
});
