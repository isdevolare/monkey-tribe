import type { GameAssetKey } from "../assets/gameAssets";
import type { ProfileMonkeyId, ProfileSkinId } from "../types/game";

export type CosmeticRarity = "common" | "rare" | "epic" | "legendary" | "mythic";
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
  featured?: boolean;
  specialOffer?: boolean;
  /** Stable future asset slot; the base appearance is used until art ships. */
  placeholderAssetName?: string;
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

const DEFAULT_SKINS: readonly ProfileSkin[] = [
  defaultSkin("profile_monkey_scout", "skin_scout_default"),
  defaultSkin("profile_monkey_worker", "skin_worker_default"),
  defaultSkin("profile_monkey_warrior", "skin_warrior_default"),
  defaultSkin("profile_monkey_hunter", "skin_hunter_default"),
  defaultSkin("profile_monkey_chief", "skin_chief_default"),
  defaultSkin("profile_monkey_king", "skin_king_default")
];

const MONKEY_KING_SKINS: readonly ProfileSkin[] = [
  skin("skin_king_golden", "collection.skin.goldenKing", "legendary", 300, "gold_glow", {
    featured: true,
    placeholderAssetName: "skin_monkey_king_golden"
  }),
  skin("skin_king_pirate", "collection.skin.pirateKing", "epic", 220, "purple_glow", {
    portraitAsset: "unitEnemyFighter",
    villageAsset: "unitEnemyFighter",
    raidAsset: "unitEnemyFighter",
    victoryAsset: "unitEnemyFighter",
    featured: true,
    placeholderAssetName: "skin_monkey_king_pirate"
  }),
  skin("skin_king_samurai", "collection.skin.samuraiKing", "epic", 280, "purple_glow", {
    portraitAsset: "unitWarrior",
    villageAsset: "unitWarrior",
    raidAsset: "unitWarrior",
    victoryAsset: "unitWarrior",
    placeholderAssetName: "skin_monkey_king_samurai"
  }),
  skin("skin_king_viking", "collection.skin.vikingKing", "rare", 200, "silver_sheen", {
    portraitAsset: "unitFighter",
    villageAsset: "unitFighter",
    raidAsset: "unitFighter",
    victoryAsset: "unitFighter",
    placeholderAssetName: "skin_monkey_king_viking"
  }),
  skin("skin_king_cyber", "collection.skin.cyberKing", "mythic", 600, "mythic_shimmer", {
    featured: true,
    specialOffer: true,
    placeholderAssetName: "skin_monkey_king_cyber"
  }),
  skin("skin_king_lava", "collection.skin.lavaKing", "legendary", 450, "ember_glow", {
    featured: true,
    placeholderAssetName: "skin_monkey_king_lava"
  }),
  skin("skin_king_pharaoh", "collection.skin.pharaohKing", "legendary", 400, "gold_glow", {
    placeholderAssetName: "skin_monkey_king_pharaoh"
  }),
  skin("skin_king_christmas", "collection.skin.christmasKing", "epic", 250, "purple_glow", {
    portraitAsset: "menuChiefMascot",
    villageAsset: "menuChiefMascot",
    raidAsset: "menuChiefMascot",
    victoryAsset: "menuChiefMascot",
    specialOffer: true,
    placeholderAssetName: "skin_monkey_king_christmas"
  }),
  skin("skin_king_spirit", "collection.skin.spiritKing", "mythic", 650, "spirit_glow", {
    featured: true,
    specialOffer: true,
    placeholderAssetName: "skin_monkey_king_spirit"
  })
];

export const PROFILE_SKINS: readonly ProfileSkin[] = [
  ...DEFAULT_SKINS,
  ...MONKEY_KING_SKINS
];

// One catalog entry owns every visual surface. Adding a monkey later is data
// only; no store, save, raid or screen switch needs another id-specific branch.
export const PROFILE_MONKEYS: readonly ProfileMonkey[] = [
  monkey("profile_monkey_scout", "scout", "common", 50, "unitScout", ["skin_scout_default"]),
  monkey("profile_monkey_worker", "worker", "common", 0, "unitWorker", ["skin_worker_default"]),
  monkey("profile_monkey_warrior", "warrior", "rare", 100, "unitWarrior", ["skin_warrior_default"]),
  monkey("profile_monkey_hunter", "hunter", "epic", 250, "unitArcher", ["skin_hunter_default"]),
  monkey("profile_monkey_chief", "chief", "legendary", 400, "menuChiefMascot", ["skin_chief_default"], true),
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
        const skinEntry = getProfileSkin(entry);
        return skinEntry != null && unlockedMonkeys.includes(skinEntry.monkeyId);
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
    effect: "none"
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
    ...options
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
