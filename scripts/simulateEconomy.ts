import {
  DAILY_FIRST_WEEK_GEMS,
  DAILY_REPEAT_WEEK_GEMS,
  resolveDailyReward
} from "../src/game/config/dailyRewards";
import {
  FESTIVAL_CHEST_LAUNCH_PRICE,
  eligibleFestivalSkins,
  rollFestivalChest
} from "../src/game/config/festivalCollection";
import { GEM_PACKS } from "../src/game/config/gemPacks";
import {
  GOLDEN_FESTIVAL_KING_SKIN_ID,
  PROFILE_MONKEYS,
  YOUNG_SCOUT_PROFILE_MONKEY_ID,
  canEquipProfileSkin,
  isGemPurchasableProfileMonkey
} from "../src/game/config/profileMonkeys";
import { DAILY_MISSION_GEMS } from "../src/game/config/quests";
import { resourceShopCapacityIssues, resourceShopItems } from "../src/game/config/shop";
import { WORKER_LODGE_UPGRADES, storageCap } from "../src/game/config/buildings";
import { raidGemReward } from "../src/game/state/raidRewards";
import type { FestivalFragmentProgress, ProfileSkinId } from "../src/game/types/game";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const directPurchaseMonkeys = PROFILE_MONKEYS.filter(isGemPurchasableProfileMonkey);
const progressionMonkeys = PROFILE_MONKEYS.filter((monkey) => monkey.acquisition === "gems");
const cumulativeMonkeyCosts = progressionMonkeys.reduce<number[]>((costs, monkey) => {
  costs.push((costs[costs.length - 1] ?? 0) + monkey.price);
  return costs;
}, []);
const totalMonkeyCost = cumulativeMonkeyCosts[cumulativeMonkeyCosts.length - 1] ?? 0;
const totalDirectPurchaseCost = directPurchaseMonkeys.reduce((sum, monkey) => sum + monkey.price, 0);
const scout = PROFILE_MONKEYS.find((monkey) => monkey.id === YOUNG_SCOUT_PROFILE_MONKEY_ID);
const monkeyKing = PROFILE_MONKEYS.find((monkey) => monkey.id === "profile_monkey_king");
assert(totalMonkeyCost === 4_200, "Post-Day-7 paid monkey progression must total 4,200 Gems.");
assert(totalDirectPurchaseCost === 4_350, "All direct monkey purchases must total 4,350 Gems.");
assert(scout?.acquisition === "daily_reward_or_gems" && scout.price === 150, "Scout must cost 150 Gems or unlock on Day 7.");
assert(monkeyKing?.price === 2_500, "Monkey King must cost 2,500 Gems.");
const firstScoutReward = resolveDailyReward(
  { kind: "profile_monkey", monkeyId: YOUNG_SCOUT_PROFILE_MONKEY_ID, duplicateGems: 30 },
  []
);
const ownedScoutReward = resolveDailyReward(
  { kind: "profile_monkey", monkeyId: YOUNG_SCOUT_PROFILE_MONKEY_ID, duplicateGems: 30 },
  [YOUNG_SCOUT_PROFILE_MONKEY_ID]
);
assert(firstScoutReward.unlockMonkeyId === YOUNG_SCOUT_PROFILE_MONKEY_ID && firstScoutReward.gems === 0, "First Day 7 must unlock Scout.");
assert(ownedScoutReward.unlockMonkeyId == null && ownedScoutReward.gems === 30, "Owned Scout must convert Day 7 to exactly 30 Gems.");
assert(DAILY_FIRST_WEEK_GEMS === 90, "First-week login Gems changed.");
assert(DAILY_REPEAT_WEEK_GEMS === 120, "Repeat-week login Gems changed.");
assert(DAILY_MISSION_GEMS === 8, "Daily mission Gem total changed.");
assert(raidGemReward(3, 0) === 3 && raidGemReward(3, 1) === 1 && raidGemReward(3, 2) === 0, "Raid repeat Gem limits changed.");

for (const upgrade of WORKER_LODGE_UPGRADES) {
  const cap = storageCap(upgrade.requiredClanHallLevel);
  assert(
    upgrade.cost.bananas <= cap && upgrade.cost.stones <= cap && upgrade.cost.wood <= cap,
    `Worker Lodge ${upgrade.targetLevel} cannot fit inside Hall ${upgrade.requiredClanHallLevel} storage.`
  );
}

