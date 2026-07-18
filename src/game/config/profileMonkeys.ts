import type { GameAssetKey } from "../assets/gameAssets";
import type { ProfileMonkeyId, ProfileSkinId, RoyalCharacterDisplay } from "../types/game";

export type CosmeticRarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export type CosmeticCatalogStatus = "default" | "festival" | "archived";
export type ProfileMonkeyAcquisition = "default" | "daily_reward_or_gems" | "gems";
export type CosmeticOwnershipFilter = "all" | "owned" | "locked";
export type CosmeticRarityFilter = "all" | CosmeticRarity;
export type CosmeticVisualEffect =
  | "none"
  | "silver_sheen"
  | "purple_glow"
  | "gold_glow"
  | "mythic_shimmer"
  | "ember_glow"
  | "spirit_glow";

export type ProfileMonkey = {
  id: ProfileMonkeyId;
  nameKey: string;
  descriptionKey: string;
  rarity: CosmeticRarity;
  price: number;
  portraitAsset: GameAssetKey;
  villageAsset: GameAssetKey;
  raidAsset: GameAssetKey;
  victoryAsset: GameAssetKey;
  availableSkinIds: readonly ProfileSkinId[];
  acquisition: ProfileMonkeyAcquisition;
  featured?: boolean;
};

export type ProfileSkin = {
  id: ProfileSkinId;
  monkeyId: ProfileMonkeyId;
  nameKey: string;
  descriptionKey: string;
  rarity: CosmeticRarity;
  price: number;
  portraitAsset?: GameAssetKey;
  villageAsset?: GameAssetKey;
  raidAsset?: GameAssetKey;
  victoryAsset?: GameAssetKey;
  effect: CosmeticVisualEffect;
  catalogStatus: CosmeticCatalogStatus;
  presentationGlow?: string;
  badgeKey?: string;
  previewMotion?: "float";
  particleColor?: string;
};

export type CosmeticAppearance = {
  monkey: ProfileMonkey;
  skin: ProfileSkin;
  rarity: CosmeticRarity;
  effect: CosmeticVisualEffect;
  portraitAsset: GameAssetKey;
  villageAsset: GameAssetKey;
  raidAsset: GameAssetKey;
  victoryAsset: GameAssetKey;
};

export const DEFAULT_PROFILE_MONKEY_ID: ProfileMonkeyId = "profile_monkey_worker";
export const YOUNG_SCOUT_PROFILE_MONKEY_ID: ProfileMonkeyId = "profile_monkey_scout";
export const DEFAULT_PROFILE_SKIN_ID: ProfileSkinId = "skin_worker_default";
export const FESTIVAL_WORKER_SKIN_ID: ProfileSkinId = "skin_worker_festival";
export const SUN_PARADE_WORKER_SKIN_ID: ProfileSkinId = "skin_worker_sun_parade";
export const WATERMELON_FEAST_WORKER_SKIN_ID: ProfileSkinId = "skin_worker_watermelon_feast";
export const BANANA_DJ_SKIN_ID: ProfileSkinId = "skin_worker_banana_dj";
export const FIRE_DANCER_SKIN_ID: ProfileSkinId = "skin_scout_fire_dancer";
export const BEACH_WARRIOR_SKIN_ID: ProfileSkinId = "skin_warrior_beach";
export const TROPICAL_ARCHER_SKIN_ID: ProfileSkinId = "skin_hunter_tropical_archer";
export const SUNSET_CHIEF_SKIN_ID: ProfileSkinId = "skin_chief_sunset";
export const FIRE_MONKEY_SKIN_ID: ProfileSkinId = "skin_scout_fire_monkey";
export const GOLDEN_FESTIVAL_KING_SKIN_ID: ProfileSkinId = "skin_king_golden_festival";
export const GOLDEN_EMPEROR_SKIN_ID: ProfileSkinId = "skin_chief_golden_emperor";
export const CELESTIAL_MONKEY_KING_SKIN_ID: ProfileSkinId = "skin_king_celestial";

