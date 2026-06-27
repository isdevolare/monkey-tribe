export type ScreenId = "menu" | "game" | "result";
export type GameStatus = "menu" | "playing" | "victory" | "defeat";
export type Owner = "player" | "enemy";
export type ResourceKind = "bananas" | "stones";
export type TileType =
  | "grass"
  | "bananaTree"
  | "stoneRock"
  | "playerCamp"
  | "enemyCamp"
  | "empty";

export type UnitType = "worker" | "fighter";
export type UnitState =
  | "idle"
  | "moving"
  | "gathering"
  | "returning"
  | "attacking"
  | "dead";

export type Position = {
  x: number;
  y: number;
};

export type Tile = Position & {
  type: TileType;
};

export type CarriedResource = {
  kind: ResourceKind;
  amount: number;
};

export type GatherTarget = Position & {
  resource: ResourceKind;
};

export type UnitTarget =
  | ({ kind: "tile" } & Position)
  | ({ kind: "unit"; unitId: string })
  | { kind: "camp"; owner: Owner };

export type Unit = Position & {
  id: string;
  type: UnitType;
  owner: Owner;
  hp: number;
  maxHp: number;
  attack: number;
  range: number;
  state: UnitState;
  carriedResource: CarriedResource | null;
  target?: UnitTarget;
  gatherTarget?: GatherTarget;
  lastStepAt: number;
  lastActionAt: number;
};

export type Resources = {
  bananas: number;
  stones: number;
};

export type GameState = {
  currentScreen: ScreenId;
  gameStatus: GameStatus;
  mapTiles: Tile[];
  units: Unit[];
  selectedUnitId: string | null;
  resources: Resources;
  playerCampHp: number;
  enemyCampHp: number;
  nextEnemySpawnAt: number;
  startGame: () => void;
  selectUnit: (unitId: string | null) => void;
  commandMove: (x: number, y: number) => void;
  commandGather: (x: number, y: number, resource: ResourceKind) => void;
  commandAttack: (target: UnitTarget) => void;
  createWorker: () => void;
  trainFighter: () => void;
  tickGame: (now?: number) => void;
  resetGame: () => void;
  goToMenu: () => void;
};
