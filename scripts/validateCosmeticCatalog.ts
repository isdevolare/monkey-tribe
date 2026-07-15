import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ACTIVE_COSMETIC_CHEST_IDS } from "../src/game/config/cosmeticShop";
import {
  ACTIVE_PROFILE_SKINS,
  ARCHIVED_PROFILE_SKINS,
  DEFAULT_PROFILE_MONKEY_ID,
  DEFAULT_PROFILE_SKINS,
  FESTIVAL_PROFILE_SKINS,
  PROFILE_MONKEYS,
  getCosmeticAppearance,
  getDefaultSkinId,
  sanitizeEquippedProfileMonkey,
  sanitizeEquippedProfileSkin,
  sanitizeNewProfileSkins,
  sanitizeOwnedProfileSkins,
  skinsForMonkey
} from "../src/game/config/profileMonkeys";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const expectedDefaults = [
  "skin_worker_default",
  "skin_scout_default",
  "skin_warrior_default",
  "skin_hunter_default",
  "skin_chief_default",
  "skin_king_default"
] as const;

const expectedFestival = [
  "skin_worker_festival",
  "skin_worker_sun_parade",
  "skin_worker_watermelon_feast",
  "skin_worker_banana_dj",
  "skin_scout_fire_dancer",
  "skin_warrior_beach",
  "skin_hunter_tropical_archer",
  "skin_chief_sunset",
  "skin_scout_fire_monkey",
  "skin_king_golden_festival"
] as const;

const expectedArchived = [
  "skin_worker_banana_delivery",
  "skin_worker_master_builder",
  "skin_scout_jungle_pathfinder",
  "skin_scout_moonlight_tracker",
  "warrior_savage_raider",
  "warrior_ancient_warchief",
  "hunter_emerald_ranger",
  "hunter_royal_eagle_archer",
  "skin_chief_golden_emperor",
  "skin_king_celestial",
  "skin_king_golden",
  "skin_king_pirate",
  "skin_king_samurai",
  "skin_king_viking",
  "skin_king_cyber",
  "skin_king_lava",
  "skin_king_pharaoh",
  "skin_king_christmas",
  "skin_king_spirit"
] as const;

function sameIds(actual: readonly string[], expected: readonly string[]) {
  return actual.length === expected.length && expected.every((id) => actual.includes(id));
}

assert(sameIds(DEFAULT_PROFILE_SKINS.map((skin) => skin.id), expectedDefaults), "Default catalog must contain exactly six expected appearances.");
assert(FESTIVAL_PROFILE_SKINS.every((skin, index) => skin.id === expectedFestival[index]), "Festival catalog order or IDs changed.");
assert(sameIds(ARCHIVED_PROFILE_SKINS.map((skin) => skin.id), expectedArchived), "Archived catalog IDs changed.");
assert(ACTIVE_PROFILE_SKINS.length === 16, "Active cosmetic catalog must contain exactly 16 appearances.");
assert(ACTIVE_PROFILE_SKINS.every((skin) => skin.catalogStatus !== "archived"), "Archived skin leaked into active catalog.");
assert(ACTIVE_PROFILE_SKINS.every((skin) => skin.catalogStatus === "default" || skin.catalogStatus === "festival"), "Unexpected active catalog status.");
assert(DEFAULT_PROFILE_SKINS.every((skin) => skin.price === 0), "A default appearance has a direct price.");
assert(FESTIVAL_PROFILE_SKINS.every((skin) => skin.price === 0), "A Festival appearance has a direct price.");
assert(ACTIVE_COSMETIC_CHEST_IDS.length === 1 && ACTIVE_COSMETIC_CHEST_IDS[0] === "festival_chest", "Shop must expose exactly one Festival Chest.");

for (const monkey of PROFILE_MONKEYS) {
  const available = skinsForMonkey(monkey.id);
  assert(available.length === monkey.availableSkinIds.length, `${monkey.id} has a stale skin route.`);
  assert(available.every((skin) => skin.catalogStatus !== "archived"), `${monkey.id} exposes an archived skin.`);
  assert(available.some((skin) => skin.id === getDefaultSkinId(monkey.id)), `${monkey.id} is missing its default appearance.`);
}

const archivedChief = "skin_chief_golden_emperor";
const ownedWithArchived = sanitizeOwnedProfileSkins(
  [archivedChief],
  [DEFAULT_PROFILE_MONKEY_ID, "profile_monkey_chief"]
);
assert(ownedWithArchived.includes(archivedChief), "Archived ownership was not preserved for save compatibility.");
const archivedParentFallback = sanitizeEquippedProfileMonkey(
  "profile_monkey_worker",
  [DEFAULT_PROFILE_MONKEY_ID, "profile_monkey_chief"],
  archivedChief
);
assert(archivedParentFallback === "profile_monkey_chief", "Archived equipped skin did not select its valid parent.");
assert(
  sanitizeEquippedProfileSkin(archivedChief, archivedParentFallback, ownedWithArchived) === "skin_chief_default",
  "Archived equipped skin did not fall back to its parent's default appearance."
);
const invalidParentFallback = sanitizeEquippedProfileMonkey(
  "not_a_monkey",
  [DEFAULT_PROFILE_MONKEY_ID],
  archivedChief
);
assert(invalidParentFallback === DEFAULT_PROFILE_MONKEY_ID, "Invalid archived parent did not fall back to Jungle Worker.");
assert(
  sanitizeEquippedProfileSkin(archivedChief, invalidParentFallback, ownedWithArchived) === "skin_worker_default",
  "Invalid archived parent did not fall back to Jungle Worker default."
);
assert(sanitizeNewProfileSkins([archivedChief], ownedWithArchived).length === 0, "Archived NEW marker survived hydration.");
assert(
  getCosmeticAppearance("profile_monkey_chief", archivedChief).skin.id === "skin_chief_default",
  "Archived appearance remained reachable through the shared resolver."
);

const root = process.cwd();
const playerFacingSource = [
  "src/components/game/MonkeyCollectionModal.tsx",
  "src/components/game/CosmeticDetailModal.tsx",
  "src/game/config/cosmeticShop.ts",
  "src/game/state/gameStore.ts",
  "src/game/types/game.ts"
].map((path) => readFileSync(resolve(root, path), "utf8")).join("\n");
for (const obsoletePath of ["unlockProfileSkin", "direct_purchase", "shopSkinsForSection", "early_game"] as const) {
  assert(!playerFacingSource.includes(obsoletePath), `Obsolete direct-purchase path remains: ${obsoletePath}`);
}

console.log(JSON.stringify({
  activeDefaults: expectedDefaults,
  activeFestival: expectedFestival,
  archived: expectedArchived,
  activeDefaultCount: DEFAULT_PROFILE_SKINS.length,
  activeFestivalCount: FESTIVAL_PROFILE_SKINS.length,
  activeNonFestivalPremiumCount: 0,
  activeChestCount: ACTIVE_COSMETIC_CHEST_IDS.length,
  directSkinPurchaseActionCount: 0,
  archivedOwnershipPreserved: true,
  archivedEquipFallback: "archived parent default; Jungle Worker default when parent is unavailable"
}, null, 2));