const DEFAULT_SKINS: readonly ProfileSkin[] = [
  defaultSkin("profile_monkey_scout", "skin_scout_default"),
  defaultSkin("profile_monkey_worker", "skin_worker_default"),
  defaultSkin("profile_monkey_warrior", "skin_warrior_default"),
  defaultSkin("profile_monkey_hunter", "skin_hunter_default"),
  defaultSkin("profile_monkey_chief", "skin_chief_default"),
  defaultSkin("profile_monkey_king", "skin_king_default")
];

const JUNGLE_WORKER_SKINS: readonly ProfileSkin[] = [
  workerSkin(
    "skin_worker_banana_delivery",
    "collection.skin.bananaDeliveryWorker",
    "rare",
    50,
    "silver_sheen",
    "workerBananaDelivery"
  ),
  workerSkin(
    "skin_worker_master_builder",
    "collection.skin.masterJungleBuilder",
    "epic",
    100,
    "purple_glow",
    "workerMasterBuilder"
  ),
  workerSkin(
    FESTIVAL_WORKER_SKIN_ID,
    "collection.skin.festivalWorker",
    "common",
    0,
    "purple_glow",
    "festivalWorker",
    {
      catalogStatus: "festival",
      badgeKey: "collection.badge.festival",
      presentationGlow: "#ff83d5"
    }
  ),
  workerSkin(
    SUN_PARADE_WORKER_SKIN_ID,
    "collection.skin.sunParadeWorker",
    "common",
    0,
    "purple_glow",
    "sunParadeWorker",
    {
      catalogStatus: "festival",
      badgeKey: "collection.badge.festival",
      presentationGlow: "#ffba45"
    }
  ),
  workerSkin(
    WATERMELON_FEAST_WORKER_SKIN_ID,
    "collection.skin.watermelonFeastWorker",
    "rare",
    0,
    "purple_glow",
    "watermelonFeastWorker",
    {
      catalogStatus: "festival",
      badgeKey: "collection.badge.festival",
      presentationGlow: "#ff6470"
    }
  ),
  workerSkin(
    BANANA_DJ_SKIN_ID,
    "collection.skin.bananaDj",
    "rare",
    0,
    "none",
    "festivalBananaDj",
    festivalOptions("#79f4ff")
  )
];

const GOLDEN_CHIEF_SKINS: readonly ProfileSkin[] = [
  premiumSkin(
    GOLDEN_EMPEROR_SKIN_ID,
    "profile_monkey_chief",
    "collection.skin.goldenEmperor",
    "mythic",
    1000,
    "mythic_shimmer",
    "goldenEmperor",
    {
      presentationGlow: "#ffd85c",
      particleColor: "#ffe37d"
    }
  ),
  premiumSkin(
    SUNSET_CHIEF_SKIN_ID,
    "profile_monkey_chief",
    "collection.skin.sunsetChief",
    "legendary",
    0,
    "gold_glow",
    "festivalSunsetChief",
    festivalOptions("#ff8b52", "#ffd56a")
  )
];

const YOUNG_SCOUT_SKINS: readonly ProfileSkin[] = [
  scoutSkin(
    "skin_scout_jungle_pathfinder",
    "collection.skin.junglePathfinder",
    "rare",
    50,
    "silver_sheen",
    "scoutJunglePathfinder"
  ),
  scoutSkin(
    "skin_scout_moonlight_tracker",
    "collection.skin.moonlightTracker",
    "epic",
    100,
    "purple_glow",
    "scoutMoonlightTracker"
  ),
  premiumSkin(
    FIRE_DANCER_SKIN_ID,
    "profile_monkey_scout",
    "collection.skin.fireDancer",
    "epic",
    0,
    "ember_glow",
    "festivalFireDancer",
    festivalOptions("#ff713f", "#ffb04d")
  ),
  premiumSkin(
    FIRE_MONKEY_SKIN_ID,
    "profile_monkey_scout",
    "collection.skin.fireMonkey",
    "legendary",
    0,
    "ember_glow",
    "festivalFireMonkey",
    festivalOptions("#ff4d2f", "#ff8b45")
  )
];

