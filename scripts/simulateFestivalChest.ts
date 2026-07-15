import {
  FESTIVAL_RARITIES,
  FESTIVAL_RARITY_RULES,
  effectiveFestivalRarityOdds,
  eligibleFestivalSkins,
  prepareFestivalChestOpen,
  rollFestivalChest,
  sanitizeFestivalFragments,
  sanitizeFestivalTransaction,
  type FestivalChestSnapshot
} from "../src/game/config/festivalCollection";
import {
  FESTIVAL_PROFILE_SKINS,
  GOLDEN_FESTIVAL_KING_SKIN_ID,
  PROFILE_MONKEYS,
  getCosmeticAppearance
} from "../src/game/config/profileMonkeys";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const simulationCount = 200_000;
const allMonkeyIds = PROFILE_MONKEYS.map((monkey) => monkey.id);
const forcedRaritySeeds = {
  common: 1,
  rare: 553,
  epic: 1327,
  legendary: 1765,
  mythic: 1946
} as const;
const expectedFestivalOrder = [
  ["skin_worker_festival", "festivalWorker"],
  ["skin_worker_sun_parade", "sunParadeWorker"],
  ["skin_worker_watermelon_feast", "watermelonFeastWorker"],
  ["skin_worker_banana_dj", "festivalBananaDj"],
  ["skin_scout_fire_dancer", "festivalFireDancer"],
  ["skin_warrior_beach", "festivalBeachWarrior"],
  ["skin_hunter_tropical_archer", "festivalTropicalArcher"],
  ["skin_chief_sunset", "festivalSunsetChief"],
  ["skin_scout_fire_monkey", "festivalFireMonkey"],
  ["skin_king_golden_festival", "festivalGoldenKing"]
] as const;
assert(FESTIVAL_PROFILE_SKINS.length === 10, "Festival Collection must contain exactly 10 skins.");
assert(
  FESTIVAL_PROFILE_SKINS.every((skin, index) => skin.id === expectedFestivalOrder[index]?.[0]),
  "Festival Collection order changed."
);
for (const rarity of FESTIVAL_RARITIES) {
  const expected = { common: 2, rare: 2, epic: 3, legendary: 2, mythic: 1 }[rarity];
  assert(FESTIVAL_PROFILE_SKINS.filter((skin) => skin.rarity === rarity).length === expected, `Invalid ${rarity} skin count.`);
}
for (const rarity of FESTIVAL_RARITIES) {
  const forced = rollFestivalChest(forcedRaritySeeds[rarity], {}, [], allMonkeyIds);
  assert(forced.reward?.rarity === rarity, `Development seed did not force ${rarity}.`);
}
assert(
  FESTIVAL_PROFILE_SKINS.find((skin) => skin.id === GOLDEN_FESTIVAL_KING_SKIN_ID)?.rarity === "mythic",
  "Golden Festival King must be Mythic."
);
for (const [index, skin] of FESTIVAL_PROFILE_SKINS.entries()) {
  const appearance = getCosmeticAppearance(skin.monkeyId, skin.id);
  const expectedAsset = expectedFestivalOrder[index]?.[1];
  assert(
    appearance.portraitAsset === expectedAsset &&
      appearance.villageAsset === expectedAsset &&
      appearance.raidAsset === expectedAsset &&
      appearance.victoryAsset === expectedAsset,
    `${skin.id} has an incomplete or reused appearance mapping.`
  );
}
const counts = Object.fromEntries(FESTIVAL_RARITIES.map((rarity) => [rarity, 0])) as Record<(typeof FESTIVAL_RARITIES)[number], number>;
let distributionSeed = 123456789;
for (let index = 0; index < simulationCount; index += 1) {
  const roll = rollFestivalChest(distributionSeed, {}, [], allMonkeyIds);
  assert(roll.reward, "Fresh Festival pool must always produce a reward.");
  counts[roll.reward.rarity] += 1;
  distributionSeed = roll.nextSeed;
}

for (const rarity of FESTIVAL_RARITIES) {
  const actual = (counts[rarity] / simulationCount) * 100;
  const expected = FESTIVAL_RARITY_RULES[rarity].weight;
  assert(Math.abs(actual - expected) < 0.45, `${rarity} distribution outside tolerance: ${actual}`);
}

const workerMonkeyId = "profile_monkey_worker";
const workerEligible = eligibleFestivalSkins({}, [], [workerMonkeyId]);
assert(workerEligible.length === 10, "Parent ownership incorrectly filtered the Festival pool.");
const workerFestivalIds = workerEligible.filter((skin) => skin.monkeyId === workerMonkeyId).map((skin) => skin.id);
const parentLockedSnapshot: FestivalChestSnapshot = {
  gems: 500,
  fragments: {},
  ownedSkinIds: workerFestivalIds,
  unlockedMonkeyIds: [workerMonkeyId],
  rngSeed: 777,
  pendingTransaction: null
};
const parentLockedResult = prepareFestivalChestOpen(parentLockedSnapshot, { free: false, now: 17 });
assert(parentLockedResult.result.status === "opened", "Parent-locked fragments should remain eligible.");
assert(parentLockedResult.snapshot.gems === parentLockedSnapshot.gems - 50, "Parent-independent chest did not charge exactly once.");
assert(
  parentLockedResult.result.transaction.skinId !== undefined &&
    !workerFestivalIds.includes(parentLockedResult.result.transaction.skinId),
  "Parent-independent fixture did not award a locked-parent skin."
);

