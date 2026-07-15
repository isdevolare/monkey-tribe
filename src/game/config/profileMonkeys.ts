import type { GameAssetKey } from "../assets/gameAssets";
import type { ProfileMonkeyId, ProfileSkinId } from "../types/game";

export type CosmeticRarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export type CosmeticGroup = "early_game" | "festival";
export type CosmeticAcquisition = "direct_purchase" | "festival_fragments";
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
  group: CosmeticGroup;
  acquisition: CosmeticAcquisition;
  presentationGlow?: string;
  badgeKey?: string;
  previewMotion?: "float";
  particleColor?: string;
  /** Kept in the catalog for save compatibility, but unavailable to new buyers. */
  disabledReasonKey?: string;
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
export const DEFAULT_PROFILE_SKIN_ID: ProfileSkinId = "skin_worker_default";
export const FESTIVAL_WORKER_SKIN_ID: ProfileSkinId = "skin_worker_festival";
export const SUN_PARADE_WORKER_SKIN_ID: ProfileSkinId = "skin_worker_sun_parade";
export const WATERMELON_FEAST_WORKER_SKIN_ID: ProfileSkinId = "skin_worker_watermelon_feast";
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
    "epic",
    0,
    "purple_glow",
    "festivalWorker",
    {
      group: "festival",
      acquisition: "festival_fragments",
      badgeKey: "collection.badge.festival",
      presentationGlow: "#ff83d5"
    }
  ),
  workerSkin(
    SUN_PARADE_WORKER_SKIN_ID,
    "collection.skin.sunParadeWorker",
    "epic",
    0,
    "purple_glow",
    "sunParadeWorker",
    {
      group: "festival",
      acquisition: "festival_fragments",
      badgeKey: "collection.badge.festival",
      presentationGlow: "#ffba45"
    }
  ),
  workerSkin(
    WATERMELON_FEAST_WORKER_SKIN_ID,
    "collection.skin.watermelonFeastWorker",
    "epic",
    0,
    "purple_glow",
    "watermelonFeastWorker",
    {
      group: "festival",
      acquisition: "festival_fragments",
      badgeKey: "collection.badge.festival",
      presentationGlow: "#ff6470"
    }
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
  )
];

const LEGACY_MONKEY_KING_SKINS: readonly ProfileSkin[] = [
  skin("skin_king_golden", "collection.skin.goldenKing", "legendary", 300, "gold_glow", {
    disabledReasonKey: "collection.disabled.missingArtwork"
  }),
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
  skin("skin_king_cyber", "collection.skin.cyberKing", "mythic", 600, "mythic_shimmer", {
    disabledReasonKey: "collection.disabled.missingArtwork"
  }),
  skin("skin_king_lava", "collection.skin.lavaKing", "legendary", 450, "ember_glow", {
    disabledReasonKey: "collection.disabled.missingArtwork"
  }),
  skin("skin_king_pharaoh", "collection.skin.pharaohKing", "legendary", 400, "gold_glow", {
    disabledReasonKey: "collection.disabled.missingArtwork"
  }),
  skin("skin_king_christmas", "collection.skin.christmasKing", "epic", 250, "purple_glow", {
    portraitAsset: "menuChiefMascot",
    villageAsset: "menuChiefMascot",
    raidAsset: "menuChiefMascot",
    victoryAsset: "menuChiefMascot"
  }),
  skin("skin_king_spirit", "collection.skin.spiritKing", "mythic", 650, "spirit_glow", {
    disabledReasonKey: "collection.disabled.missingArtwork"
  })
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
  (entry) => !entry.disabledReasonKey
);

export const EARLY_GAME_PROFILE_SKINS: readonly ProfileSkin[] = ACTIVE_PROFILE_SKINS.filter(
  (entry) => entry.group === "early_game"
);

export const FESTIVAL_PROFILE_SKINS: readonly ProfileSkin[] = ACTIVE_PROFILE_SKINS.filter(
  (entry) => entry.group === "festival"
);