const FOREST_WARRIOR_SKINS: readonly ProfileSkin[] = [
  warriorSkin(
    "warrior_savage_raider",
    "collection.skin.savageJungleRaider",
    "rare",
    50,
    "silver_sheen",
    "warriorSavageRaider"
  ),
  warriorSkin(
    "warrior_ancient_warchief",
    "collection.skin.ancientWarChief",
    "epic",
    100,
    "ember_glow",
    "warriorAncientWarChief",
    "#ff6538"
  ),
  premiumSkin(
    BEACH_WARRIOR_SKIN_ID,
    "profile_monkey_warrior",
    "collection.skin.beachWarrior",
    "epic",
    0,
    "none",
    "festivalBeachWarrior",
    festivalOptions("#52d9f3")
  )
];

const TRIBAL_HUNTER_SKINS: readonly ProfileSkin[] = [
  hunterSkin(
    "hunter_emerald_ranger",
    "collection.skin.emeraldRanger",
    "epic",
    50,
    "purple_glow",
    "hunterEmeraldRanger"
  ),
  hunterSkin(
    "hunter_royal_eagle_archer",
    "collection.skin.royalEagleArcher",
    "legendary",
    100,
    "gold_glow",
    "hunterRoyalEagleArcher",
    "#ffd86a"
  ),
  premiumSkin(
    TROPICAL_ARCHER_SKIN_ID,
    "profile_monkey_hunter",
    "collection.skin.tropicalArcher",
    "epic",
    0,
    "silver_sheen",
    "festivalTropicalArcher",
    festivalOptions("#5ce69a")
  )
];

const LEGACY_MONKEY_KING_SKINS: readonly ProfileSkin[] = [
  skin("skin_king_golden", "collection.skin.goldenKing", "legendary", 300, "gold_glow"),
  skin("skin_king_pirate", "collection.skin.pirateKing", "epic", 220, "purple_glow", {
    portraitAsset: "unitEnemyFighter",
    villageAsset: "unitEnemyFighter",
    raidAsset: "unitEnemyFighter",
    victoryAsset: "unitEnemyFighter"
  }),
  skin("skin_king_samurai", "collection.skin.samuraiKing", "epic", 280, "purple_glow", {
    portraitAsset: "unitWarrior",
    villageAsset: "unitWarrior",
    raidAsset: "unitWarrior",
    victoryAsset: "unitWarrior"
  }),
  skin("skin_king_viking", "collection.skin.vikingKing", "rare", 200, "silver_sheen", {
    portraitAsset: "unitFighter",
    villageAsset: "unitFighter",
    raidAsset: "unitFighter",
    victoryAsset: "unitFighter"
  }),
  skin("skin_king_cyber", "collection.skin.cyberKing", "mythic", 600, "mythic_shimmer"),
  skin("skin_king_lava", "collection.skin.lavaKing", "legendary", 450, "ember_glow"),
  skin("skin_king_pharaoh", "collection.skin.pharaohKing", "legendary", 400, "gold_glow"),
  skin("skin_king_christmas", "collection.skin.christmasKing", "epic", 250, "purple_glow", {
    portraitAsset: "menuChiefMascot",
    villageAsset: "menuChiefMascot",
    raidAsset: "menuChiefMascot",
    victoryAsset: "menuChiefMascot"
  }),
  skin("skin_king_spirit", "collection.skin.spiritKing", "mythic", 650, "spirit_glow")
];

const MONKEY_KING_SKINS: readonly ProfileSkin[] = [
  premiumSkin(
    CELESTIAL_MONKEY_KING_SKIN_ID,
    "profile_monkey_king",
    "collection.skin.celestialMonkeyKing",
    "legendary",
    2000,
    "gold_glow",
    "celestialMonkeyKing",
    {
      presentationGlow: "#ffd15f",
      particleColor: "#fff0a3",
      previewMotion: "float"
    }
  ),
  premiumSkin(
    GOLDEN_FESTIVAL_KING_SKIN_ID,
    "profile_monkey_king",
    "collection.skin.goldenFestivalKing",
    "mythic",
    0,
    "mythic_shimmer",
    "festivalGoldenKing",
    {
      ...festivalOptions("#ffe46b", "#fff3a8"),
      previewMotion: "float"
    }
  ),
  ...LEGACY_MONKEY_KING_SKINS
];

