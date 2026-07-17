import { describe, expect, it } from "vitest";
import { storageCap } from "../config/buildings";
import { addResourcesCapped } from "./resources";

describe("addResourcesCapped", () => {
  it("caps each resource at 3200 for a level 8 Clan Hall", () => {
    const cap = storageCap(8);
    const result = addResourcesCapped(
      { bananas: 3_100, stones: 3_190, wood: 3_200 },
      { bananas: 300, stones: 180, wood: 220 },
      cap
    );

    expect(cap).toBe(3_200);
    expect(result.resources).toEqual({ bananas: 3_200, stones: 3_200, wood: 3_200 });
    expect(result.received).toEqual({ bananas: 100, stones: 10, wood: 0 });
    expect(result.discarded).toEqual({ bananas: 200, stones: 170, wood: 220 });
  });

  it("never grows a stockpile that is already over capacity", () => {
    const result = addResourcesCapped(
      { bananas: 4_000, stones: 3_500, wood: 3_201 },
      { bananas: 300, stones: 180, wood: 220 },
      storageCap(8)
    );

    expect(result.resources).toEqual({ bananas: 4_000, stones: 3_500, wood: 3_201 });
    expect(result.received).toEqual({ bananas: 0, stones: 0, wood: 0 });
    expect(result.discarded).toEqual({ bananas: 300, stones: 180, wood: 220 });
  });

  it("allows repeated gains only until the exact capacity is reached", () => {
    const cap = storageCap(8);
    let resources = { bananas: 2_900, stones: 2_900, wood: 2_900 };

    resources = addResourcesCapped(resources, { bananas: 300, stones: 180, wood: 220 }, cap).resources;
    resources = addResourcesCapped(resources, { bananas: 300, stones: 180, wood: 220 }, cap).resources;

    expect(resources).toEqual({ bananas: 3_200, stones: 3_200, wood: 3_200 });
  });
});