export const SHOP_PROFILE_SKINS: readonly ProfileSkin[] = EARLY_GAME_PROFILE_SKINS.filter(
  (entry) => entry.acquisition === "direct_purchase" && entry.price > 0
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
    ["skin_worker_default", ...JUNGLE_WORKER_SKINS.map((entry) => entry.id)]
  ),
  monkey(
    "profile_monkey_scout",
    "scout",
    "rare",
    50,
    "unitScout",
    ["skin_scout_default", ...YOUNG_SCOUT_SKINS.map((entry) => entry.id)]
  ),
  monkey(
    "profile_monkey_warrior",
    "warrior",
    "rare",
    100,
    "unitWarrior",
    ["skin_warrior_default", ...FOREST_WARRIOR_SKINS.map((entry) => entry.id)]
  ),
  monkey(
    "profile_monkey_hunter",
    "hunter",
    "epic",
    250,
    "unitArcher",
    ["skin_hunter_default", ...TRIBAL_HUNTER_SKINS.map((entry) => entry.id)]
  ),
  monkey(
    "profile_monkey_chief",
    "chief",
    "legendary",
    400,
    "menuChiefMascot",
    ["skin_chief_default", ...GOLDEN_CHIEF_SKINS.map((entry) => entry.id)],
    true
  ),
  monkey(
    "profile_monkey_king",
    "king",
    "mythic",
    600,
    "unitChief",
    ["skin_king_default", ...MONKEY_KING_SKINS.map((entry) => entry.id)],
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

export function getProfileSkin(id: ProfileSkinId) {
  return PROFILE_SKINS.find((entry) => entry.id === id);
}

export function getDefaultSkinId(monkeyId: ProfileMonkeyId): ProfileSkinId {
  return PROFILE_SKINS.find((entry) => entry.monkeyId === monkeyId && entry.price === 0)?.id ??
    DEFAULT_PROFILE_SKIN_ID;
}

export function skinsForMonkey(monkeyId: ProfileMonkeyId) {
  const monkey = getProfileMonkey(monkeyId);
  if (!monkey) return [];
  const ids = new Set(monkey.availableSkinIds);
  return PROFILE_SKINS.filter((entry) => ids.has(entry.id));
}

export function sanitizeUnlockedProfileMonkeys(value: unknown): ProfileMonkeyId[] {
  const unlocked = Array.isArray(value) ? value.filter(isProfileMonkeyId) : [];
  return Array.from(new Set([DEFAULT_PROFILE_MONKEY_ID, ...unlocked]));
}

export function sanitizeEquippedProfileMonkey(
  value: unknown,
  unlocked: readonly ProfileMonkeyId[]
): ProfileMonkeyId {
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
    if (saved?.monkeyId === equippedMonkey) return value;
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
    isProfileSkinId(entry) && owned.includes(entry)
  )));
}

export function getCosmeticAppearance(
  monkeyId: ProfileMonkeyId,
  skinId: ProfileSkinId
): CosmeticAppearance {
  const monkey = getProfileMonkey(monkeyId) ?? getProfileMonkey(DEFAULT_PROFILE_MONKEY_ID)!;
  const requestedSkin = getProfileSkin(skinId);
  const skinEntry = requestedSkin?.monkeyId === monkey.id
    ? requestedSkin
    : getProfileSkin(getDefaultSkinId(monkey.id))!;
  return {
    monkey,
    skin: skinEntry,
    rarity: skinEntry.price > 0 ? skinEntry.rarity : monkey.rarity,
    effect: skinEntry.effect,
    portraitAsset: skinEntry.portraitAsset ?? monkey.portraitAsset,
    villageAsset: skinEntry.villageAsset ?? monkey.villageAsset,
    raidAsset: skinEntry.raidAsset ?? monkey.raidAsset,
    victoryAsset: skinEntry.victoryAsset ?? monkey.victoryAsset
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
    group: "early_game",
    acquisition: "direct_purchase"
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
    group: "early_game",
    acquisition: "direct_purchase",
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
    group: "early_game",
    acquisition: "direct_purchase",
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
    group: "early_game",
    acquisition: "direct_purchase",
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
    group: "early_game",
    acquisition: "direct_purchase",
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
    group: "early_game",
    acquisition: "direct_purchase",
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
    group: "early_game",
    acquisition: "direct_purchase",
    presentationGlow,
    portraitAsset: assetKey,
    villageAsset: assetKey,
    raidAsset: assetKey,
    victoryAsset: assetKey
  };
}

function monkey(
  id: ProfileMonkeyId,
  key: string,
  rarity: CosmeticRarity,
  price: number,
  asset: GameAssetKey,
  availableSkinIds: readonly ProfileSkinId[],
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
    featured
  };
}
