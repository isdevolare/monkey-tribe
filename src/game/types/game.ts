export type ScreenId = "menu" | "game" | "result";
export type GameStatus = "menu" | "playing" | "victory" | "defeat";
export type GameMode = "village" | "raidMap" | "raid";
export type RaidStatus = "idle" | "active" | "victory" | "defeat";
export type Owner = "player" | "enemy";
export type ResourceKind = "bananas" | "stones" | "wood";
export type VillageBuildingType =
  | "clanHall"
  | "lumberCamp"
  | "stoneQuarry"
  | "bananaGrove"
  | "workerShelter"
  | "trainingNest"
  | "watchTower";
export type VillageBuilding = {
  type: VillageBuildingType;
  level: number;
};
export type TileType =
  | "grass"
  | "jungle"
  | "mudPath"
  | "bananaTree"
  | "stoneRock"
  | "woodGrove"
  | "bush"
  | "playerCamp"
  | "enemyCamp"
  | "empty";

export type UnitType = "worker" | "fighter" | "archer" | "guardian";
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
  variant: number;
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
  wood: number;
};

export type FeedbackMessage = {
  id: number;
  text: string;
};

export type Lang = "tr" | "en";

export type ProductionItem = {
  id: string;
  type: UnitType;
  finishAt: number;
};

export type ActiveWorkTask = {
  startedAt: number;
  endsAt: number;
  accruedUntil: number;
  workerCount: number;
  productionPerSecond: Resources;
};

// What a quest counts toward; cumulative per metric so tiered quests
// (train 3 / train 10) share one counter.
export type QuestMetric = "trainAny" | "upgradeAny" | "winRaid" | "workShift";

export type VillageSave = {
  buildings: VillageBuilding[];
  resources: Resources;
  maxPopulation: number;
  gems?: number;
  productionQueue?: ProductionItem[];
  language?: Lang;
  raidLevel?: number;
  activeWorkTask?: ActiveWorkTask | null;
  /** Legacy save field. Hydration cancels it instead of replaying old production. */
  workShiftUntil?: number | null;
  questProgress?: Partial<Record<QuestMetric, number>>;
  questsClaimed?: string[];
  lastSeenAt?: number;
  dailyStreak?: number;
  dailyLastClaim?: string | null;
  /** Alive units by type; the army is respawned from this on load. */
  unitCounts?: Partial<Record<UnitType, number>>;
};

// Summary shown when the player returns after being away.
export type OfflineReport = {
  bananas: number;
  stones: number;
  wood: number;
  durationMs: number;
};

export type GameState = {
  currentScreen: ScreenId;
  gameStatus: GameStatus;
  gameMode: GameMode;
  raidStatus: RaidStatus;
  mapTiles: Tile[];
  units: Unit[];
  resources: Resources;
  buildings: VillageBuilding[];
  maxPopulation: number;
  gems: number;
  productionQueue: ProductionItem[];
  playerCampHp: number;
  enemyCampHp: number;
  enemyCampMaxHp: number;
  activeCampId: string | null;
  raidStars: number;
  raidLevel: number;
  activeWorkTask: ActiveWorkTask | null;
  /** UI compatibility projection of activeWorkTask.endsAt. */
  workShiftUntil: number | null;
  questProgress: Partial<Record<QuestMetric, number>>;
  questsClaimed: string[];
  offlineReport: OfflineReport | null;
  dailyStreak: number;
  dailyLastClaim: string | null;
  lastProductionAt: number;
  language: Lang;
  feedback: FeedbackMessage | null;
  startGame: () => void;
  hydrate: (save: VillageSave) => void;
  setLanguage: (lang: Lang) => void;
  createWorker: () => void;
  sendWorkersToWork: () => void;
  claimQuest: (id: string) => void;
  dismissOfflineReport: () => void;
  claimDaily: () => void;
  buyShopItem: (id: string) => void;
  trainFighter: () => void;
  trainArcher: () => void;
  trainGuardian: () => void;
  rushProduction: () => void;
  openRaidMap: () => void;
  closeRaidMap: () => void;
  startRaidOn: (campId: string) => void;
  returnToVillage: () => void;
  upgradeBuilding: (type: VillageBuildingType) => void;
  reconcileWorkTask: (now?: number) => void;
  tickGame: (now?: number) => void;
  resetGame: () => void;
  goToMenu: () => void;
};
