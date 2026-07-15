import {
  FESTIVAL_PROFILE_SKINS,
  getProfileSkin,
  type CosmeticRarity
} from "./profileMonkeys";
import type {
  FestivalChestOpenResult,
  FestivalChestTransaction,
  FestivalFragmentProgress,
  ProfileMonkeyId,
  ProfileSkinId
} from "../types/game";

export const FESTIVAL_CHEST_REGULAR_PRICE = 100;
export const FESTIVAL_CHEST_LAUNCH_PRICE = 50;

export const FESTIVAL_RARITY_RULES: Record<
  CosmeticRarity,
  { weight: number; required: number; fragmentMin: number; fragmentMax: number }
> = {
  common: { weight: 45, required: 5, fragmentMin: 2, fragmentMax: 3 },
  rare: { weight: 30, required: 8, fragmentMin: 1, fragmentMax: 2 },
  epic: { weight: 17, required: 12, fragmentMin: 1, fragmentMax: 2 },
  legendary: { weight: 7, required: 20, fragmentMin: 1, fragmentMax: 1 },
  mythic: { weight: 1, required: 35, fragmentMin: 1, fragmentMax: 1 }
};

export const FESTIVAL_RARITIES: readonly CosmeticRarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic"
];

export type FestivalChestReward = {
  skinId: ProfileSkinId;
  rarity: CosmeticRarity;
  fragments: number;
  previousFragments: number;
  nextFragments: number;
  requiredFragments: number;
  unlocked: boolean;
};

export type FestivalChestRoll = {
  reward: FestivalChestReward | null;
  nextSeed: number;
};

export type FestivalChestSnapshot = {
  gems: number;
  fragments: FestivalFragmentProgress;
  ownedSkinIds: readonly ProfileSkinId[];
  unlockedMonkeyIds: readonly ProfileMonkeyId[];
  rngSeed: number;
  pendingTransaction: FestivalChestTransaction | null;
};

export type PreparedFestivalChestOpen = {
  result: FestivalChestOpenResult;
  snapshot: FestivalChestSnapshot;
};

const FESTIVAL_SKIN_IDS = new Set(FESTIVAL_PROFILE_SKINS.map((skin) => skin.id));

export function festivalFragmentRequirement(skinId: ProfileSkinId) {
  const skin = getProfileSkin(skinId);
  return skin?.catalogStatus === "festival" ? FESTIVAL_RARITY_RULES[skin.rarity].required : 0;
}

export function isFestivalSkinId(value: unknown): value is ProfileSkinId {
  return typeof value === "string" && FESTIVAL_SKIN_IDS.has(value);
}

export function festivalSkinComplete(
  skinId: ProfileSkinId,
  progress: FestivalFragmentProgress,
  ownedSkinIds: readonly ProfileSkinId[]
) {
  return ownedSkinIds.includes(skinId) ||
    (progress[skinId] ?? 0) >= festivalFragmentRequirement(skinId);
}

export function unfinishedFestivalSkins(
  progress: FestivalFragmentProgress,
  ownedSkinIds: readonly ProfileSkinId[]
) {
  return FESTIVAL_PROFILE_SKINS.filter(
    (skin) => !festivalSkinComplete(skin.id, progress, ownedSkinIds)
  );
}

export function eligibleFestivalSkins(
  progress: FestivalFragmentProgress,
  ownedSkinIds: readonly ProfileSkinId[],
  _unlockedMonkeyIds: readonly ProfileMonkeyId[] = []
) {
  return unfinishedFestivalSkins(progress, ownedSkinIds);
}

export function effectiveFestivalRarityOdds(
  progress: FestivalFragmentProgress,
  ownedSkinIds: readonly ProfileSkinId[],
  unlockedMonkeyIds: readonly ProfileMonkeyId[]
) {
  const eligible = eligibleFestivalSkins(progress, ownedSkinIds, unlockedMonkeyIds);
  const available = new Set(eligible.map((skin) => skin.rarity));
  const total = FESTIVAL_RARITIES.reduce(
    (sum, rarity) => sum + (available.has(rarity) ? FESTIVAL_RARITY_RULES[rarity].weight : 0),
    0
  );
  return FESTIVAL_RARITIES.map((rarity) => ({
    rarity,
    percent: total > 0 && available.has(rarity)
      ? (FESTIVAL_RARITY_RULES[rarity].weight / total) * 100
      : 0
  }));
}

export function normalizeFestivalSeed(value: unknown, fallback = 0x6d2b79f5) {
  if (!Number.isFinite(value)) return fallback >>> 0;
  const normalized = Math.floor(value as number) >>> 0;
  return normalized === 0 ? fallback >>> 0 : normalized;
}