export const PROFILE_SKINS: readonly ProfileSkin[] = [
  ...DEFAULT_SKINS,
  ...JUNGLE_WORKER_SKINS,
  ...YOUNG_SCOUT_SKINS,
  ...FOREST_WARRIOR_SKINS,
  ...TRIBAL_HUNTER_SKINS,
  ...GOLDEN_CHIEF_SKINS,
  ...MONKEY_KING_SKINS
];

export const ACTIVE_PROFILE_SKINS: readonly ProfileSkin[] = PROFILE_SKINS.filter(
  (entry) => entry.catalogStatus !== "archived"
);

export const DEFAULT_PROFILE_SKINS: readonly ProfileSkin[] = ACTIVE_PROFILE_SKINS.filter(
  (entry) => entry.catalogStatus === "default"
);

export const FESTIVAL_PROFILE_SKINS: readonly ProfileSkin[] = [
  FESTIVAL_WORKER_SKIN_ID,
  SUN_PARADE_WORKER_SKIN_ID,
  WATERMELON_FEAST_WORKER_SKIN_ID,
  BANANA_DJ_SKIN_ID,
  FIRE_DANCER_SKIN_ID,
  BEACH_WARRIOR_SKIN_ID,
  TROPICAL_ARCHER_SKIN_ID,
  SUNSET_CHIEF_SKIN_ID,
  FIRE_MONKEY_SKIN_ID,
  GOLDEN_FESTIVAL_KING_SKIN_ID
].map((id) => PROFILE_SKINS.find(
  (entry) => entry.id === id && entry.catalogStatus === "festival"
)!);

export const ARCHIVED_PROFILE_SKINS: readonly ProfileSkin[] = PROFILE_SKINS.filter(
  (entry) => entry.catalogStatus === "archived"
);

// One catalog entry owns every visual surface. Adding a monkey later is data
// only; no store, save, raid or screen switch needs another id-specific branch.
export const PROFILE_MONKEYS: readonly ProfileMonkey[] = [
  monkey(
    "profile_monkey_worker",
    "worker",
    "common",
    0,
    "unitWorker",
    activeSkinIds("skin_worker_default", JUNGLE_WORKER_SKINS),
    "default"
  ),
  monkey(
    "profile_monkey_scout",
    "scout",
    "rare",
    150,
    "unitScout",
    activeSkinIds("skin_scout_default", YOUNG_SCOUT_SKINS),
    "daily_reward_or_gems"
  ),
  monkey(
    "profile_monkey_warrior",
    "warrior",
    "rare",
    300,
    "unitWarrior",
    activeSkinIds("skin_warrior_default", FOREST_WARRIOR_SKINS),
    "gems"
  ),
  monkey(
    "profile_monkey_hunter",
    "hunter",
    "epic",
    500,
    "unitArcher",
    activeSkinIds("skin_hunter_default", TRIBAL_HUNTER_SKINS),
    "gems"
  ),
  monkey(
    "profile_monkey_chief",
    "chief",
    "legendary",
    900,
    "menuChiefMascot",
    activeSkinIds("skin_chief_default", GOLDEN_CHIEF_SKINS),
    "gems",
    true
  ),
  monkey(
    "profile_monkey_king",
    "king",
    "mythic",
    2500,
    "unitChief",
    activeSkinIds("skin_king_default", MONKEY_KING_SKINS),
    "gems",
    true
  )
];

const PROFILE_MONKEY_IDS = new Set(PROFILE_MONKEYS.map((entry) => entry.id));
const PROFILE_SKIN_IDS = new Set(PROFILE_SKINS.map((entry) => entry.id));

export function isProfileMonkeyId(value: unknown): value is ProfileMonkeyId {
  return typeof value === "string" && PROFILE_MONKEY_IDS.has(value);
}

export function isProfileSkinId(value: unknown): value is ProfileSkinId {
  return typeof value === "string" && PROFILE_SKIN_IDS.has(value);
}