let snapshot: FestivalChestSnapshot = {
  gems: 1_000_000,
  fragments: {},
  ownedSkinIds: [],
  unlockedMonkeyIds: allMonkeyIds,
  rngSeed: 987654321,
  pendingTransaction: null
};
let progressionOpens = 0;
const removedAfterUnlock = new Set<string>();
while (eligibleFestivalSkins(snapshot.fragments, snapshot.ownedSkinIds, snapshot.unlockedMonkeyIds).length > 0) {
  const beforeGems = snapshot.gems;
  const prepared = prepareFestivalChestOpen(snapshot, { free: false, now: 1_000_000 + progressionOpens });
  assert(prepared.result.status === "opened", "Progression chest must open.");
  assert(prepared.snapshot.gems === beforeGems - 50, "Paid chest must charge exactly once.");
  const transaction = prepared.result.transaction;
  assert(transaction.fragments > 0, "Chest must grant fragments.");
  assert(transaction.nextFragments <= transaction.requiredFragments, "Fragments must clamp to requirement.");

  const restarted = JSON.parse(JSON.stringify(prepared.snapshot)) as FestivalChestSnapshot;
  const repeated = prepareFestivalChestOpen(restarted, { free: false, now: 9_000_000 + progressionOpens });
  assert(repeated.result.status === "pending", "Restarted pending transaction must not reroll.");
  assert(repeated.result.transaction.id === transaction.id, "Restarted transaction ID changed.");
  assert(repeated.snapshot.gems === prepared.snapshot.gems, "Pending transaction charged twice.");
  assert(repeated.snapshot.rngSeed === prepared.snapshot.rngSeed, "Pending transaction advanced RNG twice.");

  if (transaction.unlocked) {
    removedAfterUnlock.add(transaction.skinId);
    assert(
      !eligibleFestivalSkins(prepared.snapshot.fragments, prepared.snapshot.ownedSkinIds, prepared.snapshot.unlockedMonkeyIds)
        .some((skin) => skin.id === transaction.skinId),
      "Unlocked skin remained in the eligible pool."
    );
  }
  snapshot = { ...prepared.snapshot, pendingTransaction: null };
  progressionOpens += 1;
  assert(progressionOpens < 2_000, "Festival progression did not converge.");
}

assert(snapshot.ownedSkinIds.length === FESTIVAL_PROFILE_SKINS.length, "Not every Festival skin unlocked.");
assert(removedAfterUnlock.size === FESTIVAL_PROFILE_SKINS.length, "Every completed skin must leave the pool.");
const completed = prepareFestivalChestOpen(snapshot, { free: false, now: 99_000_000 });
assert(completed.result.status === "complete", "Completed collection must disable the chest.");
assert(completed.snapshot.gems === snapshot.gems, "Completed collection charged Gems.");

const hydratedFragments = sanitizeFestivalFragments(
  JSON.parse(JSON.stringify(snapshot.fragments)),
  JSON.parse(JSON.stringify(snapshot.ownedSkinIds))
);
assert(
  FESTIVAL_PROFILE_SKINS.every((skin) =>
    hydratedFragments[skin.id] === snapshot.fragments[skin.id]
  ),
  "Fragment hydration changed valid progress."
);
const hydrationOpen = prepareFestivalChestOpen(
  { gems: 100, fragments: {}, ownedSkinIds: [], unlockedMonkeyIds: allMonkeyIds, rngSeed: 123, pendingTransaction: null },
  { free: false, now: 42 }
);
assert(hydrationOpen.result.status === "opened", "Hydration fixture did not open.");
const sanitizedTransaction = sanitizeFestivalTransaction(
  JSON.parse(JSON.stringify(hydrationOpen.result.transaction))
);
assert(sanitizedTransaction?.id === hydrationOpen.result.transaction.id, "Valid pending transaction did not hydrate.");
const finalTransaction = sanitizeFestivalTransaction(JSON.parse(JSON.stringify(hydrationOpen.result)));
// The wrapper is intentionally rejected; only the persisted transaction body is valid.
assert(finalTransaction == null, "Transaction sanitizer accepted an invalid wrapper.");

const stats = {
  simulations: simulationCount,
  counts,
  percentages: Object.fromEntries(FESTIVAL_RARITIES.map((rarity) => [
    rarity,
    Number(((counts[rarity] / simulationCount) * 100).toFixed(4))
  ])),
  initialEffectiveOdds: effectiveFestivalRarityOdds({}, [], allMonkeyIds),
  progressionOpens,
  unlockedSkins: snapshot.ownedSkinIds.length,
  finalGems: snapshot.gems,
  restartRecovery: "passed",
  doubleCharge: "passed",
  completedPool: "passed",
  parentIndependentFragments: "passed",
  hydration: "passed",
  forcedRaritySeeds
};

console.log(JSON.stringify(stats, null, 2));