function advanceSeed(seed: number) {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

export function rollFestivalChest(
  seed: number,
  progress: FestivalFragmentProgress,
  ownedSkinIds: readonly ProfileSkinId[],
  unlockedMonkeyIds: readonly ProfileMonkeyId[]
): FestivalChestRoll {
  let nextSeed = normalizeFestivalSeed(seed);
  const random = () => {
    nextSeed = advanceSeed(nextSeed);
    return nextSeed / 0x100000000;
  };
  const eligible = eligibleFestivalSkins(progress, ownedSkinIds, unlockedMonkeyIds);
  if (eligible.length === 0) return { reward: null, nextSeed };

  const availableRarities = FESTIVAL_RARITIES.filter((rarity) =>
    eligible.some((skin) => skin.rarity === rarity)
  );
  const totalWeight = availableRarities.reduce(
    (sum, rarity) => sum + FESTIVAL_RARITY_RULES[rarity].weight,
    0
  );
  let rarityRoll = random() * totalWeight;
  let selectedRarity = availableRarities[availableRarities.length - 1]!;
  for (const rarity of availableRarities) {
    rarityRoll -= FESTIVAL_RARITY_RULES[rarity].weight;
    if (rarityRoll < 0) {
      selectedRarity = rarity;
      break;
    }
  }

  const rarityPool = eligible.filter((skin) => skin.rarity === selectedRarity);
  const skin = rarityPool[Math.min(rarityPool.length - 1, Math.floor(random() * rarityPool.length))]!;
  const rule = FESTIVAL_RARITY_RULES[selectedRarity];
  const rolledFragments = rule.fragmentMin +
    Math.floor(random() * (rule.fragmentMax - rule.fragmentMin + 1));
  const previousFragments = Math.min(rule.required, Math.max(0, progress[skin.id] ?? 0));
  const fragments = Math.min(rolledFragments, rule.required - previousFragments);
  const nextFragments = previousFragments + fragments;

  return {
    reward: {
      skinId: skin.id,
      rarity: selectedRarity,
      fragments,
      previousFragments,
      nextFragments,
      requiredFragments: rule.required,
      unlocked: nextFragments >= rule.required
    },
    nextSeed
  };
}

export function prepareFestivalChestOpen(
  snapshot: FestivalChestSnapshot,
  options: { free: boolean; seed?: number; now: number }
): PreparedFestivalChestOpen {
  if (snapshot.pendingTransaction) {
    return {
      result: { status: "pending", transaction: snapshot.pendingTransaction },
      snapshot
    };
  }
  if (!options.free && snapshot.gems < FESTIVAL_CHEST_LAUNCH_PRICE) {
    return { result: { status: "insufficient" }, snapshot };
  }
  const rollSeed = options.seed == null
    ? normalizeFestivalSeed(snapshot.rngSeed)
    : normalizeFestivalSeed(options.seed);
  const roll = rollFestivalChest(
    rollSeed,
    snapshot.fragments,
    snapshot.ownedSkinIds,
    snapshot.unlockedMonkeyIds
  );
  if (!roll.reward) {
    return { result: { status: "complete" }, snapshot };
  }
  const transaction: FestivalChestTransaction = {
    id: `festival-${options.now}-${rollSeed}-${roll.reward.skinId}`,
    seed: rollSeed,
    ...roll.reward,
    chargedGems: options.free ? 0 : FESTIVAL_CHEST_LAUNCH_PRICE,
    createdAt: options.now
  };
  return {
    result: { status: "opened", transaction },
    snapshot: {
      gems: Math.max(0, snapshot.gems - transaction.chargedGems),
      fragments: {
        ...snapshot.fragments,
        [transaction.skinId]: transaction.nextFragments
      },
      ownedSkinIds: transaction.unlocked
        ? Array.from(new Set([...snapshot.ownedSkinIds, transaction.skinId]))
        : snapshot.ownedSkinIds,
      unlockedMonkeyIds: snapshot.unlockedMonkeyIds,
      rngSeed: roll.nextSeed,
      pendingTransaction: transaction
    }
  };
}

export function sanitizeFestivalFragments(
  value: unknown,
  ownedSkinIds: readonly ProfileSkinId[]
): FestivalFragmentProgress {
  const source = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
  const result: FestivalFragmentProgress = {};
  for (const skin of FESTIVAL_PROFILE_SKINS) {
    const required = FESTIVAL_RARITY_RULES[skin.rarity].required;
    const saved = source[skin.id];
    const amount = ownedSkinIds.includes(skin.id)
      ? required
      : Number.isFinite(saved)
        ? Math.min(required, Math.max(0, Math.floor(saved as number)))
        : 0;
    if (amount > 0) result[skin.id] = amount;
  }
  return result;
}

export function sanitizeFestivalTransaction(value: unknown): FestivalChestTransaction | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<FestivalChestTransaction>;
  if (
    typeof entry.id !== "string" || entry.id.length === 0 ||
    !isFestivalSkinId(entry.skinId) ||
    !Number.isFinite(entry.seed) || !Number.isFinite(entry.createdAt)
  ) return null;
  const skin = getProfileSkin(entry.skinId);
  if (!skin) return null;
  const required = FESTIVAL_RARITY_RULES[skin.rarity].required;
  const savedNext = Number.isFinite(entry.nextFragments)
    ? Math.min(required, Math.max(1, Math.floor(entry.nextFragments!)))
    : 0;
  const previous = Number.isFinite(entry.previousFragments) && savedNext > 0
    ? Math.min(savedNext - 1, Math.max(0, Math.floor(entry.previousFragments!)))
    : 0;
  const next = savedNext > previous
    ? savedNext
    : Math.min(required, previous + 1);
  if (next <= previous) return null;
  return {
    id: entry.id,
    seed: normalizeFestivalSeed(entry.seed),
    skinId: skin.id,
    rarity: skin.rarity,
    fragments: next - previous,
    previousFragments: previous,
    nextFragments: next,
    requiredFragments: required,
    unlocked: next >= required,
    chargedGems: entry.chargedGems === 0 ? 0 : FESTIVAL_CHEST_LAUNCH_PRICE,
    createdAt: Math.max(0, Math.floor(entry.createdAt!))
  };
}
