export type ScreenId = "menu" | "game" | "result";
export type GameStatus = "menu" | "playing" | "victory" | "defeat";
export type GameMode = "village" | "raidMap" | "raid";
export type RaidStatus = "idle" | "active" | "victory" | "defeat" | "retreat";
export type Owner = "player" | "enemy";
export type ResourceKind = "bananas" | "stones" | "wood";
export type VillageBuildingType =
  | "clanHall"
  | "lumberCamp"
  | "stoneQuarry"
  | "bananaGrove"
  | "workerShelter"
  | "trainingNest"
  | "watchTower"
  | "royalPalace";
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

export type TroopType = "fighter" | "shield_guardian" | "archer" | "crossbowman";
export type UnitType = "worker" | TroopType;
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
  attackIntervalMs: number;
  moveIntervalMs: number;
  resistance: number;
  armorPenetration: number;
  power: number;
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

export type RaidPenaltyReason = "retreat" | "defeat";

export type RaidPenalty = {
  reason: RaidPenaltyReason;
  amounts: Resources;
};

export type RaidGemRewardReason =
  | "first-victory"
  | "first-repeat"
  | "stronghold-milestone"
  | "none";

export type RaidRewardSummary = {
  /** Resources actually added to main storage. */
  loot: Resources;
  /** Reward portion that did not fit in main storage. */
  discardedLoot: Resources;
  multiplier: number;
  gems: number;
  gemReason: RaidGemRewardReason;
};

export type Lang = "tr" | "en";

// Catalog-backed string ids keep save data stable while allowing hundreds of
// future cosmetics without expanding a compile-time union on every release.
export type ProfileMonkeyId = string;
export type ProfileSkinId = string;

export type RoyalPalaceClass = "worker" | "scout" | "warrior" | "hunter" | "chief" | "king";
export type RoyalPalaceSlotId =
  | "palaceGarden"
  | "scoutPath"
  | "guardGate"
  | "hunterTerrace"
  | "royalCourt"
  | "goldenThrone";
export type RoyalPalaceSlotAssignment = {
  slotId: RoyalPalaceSlotId;
  equippedMonkeyId: ProfileMonkeyId;
  /** Null means the character's default appearance. */
  equippedSkinId: ProfileSkinId | null;
};
export type RoyalCharacterDisplay = {
  characterId: ProfileMonkeyId;
  /** Null means the character's default appearance. */
  selectedSkinId: ProfileSkinId | null;
  isVisible: boolean;
  displayPosition: RoyalPalaceSlotId;
  /** Reserved for a future stat system; this release does not populate or consume it. */
  futureStatModifiers?: Readonly<Record<string, number>>;
};
export type RoyalPalacePlacementResult =
  | "placed"
  | "invalid-slot"
  | "slot-locked"
  | "wrong-class"
  | "monkey-not-owned"
  | "skin-not-owned"
  | "parent-monkey-required"
  | "duplicate-monkey"
  | "invalid-skin";

export type FestivalFragmentProgress = Partial<Record<ProfileSkinId, number>>;

export type FestivalChestTransaction = {
  id: string;
  seed: number;
  skinId: ProfileSkinId;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  fragments: number;
  previousFragments: number;
  nextFragments: number;
  requiredFragments: number;
  unlocked: boolean;
  chargedGems: number;
  createdAt: number;
};

export type FestivalChestOpenResult =
  | { status: "opened"; transaction: FestivalChestTransaction }
  | { status: "pending"; transaction: FestivalChestTransaction }
  | { status: "insufficient" }
  | { status: "complete" };

export type ProfileMonkeyUnlockResult =
  | "unlocked"
  | "owned"
  | "insufficient"
  | "requires_monkey"
  | "invalid";

export type UnitCombatStats = {
  maxHp: number;
  attack: number;
  range: number;
  attackIntervalMs: number;
  moveIntervalMs: number;
  resistance: number;
  armorPenetration: number;
  power: number;
};

