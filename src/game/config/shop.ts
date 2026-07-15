import type { Resources } from "../types/game";

export type ShopItem = {
  id: string;
  gemCost: number;
  reward: Partial<Resources>;
  icon: "resourceBanana" | "resourceStone" | "resourceWood" | "resourceJungleGem";
};

export type ResourceShopCapacityIssue = {
  resource: keyof Resources;
  current: number;
  reward: number;
  free: number;
  requiredFree: number;
};

/**
 * Fixed-reward Gem shop. Each pack always grants the exact amounts shown on
 * its card — rewards never scale with Clan Hall level or storage capacity, so
 * the value stays predictable at every stage of progression.
 */
export const RESOURCE_SHOP_ITEMS: readonly ShopItem[] = [
  {
    id: "bananaPack",
    gemCost: 12,
    reward: { bananas: 300 },
    icon: "resourceBanana"
  },
  {
    id: "stonePack",
    gemCost: 16,
    reward: { stones: 180 },
    icon: "resourceStone"
  },
  {
    id: "woodPack",
    gemCost: 14,
    reward: { wood: 220 },
    icon: "resourceWood"
  },
  {
    id: "bountyChest",
    gemCost: 30,
    reward: { bananas: 220, stones: 140, wood: 170 },
    icon: "resourceJungleGem"
  }
];

export function resourceShopItems(): readonly ShopItem[] {
  return RESOURCE_SHOP_ITEMS;
}

export function getResourceShopItem(id: string) {
  return RESOURCE_SHOP_ITEMS.find((item) => item.id === id);
}

/** Shared preflight used by both UI and store so a paid pack never clips. */
export function resourceShopCapacityIssues(
  item: ShopItem,
  resources: Resources,
  capacity: number
): ResourceShopCapacityIssue[] {
  return (["bananas", "stones", "wood"] as const).flatMap((resource) => {
    const reward = item.reward[resource] ?? 0;
    const free = Math.max(0, capacity - resources[resource]);
    return reward > free
      ? [{ resource, current: resources[resource], reward, free, requiredFree: reward }]
      : [];
  });
}
