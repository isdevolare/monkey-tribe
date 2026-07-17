import { describe, expect, it } from "vitest";
import { ROYAL_PALACE_SLOTS } from "./royalPalace";
import {
  ROYAL_PALACE_LEVEL_ASSETS,
  ROYAL_PALACE_RESIDENT_SPOTS,
  royalPalaceAsset
} from "./royalPalaceVisuals";

describe("Royal Palace visuals", () => {
  it("maps every palace level to its dedicated sequential asset", () => {
    expect(ROYAL_PALACE_LEVEL_ASSETS).toHaveLength(7);
    for (let level = 0; level <= 6; level += 1) {
      expect(royalPalaceAsset(level)).toBe(`royalPalaceLevel${level}`);
    }
    expect(royalPalaceAsset(-3)).toBe("royalPalaceLevel0");
    expect(royalPalaceAsset(20)).toBe("royalPalaceLevel6");
  });

  it("defines one distinct resident area for every fixed palace slot", () => {
    const positions = ROYAL_PALACE_SLOTS.map((slot) => {
      const spot = ROYAL_PALACE_RESIDENT_SPOTS[slot.slotId];
      expect(spot).toBeDefined();
      expect(spot.left).toBeGreaterThanOrEqual(0);
      expect(spot.top).toBeGreaterThanOrEqual(0);
      expect(spot.left + spot.size).toBeLessThanOrEqual(100);
      expect(spot.top + spot.size).toBeLessThanOrEqual(100);
      return `${spot.left}:${spot.top}`;
    });
    expect(new Set(positions).size).toBe(ROYAL_PALACE_SLOTS.length);
    expect(ROYAL_PALACE_RESIDENT_SPOTS.goldenThrone.motion).toBe("king");
  });
});
