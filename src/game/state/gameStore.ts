import { create } from "zustand";
import {
  ATTACK_INTERVAL_MS,
  BOARD_SIZE,
  CAMP_MAX_HP,
  ENEMY_CAMP,
  ENEMY_DETECTION_RANGE,
  ENEMY_SPAWN_INTERVAL_MS,
  GATHER_AMOUNTS,
  GATHER_DURATION_MS,
  MOVE_INTERVAL_MS,
  PLAYER_CAMP,
  STARTING_RESOURCES,
  UNIT_COSTS
} from "../config/constants";
import { createInitialMap, createInitialUnits, createUnit } from "../config/map";
import type {
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
  playerCampHp: number;
  enemyCampHp: number;
};

function createFreshState(now: number) {
  return {
    currentScreen: "menu" as const,
    gameStatus: "menu" as const,
    mapTiles: createInitialMap(),
    units: createInitialUnits(now),
    selectedUnitId: null,
    resources: { ...STARTING_RESOURCES },
    playerCampHp: CAMP_MAX_HP,
    enemyCampHp: CAMP_MAX_HP,
    nextEnemySpawnAt: now + ENEMY_SPAWN_INTERVAL_MS
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
  return resources.bananas >= cost.bananas && resources.stones >= cost.stones;
}

function spendResources(resources: Resources, cost: Resources): Resources {
  return {
    bananas: resources.bananas - cost.bananas,
    stones: resources.stones - cost.stones
  };
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
  } else if (unit.target.kind === "camp") {
    if (unit.target.owner === "player") {
      game.playerCampHp = Math.max(0, game.playerCampHp - unit.attack);
    } else {
      game.enemyCampHp = Math.max(0, game.enemyCampHp - unit.attack);
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

function createPlayerUnit(state: GameState, type: "worker" | "fighter") {
  if (state.gameStatus !== "playing") {
    return state;
  }

  const cost = UNIT_COSTS[type];
  if (!hasResources(state.resources, cost)) {
    return state;
  }

  const now = Date.now();
  const spawn = findSpawnPosition(state.units, "player");
  return {
    ...state,
    resources: spendResources(state.resources, cost),
    units: [
      ...state.units,
      createUnit(`player-${type}-${now}`, type, "player", spawn.x, spawn.y, now)
    ]
  };
}

const initialNow = Date.now();
const initialState = createFreshState(initialNow);

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  startGame: () =>
    set(() => ({
      ...createFreshState(Date.now()),
      currentScreen: "game",
      gameStatus: "playing"
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
  createWorker: () => set((state) => createPlayerUnit(state, "worker")),
  trainFighter: () => set((state) => createPlayerUnit(state, "fighter")),
  tickGame: (now = Date.now()) =>
    set((state) => {
      if (state.gameStatus !== "playing") {
        return state;
      }

      const units = state.units.map(cloneUnit);
      const game: MutableGame = {
        units,
        resources: { ...state.resources },
        playerCampHp: state.playerCampHp,
        enemyCampHp: state.enemyCampHp
      };
      let nextEnemySpawnAt = state.nextEnemySpawnAt;

      if (now >= nextEnemySpawnAt) {
        const spawn = findSpawnPosition(units, "enemy");
        units.push(
          createUnit(`enemy-fighter-${now}`, "fighter", "enemy", spawn.x, spawn.y, now)
        );
        nextEnemySpawnAt = now + ENEMY_SPAWN_INTERVAL_MS;
      }

      assignEnemyOrders(units);

      for (const unit of units) {
        processUnit(unit, game, now);
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
        hasResources(game.resources, UNIT_COSTS.fighter);

      if (game.enemyCampHp <= 0) {
        return {
          ...state,
          ...game,
          selectedUnitId: null,
          currentScreen: "result",
          gameStatus: "victory",
          nextEnemySpawnAt
        };
      }

      if (game.playerCampHp <= 0 || (!playerUnitsAlive && !canRecover)) {
        return {
          ...state,
          ...game,
          selectedUnitId: null,
          currentScreen: "result",
          gameStatus: "defeat",
          nextEnemySpawnAt
        };
      }

      return {
        ...state,
        ...game,
        selectedUnitId,
        nextEnemySpawnAt
      };
    }),
  resetGame: () =>
    set(() => ({
      ...createFreshState(Date.now()),
      currentScreen: "game",
      gameStatus: "playing"
    })),
  goToMenu: () =>
    set(() => ({
      ...createFreshState(Date.now()),
      currentScreen: "menu",
      gameStatus: "menu"
    }))
}));