export function getProfileMonkey(id: ProfileMonkeyId) {
  return PROFILE_MONKEYS.find((entry) => entry.id === id);
}

export function isGemPurchasableProfileMonkey(monkey: ProfileMonkey) {
  return monkey.acquisition === "gems" || monkey.acquisition === "daily_reward_or_gems";
}

export function canEquipProfileSkin(
  skinId: ProfileSkinId,
  ownedSkinIds: readonly ProfileSkinId[],
  unlockedMonkeyIds: readonly ProfileMonkeyId[]
) {
  const skin = getProfileSkin(skinId);
  return isActiveProfileSkin(skin) &&
    ownedSkinIds.includes(skinId) &&
    unlockedMonkeyIds.includes(skin.monkeyId);
}

export function getProfileSkin(id: ProfileSkinId) {
  return PROFILE_SKINS.find((entry) => entry.id === id);
}

export function isActiveProfileSkin(skin: ProfileSkin | undefined): skin is ProfileSkin {
  return skin != null && skin.catalogStatus !== "archived";
}

export function isArchivedProfileSkin(skin: ProfileSkin | undefined): skin is ProfileSkin {
  return skin?.catalogStatus === "archived";
}

export function getDefaultSkinId(monkeyId: ProfileMonkeyId): ProfileSkinId {
  return DEFAULT_PROFILE_SKINS.find((entry) => entry.monkeyId === monkeyId)?.id ??
    DEFAULT_PROFILE_SKIN_ID;
}

export function skinsForMonkey(monkeyId: ProfileMonkeyId) {
  const monkey = getProfileMonkey(monkeyId);
  if (!monkey) return [];
  const ids = new Set(monkey.availableSkinIds);
  return ACTIVE_PROFILE_SKINS.filter((entry) => ids.has(entry.id));
}

export function sanitizeUnlockedProfileMonkeys(value: unknown): ProfileMonkeyId[] {
  const unlocked = Array.isArray(value) ? value.filter(isProfileMonkeyId) : [];
  return Array.from(new Set([DEFAULT_PROFILE_MONKEY_ID, ...unlocked]));
}

export function sanitizeEquippedProfileMonkey(
  value: unknown,
  unlocked: readonly ProfileMonkeyId[],
  equippedSkinValue?: unknown
): ProfileMonkeyId {
  if (isProfileSkinId(equippedSkinValue)) {
    const savedSkin = getProfileSkin(equippedSkinValue);
    if (isArchivedProfileSkin(savedSkin)) {
      return unlocked.includes(savedSkin.monkeyId)
        ? savedSkin.monkeyId
        : DEFAULT_PROFILE_MONKEY_ID;
    }
  }
  return isProfileMonkeyId(value) && unlocked.includes(value)
    ? value
    : DEFAULT_PROFILE_MONKEY_ID;
}

export function sanitizeOwnedProfileSkins(
  value: unknown,
  unlockedMonkeys: readonly ProfileMonkeyId[]
): ProfileSkinId[] {
  const saved = Array.isArray(value)
    ? value.filter((entry): entry is ProfileSkinId => {
        if (!isProfileSkinId(entry)) return false;
        return getProfileSkin(entry) != null;
      })
    : [];
  const defaults = unlockedMonkeys.map(getDefaultSkinId);
  return Array.from(new Set([...defaults, ...saved]));
}

export function sanitizeEquippedProfileSkin(
  value: unknown,
  equippedMonkey: ProfileMonkeyId,
  ownedSkins: readonly ProfileSkinId[]
): ProfileSkinId {
  if (isProfileSkinId(value) && ownedSkins.includes(value)) {
    const saved = getProfileSkin(value);
    if (isActiveProfileSkin(saved) && saved.monkeyId === equippedMonkey) return value;
  }
  return getDefaultSkinId(equippedMonkey);
}

export function sanitizeNewProfileMonkeys(
  value: unknown,
  unlocked: readonly ProfileMonkeyId[]
): ProfileMonkeyId[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((entry): entry is ProfileMonkeyId =>
    isProfileMonkeyId(entry) && unlocked.includes(entry)
  )));
}