export type ProductionItem = {
  id: string;
  type: UnitType;
  finishAt: number;
  /** Final combat stats fixed when this item enters the queue. */
  combatStats?: UnitCombatStats;
};

export type PersistedUnit = UnitCombatStats & {
  type: UnitType;
  hp: number;
};

export type TroopUpgradeStat =
  | "health"
  | "attack"
  | "resistance"
  | "attackSpeed"
  | "armorPenetration";

export type TroopUpgradeLevels = Partial<
  Record<TroopType, Partial<Record<TroopUpgradeStat, number>>>
>;

export type RaidArmyResult = {
  deployed: number;
  survivors: number;
  losses: number;
  survivorTypes: Partial<Record<TroopType, number>>;
  lostTypes: Partial<Record<TroopType, number>>;
};

export type RaidArmySelection = Record<TroopType, number>;

export type ActiveWorkTask = {
  startedAt: number;
  endsAt: number;
  accruedUntil: number;
  workerCount: number;
  productionPerSecond: Resources;
};

export type BananaWorkerClass = "gatherer" | "skilled" | "master";
export type LumberWorkerClass =
  | "worker_lumber_apprentice"
  | "worker_lumber_skilled"
  | "worker_lumber_master";
export type StoneWorkerClass =
  | "worker_stone_apprentice"
  | "worker_stone_experienced"
  | "worker_stone_master";
export type WorkerClass = BananaWorkerClass | LumberWorkerClass | StoneWorkerClass;
export type WorkerCountSelection = Partial<Record<WorkerClass, number>>;
export type WorkerMissionTier = "safe" | "risky" | "dangerous";
export type LumberMissionTier = WorkerMissionTier;
export type WorkerExpeditionStatus = "active" | "returning" | "completed";
export type WorkerExpeditionOutcome = "success" | "half" | "empty";

export type WorkerProductionItem = {
  id: string;
  workerId: string;
  workerClass: WorkerClass;
  startedAt: number;
  finishesAt: number;
};

export type IdleWorker = {
  id: string;
  workerClass: WorkerClass;
  producedAt: number;
};

export type WorkerExpedition = {
  id: string;
  /** Shared dispatch id for workers sent together; absent on legacy saves. */
  dispatchId?: string;
  workerId: string;
  workerClass: WorkerClass;
  resource: ResourceKind;
  startedAt: number;
  returnsAt: number;
  expectedReward: number;
  reward: number;
  outcome: WorkerExpeditionOutcome;
  /** Banana reward credited into the Grove's local storage exactly once. */
  storedReward?: number;
  /** Mission selection where the current building UI supports it. */
  missionTier?: WorkerMissionTier;
  /** Shared reward snapshots; reloads never recalculate an active mission. */
  missionMultiplier?: number;
  buildingBonus?: number;
};

export type BananaGroveCollectionSummary = {
  collected: number;
  remainingStorage: number;
  workerClasses: WorkerClass[];
};

export type LumberCampCollectionSummary = {
  collected: number;
  remainingStorage: number;
  workerClass?: LumberWorkerClass;
  workerClasses: LumberWorkerClass[];
  workerCount: number;
  outcome?: WorkerExpeditionOutcome;
  expectedReward: number;
  reward: number;
  storedReward: number;
};

export type StoneQuarryCollectionSummary = {
  collected: number;
  remainingStorage: number;
  workerClass?: StoneWorkerClass;
  workerClasses: StoneWorkerClass[];
  workerCount: number;
  outcome?: WorkerExpeditionOutcome;
  expectedReward: number;
  reward: number;
  storedReward: number;
};

export type WorkerProductionStartResult =
  | "queued"
  | "invalid"
  | "locked"
  | "capacity-full"
  | "insufficient-resources";

export type WorkerDispatchResult =
  | "sent"
  | "invalid"
  | "busy"
  | "capacity-full"
  | "storage-full";

