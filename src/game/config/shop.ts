import { storageCap } from "./buildings";
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

type ResourceShopDefinition = Omit<ShopItem, "reward"> & {
  storageRatios: Partial<Record<keyof Resources, number>>;
};

/**
 * Rewards scale from Clan Hall storage rather than using a flat exchange.
 * A purchase remains useful at every level while never exceeding 25% of a
 * single depot or becoming mandatory for an upgrade.
 */
export const RESOURCE_SHOP_DEFINITIONS: readonly ResourceShopDefinition[] = [
  {
    id: "bananaPack",
    gemCost: 12,
    storageRatios: { bananas: 0.25 },
    icon: "resourceBanana"
  },
  {
    id: "stonePack",
    gemCost: 16,
    storageRatios: { stones: 0.18 },
    icon: "resourceStone"
  },
  {
    id: "woodPack",
    gemCost: 14,
    storageRatios: { wood: 0.22 },
    icon: "resourceWood"
  },
  {
    id: "bountyChest",
    gemCost: 30,
    storageRatios: { bananas: 0.15, stones: 0.1, wood: 0.13 },
    icon: "resourceJungleGem"
  }
];

export function resourceShopItems(clanHallLevel: number): readonly ShopItem[] {
  const capacity = storageCap(clanHallLevel);
  return RESOURCE_SHOP_DEFINITIONS.map((definition) => ({
    id: definition.id,
    gemCost: definition.gemCost,
    icon: definition.icon,
    reward: Object.fromEntries(
      Object.entries(definition.storageRatios).map(([resource, ratio]) => [
        resource,
        roundResource(capacity * ratio)
      ])
    ) as Partial<Resources>
  }));
}

export function getResourceShopItem(id: string, clanHallLevel: number) {
  return resourceShopItems(clanHallLevel).find((item) => item.id === id);
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

function roundResource(value: number) {
  return Math.max(5, Math.round(value / 5) * 5);
}
