import { describe, expect, it } from "vitest";
import { storageCap } from "./buildings";
import {
  getResourceShopItem,
  resourceShopCapacityIssues
} from "./shop";
import { addResourcesCapped } from "../state/resources";

describe("Resource Shop storage capacity", () => {
  it.each([
    ["bananaPack", "bananas", 3_000],
    ["stonePack", "stones", 3_060],
    ["woodPack", "wood", 3_080]
  ] as const)("cannot raise level 8 %s purchases to 4000", (itemId, resource, expected) => {
    const item = getResourceShopItem(itemId);
    if (!item) throw new Error(`${itemId} is missing`);

    const capacity = storageCap(8);
    let resources = { bananas: 0, stones: 0, wood: 0 };
    let purchases = 0;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (resourceShopCapacityIssues(item, resources, capacity).length > 0) break;
      resources = addResourcesCapped(resources, item.reward, capacity).resources;
      purchases += 1;
    }

    expect(purchases).toBeGreaterThan(0);
    expect(resources[resource]).toBe(expected);
    expect(resources[resource]).toBeLessThanOrEqual(3_200);
    expect(resourceShopCapacityIssues(item, resources, capacity)).toMatchObject([
      { resource }
    ]);
  });

  it("blocks every pack while an existing stockpile is over capacity", () => {
    const item = getResourceShopItem("bountyChest");
    if (!item) throw new Error("bountyChest is missing");

    const issues = resourceShopCapacityIssues(
      item,
      { bananas: 4_000, stones: 4_000, wood: 4_000 },
      storageCap(8)
    );

    expect(issues.map((issue) => issue.resource)).toEqual(["bananas", "stones", "wood"]);
  });
});