export type WorkerLodgeUpgrade = {
  /** Missing on legacy saves and therefore interpreted as workerShelter. */
  buildingType?: "workerShelter" | "royalPalace";
  fromLevel: number;
  targetLevel: number;
  startedAt: number;
  endsAt: number;
  cost: Resources;
  requiredClanHallLevel: number;
};

export type WorkerCollectionSummary = {
  expeditionId: string;
  workerClass: WorkerClass;
  resource: ResourceKind;
  expectedReward: number;
  reward: number;
  collected: number;
  outcome: WorkerExpeditionOutcome;
};

// What a quest counts toward; cumulative per metric so tiered quests
// (train 3 / train 10) share one counter.
export type QuestMetric = "trainAny" | "upgradeAny" | "winRaid" | "workShift";

export type VillageSave = {
  buildings: VillageBuilding[];
  resources: Resources;
  /** Legacy cache; army capacity is always derived from Training Nest level. */
  maxPopulation?: number;
  gems?: number;
  /** StoreKit transaction ids already delivered into this save. */
  processedIapTransactionIds?: string[];
  /** Internal QA reward ids already redeemed in this save. */
  redeemedQaCodes?: string[];
  unlockedProfileMonkeys?: ProfileMonkeyId[];
  equippedProfileMonkey?: ProfileMonkeyId;
  ownedProfileSkins?: ProfileSkinId[];
  equippedProfileSkin?: ProfileSkinId;
  newProfileMonkeys?: ProfileMonkeyId[];
  newProfileSkins?: ProfileSkinId[];
  festivalFragments?: FestivalFragmentProgress;
  festivalChestRngSeed?: number;
  pendingFestivalChest?: FestivalChestTransaction | null;
  claimedFestivalChest?: FestivalChestTransaction | null;
  productionQueue?: ProductionItem[];
  language?: Lang;
  raidLevel?: number;
  raidVictoryCounts?: Record<string, number>;
  /** Migration marker for the bounded per-camp Gem reward rules. */
  raidRewardVersion?: number;
  activeWorkTask?: ActiveWorkTask | null;
  /** Legacy save field. Hydration cancels it instead of replaying old production. */
  workShiftUntil?: number | null;
  workerProductionQueue?: WorkerProductionItem[];
  idleWorkers?: IdleWorker[];
  workerExpeditions?: WorkerExpedition[];
  bananaGroveStorage?: number;
  lumberCampStorage?: number;
  /** Quarry-local stone storage. Missing legacy values migrate to zero. */
  stoneQuarryStorage?: number;
  activeWorkerLodgeUpgrade?: WorkerLodgeUpgrade | null;
  /** Current three-level Royal Palace save format. */
  royalPalaceVersion?: number;
  royalCharacterDisplays?: RoyalCharacterDisplay[];
  /** Legacy six-level Palace placement format, migrated during hydration. */
  royalPalaceSlots?: RoyalPalaceSlotAssignment[];
  questProgress?: Partial<Record<QuestMetric, number>>;
  questsClaimed?: string[];
  questDayKey?: string;
  lastSeenAt?: number;
  dailyStreak?: number;
  dailyLastClaim?: string | null;
  /** Exact living roster used by current saves. */
  unitRoster?: PersistedUnit[];
  /** Legacy save field migrated once to unitRoster using the saved Nest level. */
  unitCounts?: Partial<Record<string, number>>;
  /** Conservative per-troop stat progression owned by the Training Nest. */
  troopUpgrades?: TroopUpgradeLevels;
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
  gems: number;
  processedIapTransactionIds: string[];
  redeemedQaCodes: string[];
  unlockedProfileMonkeys: ProfileMonkeyId[];
  ownedProfileSkins: ProfileSkinId[];
  newProfileMonkeys: ProfileMonkeyId[];
  newProfileSkins: ProfileSkinId[];
  festivalFragments: FestivalFragmentProgress;
  festivalChestRngSeed: number;
  pendingFestivalChest: FestivalChestTransaction | null;
  claimedFestivalChest: FestivalChestTransaction | null;
  productionQueue: ProductionItem[];
  troopUpgrades: TroopUpgradeLevels;
  workerProductionQueue: WorkerProductionItem[];
  idleWorkers: IdleWorker[];
  workerExpeditions: WorkerExpedition[];
  bananaGroveStorage: number;
  lumberCampStorage: number;
  stoneQuarryStorage: number;
  activeWorkerLodgeUpgrade: WorkerLodgeUpgrade | null;
  royalCharacterDisplays: RoyalCharacterDisplay[];
  playerCampHp: number;
  enemyCampHp: number;
  enemyCampMaxHp: number;
  activeCampId: string | null;
  /** Runtime-only roster participating in the current raid. */
  activeRaidUnitIds: string[];
  raidStars: number;
  raidLevel: number;
  raidVictoryCounts: Record<string, number>;
  lastRaidReward: RaidRewardSummary | null;
  lastRaidPenalty: RaidPenalty | null;
  lastRaidArmyResult: RaidArmyResult | null;
  questProgress: Partial<Record<QuestMetric, number>>;
  questsClaimed: string[];
  questDayKey: string;
  offlineReport: OfflineReport | null;
  dailyStreak: number;
  dailyLastClaim: string | null;
  lastProductionAt: number;
  language: Lang;
  feedback: FeedbackMessage | null;
  dismissFeedback: (id: number) => void;
  startGame: () => void;
  hydrate: (save: VillageSave) => void;
  setLanguage: (lang: Lang) => void;
  queueWorker: (workerClass: WorkerClass, count?: number) => WorkerProductionStartResult;
  sendWorkerExpedition: (workerId: string, resource: ResourceKind, missionTier?: WorkerMissionTier) => void;
  sendWorkerExpeditionBatch: (workerIds: string[], resource: ResourceKind, missionTier?: WorkerMissionTier) => WorkerDispatchResult;
  collectWorkerExpedition: (expeditionId: string) => WorkerCollectionSummary | null;
  collectBananaGrove: () => BananaGroveCollectionSummary | null;
  collectLumberCamp: () => LumberCampCollectionSummary | null;
  collectStoneQuarry: () => StoneQuarryCollectionSummary | null;
  claimQuest: (id: string) => void;
  dismissOfflineReport: () => void;
  claimDaily: () => void;
  buyShopItem: (id: string) => void;
  unlockProfileMonkey: (id: ProfileMonkeyId) => ProfileMonkeyUnlockResult;
  markProfileMonkeySeen: (id: ProfileMonkeyId) => void;
  markProfileSkinSeen: (id: ProfileSkinId) => void;
  openFestivalChest: () => FestivalChestOpenResult;
  claimFestivalChest: (transactionId: string) => void;
  trainTroop: (type: TroopType) => void;
  upgradeTroopStat: (type: TroopType, stat: TroopUpgradeStat) => void;
  rushProduction: () => void;
  openRaidMap: () => void;
  closeRaidMap: () => void;
  startRaidOn: (campId: string, selection: RaidArmySelection) => void;
  retreatFromRaid: () => void;
  returnToVillage: () => void;
  upgradeBuilding: (type: VillageBuildingType) => void;
  selectRoyalCharacterSkin: (
    characterId: ProfileMonkeyId,
    skinId: ProfileSkinId | null
  ) => RoyalPalacePlacementResult;
  setRoyalCharacterVisibility: (
    characterId: ProfileMonkeyId,
    visible: boolean
  ) => RoyalPalacePlacementResult;
  rushRoyalPalaceUpgrade: () => boolean;
  reconcileWorkTask: (now?: number) => void;
  tickGame: (now?: number) => void;
  resetGame: () => void;
  goToMenu: () => void;
};
