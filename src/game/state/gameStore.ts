import { create } from "zustand";
import {
  ATTACK_INTERVAL_MS,
  BASE_POPULATION_CAP,
  BOARD_SIZE,
  BUILDING_COSTS,
  CAMP_MAX_HP,
  ENEMY_CAMP,
  ENEMY_DETECTION_RANGE,
  ENEMY_SPAWN_INTERVAL_MS,
  GATHER_AMOUNTS,
  GATHER_DURATION_MS,
  HUT_POPULATION_BONUS,
  MOVE_INTERVAL_MS,
  PLAYER_CAMP,
  STARTING_BUILDINGS,
  STARTING_RESOURCES,
  UNIT_COSTS,
  WATCH_POST_DAMAGE_REDUCTION
} from "../config/constants";
import { createInitialMap, createInitialUnits, createUnit } from "../config/map";
import type {
  BuildingType,
  Buildings,
  GameState,
  GatherTarget,
  Owner,
  Position,
  ResourceKind,
  Resources,
  Unit,
  UnitTarget
} from "../types/game";

type MutableGame = {
  units: Unit[];
  resources: Resources;
  buildings: Buildings;
  maxPopulation: number;
  playerCampHp: number;
  enemyCampHp: number;
  feedbackText: string | null;
};

function createFreshState(now: number) {
  return {
    currentScreen: "menu" as const,
    gameStatus: "menu" as const,
    gameMode: "village" as const,
    raidStatus: "idle" as const,
    mapTiles: createInitialMap(),
    units: createInitialUnits(now),
    selectedUnitId: null,
    resources: { ...STARTING_RESOURCES },
    buildings: { ...STARTING_BUILDINGS },
    maxPopulation: BASE_POPULATION_CAP,
    playerCampHp: CAMP_MAX_HP,
    enemyCampHp: CAMP_MAX_HP,
    nextEnemySpawnAt: now + ENEMY_SPAWN_INTERVAL_MS,
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
    cost.bananas > 0 ? `${cost.bananas} bananas` : null,
    cost.stones > 0 ? `${cost.stones} stones` : null,
    cost.wood > 0 ? `${cost.wood} wood` : null
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

function processGathering(unit: Unit, game: MutableGame, now: number) {
  if (!unit.gatherTarget) {
    unit.state = "idle";
    return;
  }

  if (now - unit.lastActionAt < GATHER_DURATION_MS) {
    return;
  }

  unit.carriedResource = {
    kind: unit.gatherTarget.resource,
    amount: GATHER_AMOUNTS[unit.gatherTarget.resource]
  };
  unit.state = "returning";
  unit.target = { kind: "tile", ...PLAYER_CAMP };
  unit.lastActionAt = now;
  processReturning(unit, game, now);
}

function processReturning(unit: Unit, game: MutableGame, now: number) {
  if (distance(unit, PLAYER_CAMP) === 0) {
    if (unit.carriedResource) {
      const key = unit.carriedResource.kind;
      game.resources[key] += unit.carriedResource.amount;
      game.feedbackText = `Worker gathered +${unit.carriedResource.amount} ${key}`;
    }

    unit.carriedResource = null;
    unit.gatherTarget = undefined;
    unit.target = undefined;
    unit.state = "idle";
    return;
  }

  moveUnitToward(unit, PLAYER_CAMP, now);
}

function processMovement(unit: Unit, now: number) {
  if (!unit.target || unit.target.kind !== "tile") {
    unit.state = "idle";
    return;
  }

  const target = { x: unit.target.x, y: unit.target.y };
  if (distance(unit, target) === 0) {
    if (unit.type === "worker" && unit.gatherTarget) {
      unit.state = "gathering";
      unit.lastActionAt = now;
      return;
    }

    unit.state = "idle";
    unit.target = undefined;
    return;
  }

  moveUnitToward(unit, target, now);
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
    game.feedbackText =
      unit.owner === "player"
        ? `${unit.type === "fighter" ? "Fighter" : "Worker"} attacked enemy`
        : "Enemy fighter struck back";
  } else if (unit.target.kind === "camp") {
    if (unit.target.owner === "player") {
      const blocked = game.buildings.watchPost > 0 ? WATCH_POST_DAMAGE_REDUCTION : 0;
      const damage = Math.max(1, unit.attack - blocked);
      game.playerCampHp = Math.max(0, game.playerCampHp - damage);
      game.feedbackText =
        blocked > 0 ? `Watch Post blocked ${blocked} damage` : "Enemy attacked your camp";
    } else {
      game.enemyCampHp = Math.max(0, game.enemyCampHp - unit.attack);
      game.feedbackText = `${unit.type === "fighter" ? "Fighter" : "Worker"} attacked enemy camp`;
    }
  }

  unit.lastActionAt = now;
}

function processUnit(unit: Unit, game: MutableGame, now: number) {
  if (unit.state === "dead" || unit.hp <= 0) {
    unit.state = "dead";
    return;
  }

  if (unit.state === "gathering") {
    processGathering(unit, game, now);
  } else if (unit.state === "returning") {
    processReturning(unit, game, now);
  } else if (unit.state === "attacking") {
    processAttacking(unit, game, now);
  } else if (unit.state === "moving") {
    processMovement(unit, now);
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

function createRaidEnemies(now: number): Unit[] {
  return [
    createUnit(`raid-enemy-fighter-1-${now}`, "fighter", "enemy", 8, 2, now),
    createUnit(`raid-enemy-fighter-2-${now}`, "fighter", "enemy", 7, 1, now),
    createUnit(`raid-enemy-fighter-3-${now}`, "fighter", "enemy", 9, 1, now)
  ];
}

function deployRaidUnits(units: Unit[], now: number) {
  let fighterIndex = 0;

  return [
    ...units
      .filter((unit) => unit.owner === "player")
      .map((unit) => {
        if (unit.type !== "fighter" || unit.state === "dead" || unit.hp <= 0) {
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
    ...createRaidEnemies(now)
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

function assignRaidOrders(units: Unit[]) {
  assignEnemyOrders(units);

  for (const unit of units) {
    if (
      unit.owner === "player" &&
      unit.type === "fighter" &&
      unit.state !== "dead" &&
      unit.hp > 0 &&
      unit.state === "idle"
    ) {
      unit.state = "attacking";
      unit.target = { kind: "camp", owner: "enemy" };
    }
  }
}

function createPlayerUnit(state: GameState, type: "worker" | "fighter") {
  if (state.gameStatus !== "playing") {
    return state;
  }

  if (type === "fighter" && state.buildings.trainingNest <= 0) {
    return {
      ...state,
      feedback: { id: Date.now(), text: "Build a Training Nest to unlock fighters" }
    };
  }

  if (currentPopulation(state.units) >= state.maxPopulation) {
    return {
      ...state,
      feedback: { id: Date.now(), text: "Build a Hut to raise monkey capacity" }
    };
  }

  const cost = UNIT_COSTS[type];
  if (!hasResources(state.resources, cost)) {
    return {
      ...state,
      feedback: { id: Date.now(), text: `Need ${costText(cost)} for ${type}` }
    };
  }

  const now = Date.now();
  const spawn = findSpawnPosition(state.units, "player");
  return {
    ...state,
    resources: spendResources(state.resources, cost),
    units: [
      ...state.units,
      createUnit(`player-${type}-${now}`, type, "player", spawn.x, spawn.y, now)
    ],
    feedback: {
      id: now,
      text: type === "worker" ? "Worker joined the tribe" : "Fighter trained at the nest"
    }
  };
}

function buildPlayerBuilding(state: GameState, building: BuildingType) {
  if (state.gameStatus !== "playing") {
    return state;
  }

  if (state.buildings[building] > 0) {
    return {
      ...state,
      feedback: { id: Date.now(), text: "That building is already active" }
    };
  }

  const cost = BUILDING_COSTS[building];
  if (!hasResources(state.resources, cost)) {
    return {
      ...state,
      feedback: { id: Date.now(), text: `Need ${costText(cost)} to build ${buildingName(building)}` }
    };
  }

  const buildings = { ...state.buildings, [building]: state.buildings[building] + 1 };
  const now = Date.now();

  return {
    ...state,
    buildings,
    resources: spendResources(state.resources, cost),
    maxPopulation:
      building === "hut" ? state.maxPopulation + HUT_POPULATION_BONUS : state.maxPopulation,
    feedback: { id: now, text: `${buildingName(building)} built` }
  };
}

function buildingName(building: BuildingType) {
  if (building === "trainingNest") {
    return "Training Nest";
  }

  if (building === "watchPost") {
    return "Watch Post";
  }

  return "Hut";
}

const initialNow = Date.now();
const initialState = createFreshState(initialNow);

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  startGame: () =>
    set(() => ({
      ...createFreshState(Date.now()),
      currentScreen: "game",
      gameStatus: "playing",
      gameMode: "village",
      raidStatus: "idle"
    })),
  selectUnit: (unitId) =>
    set((state) => {
      if (!unitId) {
        return { ...state, selectedUnitId: null };
      }

      const unit = state.units.find(
        (candidate) =>
          candidate.id === unitId &&
          candidate.owner === "player" &&
          candidate.state !== "dead" &&
          candidate.hp > 0
      );

      return unit ? { ...state, selectedUnitId: unit.id } : state;
    }),
  commandMove: (x, y) =>
    set((state) => {
      if (!state.selectedUnitId || !isInsideBoard(x, y)) {
        return state;
      }

      return {
        ...state,
        units: state.units.map((unit) =>
          unit.id === state.selectedUnitId && unit.owner === "player"
            ? {
                ...unit,
                state: "moving",
                target: { kind: "tile", x, y },
                gatherTarget: undefined,
                carriedResource: null
              }
            : unit
        )
      };
    }),
  commandGather: (x, y, resource: ResourceKind) =>
    set((state) => {
      if (!state.selectedUnitId || !isInsideBoard(x, y)) {
        return state;
      }

      return {
        ...state,
        units: state.units.map((unit) =>
          unit.id === state.selectedUnitId &&
          unit.owner === "player" &&
          unit.type === "worker"
            ? {
                ...unit,
                state: "moving",
                target: { kind: "tile", x, y },
                gatherTarget: { x, y, resource },
                carriedResource: null
              }
            : unit
        )
      };
    }),
  commandAttack: (target) =>
    set((state) => {
      if (!state.selectedUnitId) {
        return state;
      }

      return {
        ...state,
        units: state.units.map((unit) =>
          unit.id === state.selectedUnitId && unit.owner === "player"
            ? {
                ...unit,
                state: "attacking",
                target,
                gatherTarget: undefined,
                carriedResource: null
              }
            : unit
        )
      };
    }),
  raidEnemyCamp: () =>
    set((state) => {
      const now = Date.now();
      const fighters = state.units.filter(
        (unit) =>
          unit.owner === "player" &&
          unit.type === "fighter" &&
          unit.state !== "dead" &&
          unit.hp > 0
      );

      if (fighters.length <= 0) {
        return {
          ...state,
          feedback: { id: now, text: "Train a fighter before raiding" }
        };
      }

      return {
        ...state,
        gameMode: "raid",
        raidStatus: "active",
        enemyCampHp: CAMP_MAX_HP,
        selectedUnitId: null,
        units: deployRaidUnits(state.units, now),
        feedback: { id: now, text: "Raid started. Fighters are attacking!" }
      };
    }),
  returnToVillage: () =>
    set((state) => ({
      ...state,
      gameMode: "village",
      raidStatus: "idle",
      selectedUnitId: null,
      units: returnPlayerUnitsToVillage(state.units),
      feedback: { id: Date.now(), text: "Raid party returned to the village" }
    })),
  createWorker: () => set((state) => createPlayerUnit(state, "worker")),
  trainFighter: () => set((state) => createPlayerUnit(state, "fighter")),
  buildHut: () => set((state) => buildPlayerBuilding(state, "hut")),
  buildTrainingNest: () => set((state) => buildPlayerBuilding(state, "trainingNest")),
  buildWatchPost: () => set((state) => buildPlayerBuilding(state, "watchPost")),
  tickGame: (now = Date.now()) =>
    set((state) => {
      if (state.gameStatus !== "playing") {
        return state;
      }

      const units = state.units.map(cloneUnit);
      const game: MutableGame = {
        units,
        resources: { ...state.resources },
        buildings: { ...state.buildings },
        maxPopulation: state.maxPopulation,
        playerCampHp: state.playerCampHp,
        enemyCampHp: state.enemyCampHp,
        feedbackText: null
      };
      let nextEnemySpawnAt = state.nextEnemySpawnAt;

      if (state.gameMode === "raid" && state.raidStatus === "active") {
        assignRaidOrders(units);

        for (const unit of units) {
          if (
            unit.owner === "enemy" ||
            (unit.owner === "player" && unit.type === "fighter")
          ) {
            processUnit(unit, game, now);
          }
        }

        const raidFightersAlive = units.some(
          (unit) =>
            unit.owner === "player" &&
            unit.type === "fighter" &&
            unit.state !== "dead" &&
            unit.hp > 0
        );

        if (game.enemyCampHp <= 0) {
          return {
            ...state,
            units: game.units,
            resources: {
              bananas: game.resources.bananas + 25,
              stones: game.resources.stones + 10,
              wood: game.resources.wood + 10
            },
            enemyCampHp: 0,
            feedback: { id: now, text: "Raid victory! +25 bananas, +10 stones, +10 wood" },
            selectedUnitId: null,
            raidStatus: "victory",
            nextEnemySpawnAt
          };
        }

        if (!raidFightersAlive) {
          return {
            ...state,
            units: game.units,
            enemyCampHp: game.enemyCampHp,
            feedback: { id: now, text: "Raid failed. Return and train more fighters" },
            selectedUnitId: null,
            raidStatus: "defeat",
            nextEnemySpawnAt
          };
        }

        return {
          ...state,
          units: game.units,
          enemyCampHp: game.enemyCampHp,
          feedback: game.feedbackText ? { id: now, text: game.feedbackText } : state.feedback,
          selectedUnitId: null,
          nextEnemySpawnAt
        };
      }

      for (const unit of units) {
        if (unit.owner === "player") {
          processUnit(unit, game, now);
        }
      }

      const selectedUnit = units.find((unit) => unit.id === state.selectedUnitId);
      const selectedUnitId =
        selectedUnit && selectedUnit.state !== "dead" && selectedUnit.hp > 0
          ? selectedUnit.id
          : null;
      const playerUnitsAlive = units.some(
        (unit) => unit.owner === "player" && unit.state !== "dead" && unit.hp > 0
      );
      const canRecover =
        hasResources(game.resources, UNIT_COSTS.worker) ||
        (state.buildings.trainingNest > 0 && hasResources(game.resources, UNIT_COSTS.fighter));
      const feedback = game.feedbackText
        ? { id: now, text: game.feedbackText }
        : state.feedback;
      const nextGame = {
        units: game.units,
        resources: game.resources,
        buildings: game.buildings,
        maxPopulation: game.maxPopulation,
        playerCampHp: game.playerCampHp,
        enemyCampHp: game.enemyCampHp
      };

      if (game.playerCampHp <= 0 || (!playerUnitsAlive && !canRecover)) {
        return {
          ...state,
          ...nextGame,
          feedback,
          selectedUnitId: null,
          currentScreen: "result",
          gameStatus: "defeat",
          nextEnemySpawnAt
        };
      }

      return {
        ...state,
        ...nextGame,
        feedback,
        selectedUnitId,
        nextEnemySpawnAt
      };
    }),
  resetGame: () =>
    set(() => ({
      ...createFreshState(Date.now()),
      currentScreen: "game",
      gameStatus: "playing",
      gameMode: "village",
      raidStatus: "idle"
    })),
  goToMenu: () =>
    set(() => ({
      ...createFreshState(Date.now()),
      currentScreen: "menu",
      gameStatus: "menu"
    }))
}));
