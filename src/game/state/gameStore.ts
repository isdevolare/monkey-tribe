import { create } from "zustand";
import {
  ATTACK_INTERVAL_MS,
  BOARD_SIZE,
  CAMP_MAX_HP,
  ENEMY_CAMP,
  ENEMY_DETECTION_RANGE,
  MOVE_INTERVAL_MS,
  PLAYER_CAMP,
  RAID_REWARD,
  STARTING_RESOURCES,
  UNIT_COSTS,
  WATCH_TOWER_DAMAGE_REDUCTION
} from "../config/constants";
import {
  BUILDING_NAMES,
  BUILDING_PRODUCTION,
  DEFAULT_BUILDINGS,
  populationCap,
  upgradeCost
} from "../config/buildings";
import { createInitialMap, createInitialUnits, createUnit } from "../config/map";
import type {
  GameState,
  GatherTarget,
  Owner,
  Position,
  Resources,
  Unit,
  UnitTarget,
  VillageBuilding,
  VillageBuildingType
} from "../types/game";

type MutableGame = {
  units: Unit[];
  resources: Resources;
  buildings: VillageBuilding[];
  maxPopulation: number;
  playerCampHp: number;
  enemyCampHp: number;
  feedbackText: string | null;
};

function buildingLevel(buildings: VillageBuilding[], type: VillageBuildingType) {
  return buildings.find((building) => building.type === type)?.level ?? 0;
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
    playerCampHp: CAMP_MAX_HP,
    enemyCampHp: CAMP_MAX_HP,
    lastProductionAt: now,
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
    game.feedbackText =
      unit.owner === "player"
        ? `${unit.type === "fighter" ? "Fighter" : "Worker"} attacked enemy`
        : "Enemy fighter struck back";
  } else if (unit.target.kind === "camp") {
    if (unit.target.owner === "player") {
      const blocked =
        buildingLevel(game.buildings, "watchTower") * WATCH_TOWER_DAMAGE_REDUCTION;
      const damage = Math.max(1, unit.attack - blocked);
      game.playerCampHp = Math.max(0, game.playerCampHp - damage);
      game.feedbackText =
        blocked > 0 ? `Gözetleme Kulesi ${blocked} hasar engelledi` : "Düşman köyüne saldırdı";
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

  if (type === "fighter" && buildingLevel(state.buildings, "trainingNest") <= 0) {
    return {
      ...state,
      feedback: { id: Date.now(), text: "Savaşçı için Eğitim Yuvası gerekli" }
    };
  }

  if (currentPopulation(state.units) >= state.maxPopulation) {
    return {
      ...state,
      feedback: { id: Date.now(), text: "İşçi Barınağı'nı geliştir, kapasite dolu" }
    };
  }

  const cost = UNIT_COSTS[type];
  if (!hasResources(state.resources, cost)) {
    return {
      ...state,
      feedback: { id: Date.now(), text: `${type === "worker" ? "İşçi" : "Savaşçı"} için ${costText(cost)} gerek` }
    };
  }

  const now = Date.now();
  unitSerial += 1;
  const spawn = findSpawnPosition(state.units, "player");
  return {
    ...state,
    resources: spendResources(state.resources, cost),
    units: [
      ...state.units,
      createUnit(`player-${type}-${now}-${unitSerial}`, type, "player", spawn.x, spawn.y, now)
    ],
    feedback: {
      id: now,
      text: type === "worker" ? "İşçi tribe'a katıldı" : "Savaşçı eğitildi"
    }
  };
}

function upgradeVillageBuilding(state: GameState, type: VillageBuildingType): GameState {
  if (state.gameStatus !== "playing") {
    return state;
  }

  const level = buildingLevel(state.buildings, type);
  const name = BUILDING_NAMES[type];

  // Other buildings cannot exceed the Clan Hall level (it gates progression).
  if (type !== "clanHall" && level >= buildingLevel(state.buildings, "clanHall")) {
    return {
      ...state,
      feedback: { id: Date.now(), text: `Önce Klan Salonu'nu geliştir` }
    };
  }

  const cost = upgradeCost(type, level);
  if (!hasResources(state.resources, cost)) {
    return {
      ...state,
      feedback: { id: Date.now(), text: `${name} için ${costText(cost)} gerek` }
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
    feedback: { id: now, text: `${name} Seviye ${level + 1}` }
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
      gameStatus: "playing",
      gameMode: "village",
      raidStatus: "idle"
    })),
  upgradeBuilding: (type) => set((state) => upgradeVillageBuilding(state, type)),
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
          feedback: { id: now, text: "Önce savaşçı eğit" }
        };
      }

      return {
        ...state,
        gameMode: "raid",
        raidStatus: "active",
        enemyCampHp: CAMP_MAX_HP,
        units: deployRaidUnits(state.units, now),
        lastProductionAt: now,
        feedback: { id: now, text: "Baskın başladı! Savaşçılar saldırıyor." }
      };
    }),
  returnToVillage: () =>
    set((state) => ({
      ...state,
      gameMode: "village",
      raidStatus: "idle",
      units: returnPlayerUnitsToVillage(state.units),
      lastProductionAt: Date.now(),
      feedback: { id: Date.now(), text: "Baskın ekibi köye döndü" }
    })),
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
        buildings: cloneBuildings(state.buildings),
        maxPopulation: state.maxPopulation,
        playerCampHp: state.playerCampHp,
        enemyCampHp: state.enemyCampHp,
        feedbackText: null
      };

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
              bananas: game.resources.bananas + RAID_REWARD.bananas,
              stones: game.resources.stones + RAID_REWARD.stones,
              wood: game.resources.wood + RAID_REWARD.wood
            },
            enemyCampHp: 0,
            feedback: {
              id: now,
              text: `Raid victory! +${RAID_REWARD.bananas} bananas, +${RAID_REWARD.stones} stones, +${RAID_REWARD.wood} wood`
            },
            raidStatus: "victory"
          };
        }

        if (!raidFightersAlive) {
          return {
            ...state,
            units: game.units,
            enemyCampHp: game.enemyCampHp,
            feedback: { id: now, text: "Raid failed. Return and train more fighters" },
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
      const elapsedSeconds = Math.max(0, (now - state.lastProductionAt) / 1000);
      for (const building of game.buildings) {
        const production = BUILDING_PRODUCTION[building.type];
        if (production) {
          game.resources[production.resource] +=
            production.perSecond * building.level * elapsedSeconds;
        }
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
