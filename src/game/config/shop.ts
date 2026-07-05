import type { Resources } from "../types/game";

export type ShopItem = {
  id: string;
  gemCost: number;
  reward: Partial<Resources>;
  /** Icon shown on the card; the mixed chest uses the gem icon. */
  icon: "resourceBanana" | "resourceStone" | "resourceWood" | "resourceJungleGem";
};

// Gem sink: trade the gems earned from raids/quests for resource packs.
export const SHOP_ITEMS: ShopItem[] = [
  { id: "bananaPack", gemCost: 3, reward: { bananas: 250 }, icon: "resourceBanana" },
  { id: "stonePack", gemCost: 3, reward: { stones: 180 }, icon: "resourceStone" },
  { id: "woodPack", gemCost: 3, reward: { wood: 200 }, icon: "resourceWood" },
  {
    id: "bountyChest",
    gemCost: 8,
    reward: { bananas: 400, stones: 300, wood: 320 },
    icon: "resourceJungleGem"
  }
];
