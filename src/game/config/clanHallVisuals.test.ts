import { describe, expect, it } from "vitest";
import { clanHallAsset, clanHallVisualStage } from "./clanHallVisuals";

describe("Clan Hall visual progression", () => {
  it.each([
    [1, 1, "clanHallStage1"],
    [4, 1, "clanHallStage1"],
    [5, 2, "clanHallStage2"],
    [8, 2, "clanHallStage2"],
    [9, 3, "clanHallStage3"],
    [10, 3, "clanHallStage3"],
    [25, 3, "clanHallStage3"]
  ] as const)("maps level %i to Stage %i", (level, stage, asset) => {
    expect(clanHallVisualStage(level)).toBe(stage);
    expect(clanHallAsset(level)).toBe(asset);
  });
});