export function sanitizeNewProfileSkins(
  value: unknown,
  owned: readonly ProfileSkinId[]
): ProfileSkinId[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((entry): entry is ProfileSkinId =>
    isProfileSkinId(entry) && owned.includes(entry) && isActiveProfileSkin(getProfileSkin(entry))
  )));
}

export function getCosmeticAppearance(
  monkeyId: ProfileMonkeyId,
  skinId: ProfileSkinId
): CosmeticAppearance {
  const monkey = getProfileMonkey(monkeyId) ?? getProfileMonkey(DEFAULT_PROFILE_MONKEY_ID)!;
  const requestedSkin = getProfileSkin(skinId);
  const skinEntry = isActiveProfileSkin(requestedSkin) && requestedSkin.monkeyId === monkey.id
    ? requestedSkin
    : getProfileSkin(getDefaultSkinId(monkey.id))!;
  return {
    monkey,
    skin: skinEntry,
    rarity: skinEntry.id === getDefaultSkinId(monkey.id) ? monkey.rarity : skinEntry.rarity,
    effect: skinEntry.effect,
    portraitAsset: skinEntry.portraitAsset ?? monkey.portraitAsset,
    villageAsset: skinEntry.villageAsset ?? monkey.villageAsset,
    raidAsset: skinEntry.raidAsset ?? monkey.raidAsset,
    victoryAsset: skinEntry.victoryAsset ?? monkey.victoryAsset
  };
}

/** Stable non-equip identity for legacy menu/raid surfaces. */
export function getPrimaryRoyalAppearance(displays: readonly RoyalCharacterDisplay[]) {
  const display = displays.find((entry) => entry.isVisible) ?? displays[0];
  return getCosmeticAppearance(
    display?.characterId ?? DEFAULT_PROFILE_MONKEY_ID,
    display?.selectedSkinId ?? getDefaultSkinId(display?.characterId ?? DEFAULT_PROFILE_MONKEY_ID)
  );
}

function festivalOptions(
  presentationGlow: string,
  particleColor?: string
): Partial<ProfileSkin> {
  return {
    catalogStatus: "festival",
    badgeKey: "collection.badge.festival",
    presentationGlow,
    particleColor
  };
}

export function matchesCosmeticFilter(
  owned: boolean,
  rarity: CosmeticRarity,
  ownershipFilter: CosmeticOwnershipFilter,
  rarityFilter: CosmeticRarityFilter
) {
  const ownershipMatches =
    ownershipFilter === "all" || (ownershipFilter === "owned" ? owned : !owned);
  return ownershipMatches && (rarityFilter === "all" || rarityFilter === rarity);
}

function defaultSkin(monkeyId: ProfileMonkeyId, id: ProfileSkinId): ProfileSkin {
  return {
    id,
    monkeyId,
    nameKey: "collection.skin.default.name",
    descriptionKey: "collection.skin.default.description",
    rarity: "common",
    price: 0,
    effect: "none",
    catalogStatus: "default"
  };
}

function skin(
  id: ProfileSkinId,
  key: string,
  rarity: CosmeticRarity,
  price: number,
  effect: CosmeticVisualEffect,
  options: Partial<Omit<ProfileSkin, "id" | "monkeyId" | "nameKey" | "descriptionKey" | "rarity" | "price" | "effect">> = {}
): ProfileSkin {
  return {
    id,
    monkeyId: "profile_monkey_king",
    nameKey: `${key}.name`,
    descriptionKey: `${key}.description`,
    rarity,
    price,
    effect,
    catalogStatus: "archived",
    ...options
  };
}

function workerSkin(
  id: ProfileSkinId,
  key: string,
  rarity: CosmeticRarity,
  price: number,
  effect: CosmeticVisualEffect,
  assetKey: GameAssetKey,
  options: Partial<Omit<ProfileSkin, "id" | "monkeyId" | "nameKey" | "descriptionKey" | "rarity" | "price" | "effect" | "portraitAsset" | "villageAsset" | "raidAsset" | "victoryAsset">> = {}
): ProfileSkin {
  return {
    id,
    monkeyId: "profile_monkey_worker",
    nameKey: `${key}.name`,
    descriptionKey: `${key}.description`,
    rarity,
    price,
    effect,
    catalogStatus: "archived",
    portraitAsset: assetKey,
    villageAsset: assetKey,
    raidAsset: assetKey,
    victoryAsset: assetKey,
    ...options
  };
}

