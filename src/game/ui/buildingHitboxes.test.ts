import { describe, expect, it } from "vitest";
import { BUILDING_GEOMETRY, createBuildingHitTargets, selectBuildingAtPoint } from "./buildingHitboxes";
import type { VillageBuildingType } from "../types/game";

const TYPES = Object.keys(BUILDING_GEOMETRY) as VillageBuildingType[];

describe("Royal Palace hitbox", () => {
  it("keeps the palace at the top-center prestige point", () => {
    const palace = BUILDING_GEOMETRY.royalPalace;
    expect(palace.point.x).toBe(50);
    for (const type of TYPES.filter((entry) => entry !== "royalPalace")) {
      expect(palace.point.y, `palace should sit above ${type}`).toBeLessThan(BUILDING_GEOMETRY[type].point.y);
    }
  });

  it.each([260, 430])("stays selectable without overlapping another building at %ipx", (width) => {
    const height = width * (1450 / 941);
    const targets = createBuildingHitTargets(TYPES, width, height);
    const palace = targets.find((target) => target.type === "royalPalace");
    if (!palace) throw new Error("Royal Palace hitbox missing");

    expect(selectBuildingAtPoint(targets, palace.centerX, palace.centerY)).toBe("royalPalace");
    for (const target of targets.filter((entry) => entry.type !== "royalPalace")) {
      const overlaps =
        Math.abs(target.centerX - palace.centerX) < (target.width + palace.width) / 2 &&
        Math.abs(target.centerY - palace.centerY) < (target.height + palace.height) / 2;
      expect(overlaps, `palace overlaps ${target.type}`).toBe(false);
      expect(selectBuildingAtPoint(targets, target.centerX, target.centerY)).toBe(target.type);
    }
  });
});