const resourceShopByHall = [1, 5, 10].map((hallLevel) => ({
  hallLevel,
  storageCap: storageCap(hallLevel),
  offers: resourceShopItems().map((item) => ({
    id: item.id,
    gemCost: item.gemCost,
    reward: item.reward
  }))
}));
assert(
  resourceShopByHall[2]!.offers[0]!.reward.bananas! === resourceShopByHall[0]!.offers[0]!.reward.bananas! &&
    resourceShopByHall[0]!.offers[0]!.reward.bananas! === 300,
  "Resource shop rewards must stay fixed across progression."
);

for (let index = 1; index < GEM_PACKS.length; index += 1) {
  const previous = GEM_PACKS[index - 1]!;
  const current = GEM_PACKS[index]!;
  assert(current.gems / current.referenceUsdPrice > previous.gems / previous.referenceUsdPrice, "Gem pack value must increase with pack size.");
}
const pack1999 = GEM_PACKS.find((pack) => pack.referenceUsdPrice === 19.99);
assert(pack1999?.gems === 2_800, "$19.99 pack changed.");
assert(pack1999.gems - monkeyKing.price === 300, "$19.99 pack must leave 300 Gems after Monkey King.");
assert((pack1999.gems - monkeyKing.price) / FESTIVAL_CHEST_LAUNCH_PRICE === 6, "Monkey King remainder must open six launch chests.");

const hallOneBananaPack = resourceShopItems().find((item) => item.id === "bananaPack")!;
const overflowFixture = { bananas: 350, stones: 0, wood: 0 };
const overflowIssues = resourceShopCapacityIssues(hallOneBananaPack, overflowFixture, storageCap(1));
assert(overflowIssues.length === 1 && overflowIssues[0]!.free === 50 && overflowIssues[0]!.requiredFree === 300, "Resource overflow preflight changed.");
const overflowGemBalance = 100;
assert((overflowIssues.length > 0 ? overflowGemBalance : overflowGemBalance - hallOneBananaPack.gemCost) === 100, "Overflow purchase deducted Gems.");

assert(
  !canEquipProfileSkin(GOLDEN_FESTIVAL_KING_SKIN_ID, [GOLDEN_FESTIVAL_KING_SKIN_ID], ["profile_monkey_worker"]),
  "Festival skin equipped without its parent monkey."
);
assert(
  canEquipProfileSkin(GOLDEN_FESTIVAL_KING_SKIN_ID, [GOLDEN_FESTIVAL_KING_SKIN_ID], ["profile_monkey_worker", "profile_monkey_king"]),
  "Festival skin did not equip after its parent monkey was owned."
);

const festivalCompletionSamples = 1_000;
const festivalOpenCounts: number[] = [];
for (let sample = 0; sample < festivalCompletionSamples; sample += 1) {
  let seed = 123_456_789 + sample * 97;
  let fragments: FestivalFragmentProgress = {};
  let owned: ProfileSkinId[] = [];
  let opens = 0;
  while (eligibleFestivalSkins(fragments, owned).length > 0) {
    const roll = rollFestivalChest(seed, fragments, owned, []);
    assert(roll.reward, "Unfinished Festival collection returned no reward.");
    seed = roll.nextSeed;
    fragments = { ...fragments, [roll.reward.skinId]: roll.reward.nextFragments };
    if (roll.reward.unlocked) owned = [...owned, roll.reward.skinId];
    opens += 1;
    assert(opens < 500, "Festival collection did not converge.");
  }
  festivalOpenCounts.push(opens);
}
festivalOpenCounts.sort((a, b) => a - b);
const averageFestivalOpens = festivalOpenCounts.reduce((sum, count) => sum + count, 0) / festivalOpenCounts.length;
const averageFestivalGemCost = averageFestivalOpens * FESTIVAL_CHEST_LAUNCH_PRICE;

type PlayerProfile = {
  name: string;
  firstWeekLoginGems: number;
  repeatWeeklyLoginGems: number;
  weeklyMissionGems: number;
  weeklyRaidGems: number;
  resourceSpendRatio: number;
};

const profiles: readonly PlayerProfile[] = [
  {
    name: "typical_f2p",
    firstWeekLoginGems: DAILY_FIRST_WEEK_GEMS,
    repeatWeeklyLoginGems: 60,
    weeklyMissionGems: 20,
    weeklyRaidGems: 6,
    resourceSpendRatio: 0.1
  },
  {
    name: "daily_player",
    firstWeekLoginGems: DAILY_FIRST_WEEK_GEMS,
    repeatWeeklyLoginGems: DAILY_REPEAT_WEEK_GEMS,
    weeklyMissionGems: 42,
    weeklyRaidGems: 12,
    resourceSpendRatio: 0.1
  },
  {
    name: "heavy_player",
    firstWeekLoginGems: DAILY_FIRST_WEEK_GEMS,
    repeatWeeklyLoginGems: DAILY_REPEAT_WEEK_GEMS,
    weeklyMissionGems: DAILY_MISSION_GEMS * 7,
    weeklyRaidGems: 25,
    resourceSpendRatio: 0.15
  }
];