function premiumSkin(
  id: ProfileSkinId,
  monkeyId: ProfileMonkeyId,
  key: string,
  rarity: CosmeticRarity,
  price: number,
  effect: CosmeticVisualEffect,
  assetKey: GameAssetKey,
  options: Partial<Omit<ProfileSkin, "id" | "monkeyId" | "nameKey" | "descriptionKey" | "rarity" | "price" | "effect" | "portraitAsset" | "villageAsset" | "raidAsset" | "victoryAsset">> = {}
): ProfileSkin {
  return {
    id,
    monkeyId,
    nameKey: `${key}.name`,
    descriptionKey: `${key}.description`,
    rarity,
    price,
    effect,
    catalogStatus: "archived",
    portraitAsset: assetKey,
    villageAsset: assetKey,
    raidAsset: assetKey,
    victoryAsset: assetKey,
    ...options
  };
}

function scoutSkin(
  id: ProfileSkinId,
  key: string,
  rarity: CosmeticRarity,
  price: number,
  effect: CosmeticVisualEffect,
  assetKey: GameAssetKey
): ProfileSkin {
  return {
    id,
    monkeyId: "profile_monkey_scout",
    nameKey: `${key}.name`,
    descriptionKey: `${key}.description`,
    rarity,
    price,
    effect,
    catalogStatus: "archived",
    portraitAsset: assetKey,
    villageAsset: assetKey,
    raidAsset: assetKey,
    victoryAsset: assetKey
  };
}

function warriorSkin(
  id: ProfileSkinId,
  key: string,
  rarity: CosmeticRarity,
  price: number,
  effect: CosmeticVisualEffect,
  assetKey: GameAssetKey,
  presentationGlow?: string
): ProfileSkin {
  return {
    id,
    monkeyId: "profile_monkey_warrior",
    nameKey: `${key}.name`,
    descriptionKey: `${key}.description`,
    rarity,
    price,
    effect,
    catalogStatus: "archived",
    presentationGlow,
    portraitAsset: assetKey,
    villageAsset: assetKey,
    raidAsset: assetKey,
    victoryAsset: assetKey
  };
}

function hunterSkin(
  id: ProfileSkinId,
  key: string,
  rarity: CosmeticRarity,
  price: number,
  effect: CosmeticVisualEffect,
  assetKey: GameAssetKey,
  presentationGlow?: string
): ProfileSkin {
  return {
    id,
    monkeyId: "profile_monkey_hunter",
    nameKey: `${key}.name`,
    descriptionKey: `${key}.description`,
    rarity,
    price,
    effect,
    catalogStatus: "archived",
    presentationGlow,
    portraitAsset: assetKey,
    villageAsset: assetKey,
    raidAsset: assetKey,
    victoryAsset: assetKey
  };
}

function activeSkinIds(
  defaultSkinId: ProfileSkinId,
  skins: readonly ProfileSkin[]
): readonly ProfileSkinId[] {
  return [
    defaultSkinId,
    ...skins.filter((skin) => skin.catalogStatus === "festival").map((skin) => skin.id)
  ];
}

function monkey(
  id: ProfileMonkeyId,
  key: string,
  rarity: CosmeticRarity,
  price: number,
  asset: GameAssetKey,
  availableSkinIds: readonly ProfileSkinId[],
  acquisition: ProfileMonkeyAcquisition,
  featured = false
): ProfileMonkey {
  return {
    id,
    nameKey: `collection.monkey.${key}.name`,
    descriptionKey: `collection.monkey.${key}.description`,
    rarity,
    price,
    portraitAsset: asset,
    villageAsset: asset,
    raidAsset: asset,
    victoryAsset: asset,
    availableSkinIds,
    acquisition,
    featured
  };
}
