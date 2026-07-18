import { describe, expect, it } from "vitest";
import { formatHudAmount, formatResourceHudValue } from "./resourceHud";

describe("resource HUD formatting", () => {
  it("keeps small values fully readable", () => {
    expect(formatResourceHudValue(125, 800)).toBe("125 / 800");
  });

  it("uses a stable one-decimal compact format for four-digit values", () => {
    expect(formatResourceHudValue(1000, 4000)).toBe("1.0K / 4.0K");
    expect(formatResourceHudValue(1560, 4000)).toBe("1.6K / 4.0K");
  });

  it("never emits an ellipsis", () => {
    expect(formatHudAmount(99999)).toBe("100.0K");
    expect(formatResourceHudValue(99999, 120000)).not.toContain("...");
  });
});