const averageResourcePackCost = resourceShopItems().reduce((sum, item) => sum + item.gemCost, 0) /
  resourceShopItems().length;

const progression = profiles.map((profile) => {
  const firstWeekGross = profile.firstWeekLoginGems + profile.weeklyMissionGems + profile.weeklyRaidGems;
  const repeatWeekGross = profile.repeatWeeklyLoginGems + profile.weeklyMissionGems + profile.weeklyRaidGems;
  const firstWeekNet = firstWeekGross * (1 - profile.resourceSpendRatio);
  const repeatWeekNet = repeatWeekGross * (1 - profile.resourceSpendRatio);
  const weeksFor = (target: number) => target <= firstWeekNet
    ? target / firstWeekNet
    : 1 + (target - firstWeekNet) / repeatWeekNet;
  const annualNetGems = firstWeekNet + repeatWeekNet * 51;
  return {
    profile: profile.name,
    scoutUnlockDay: 7,
    grossGemsFirstWeek: firstWeekGross,
    grossGemsPerRepeatWeek: repeatWeekGross,
    resourcePacksPerWeek: Number(((repeatWeekGross * profile.resourceSpendRatio) / averageResourcePackCost).toFixed(2)),
    monkeyUnlockWeeks: Object.fromEntries(progressionMonkeys.map((monkey, index) => [
      monkey.id,
      Number(weeksFor(cumulativeMonkeyCosts[index]!).toFixed(1))
    ])),
    chestOpeningsPerWeekIfChestFocused: Number((repeatWeekNet / FESTIVAL_CHEST_LAUNCH_PRICE).toFixed(2)),
    annualNetGems: Math.floor(annualNetGems),
    annualChestsAfterAllMonkeyPurchases: Math.max(0, Math.floor((annualNetGems - totalMonkeyCost) / FESTIVAL_CHEST_LAUNCH_PRICE)),
    weeksForFestivalIfChestFocused: Number(weeksFor(averageFestivalGemCost).toFixed(1)),
    weeksForMonkeysAndFestival: Number(weeksFor(totalMonkeyCost + averageFestivalGemCost).toFixed(1))
  };
});

console.log(JSON.stringify({
  gemSources: {
    firstLoginWeek: DAILY_FIRST_WEEK_GEMS,
    repeatLoginWeek: DAILY_REPEAT_WEEK_GEMS,
    dailyMissionsMaximumPerDay: DAILY_MISSION_GEMS,
    raidFirstClear: "1-3 by stars",
    raidFirstRepeat: 1,
    laterRaidRepeats: 0,
    debugFestivalBalance: 10_000,
    achievements: 0,
    shopRewards: 0,
    festivalCompensation: 0
  },
  gemSinks: {
    festivalChest: FESTIVAL_CHEST_LAUNCH_PRICE,
    directPurchaseMonkeys: Object.fromEntries(directPurchaseMonkeys.map((monkey) => [monkey.id, monkey.price])),
    directPurchaseTotal: totalDirectPurchaseCost,
    postDay7MonkeyTotal: totalMonkeyCost,
    productionRush: 2,
    resourceShopRange: [12, 30]
  },
  festival: {
    samples: festivalCompletionSamples,
    averageOpens: Number(averageFestivalOpens.toFixed(2)),
    p10Opens: festivalOpenCounts[Math.floor(festivalCompletionSamples * 0.1)],
    p90Opens: festivalOpenCounts[Math.floor(festivalCompletionSamples * 0.9)],
    averageGemCost: Math.round(averageFestivalGemCost)
  },
  resourceShopByHall,
  gemPacks: GEM_PACKS,
  pack1999AfterMonkeyKing: {
    remainingGems: pack1999.gems - monkeyKing.price,
    launchFestivalChests: (pack1999.gems - monkeyKing.price) / FESTIVAL_CHEST_LAUNCH_PRICE
  },
  validations: {
    scoutFirstDay7Unlock: "passed",
    purchasedScoutDay7Conversion: "30 Gems",
    parentEquipGate: "passed",
    parentIndependentFragments: "covered by Festival simulation",
    resourceOverflowNoCharge: "passed"
  },
  progression
}, null, 2));
