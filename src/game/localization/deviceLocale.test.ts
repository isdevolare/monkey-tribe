import { describe, expect, it, vi } from "vitest";

const getLocales = vi.hoisted(() => vi.fn(() => [{ languageTag: "pt-BR" }]));
vi.mock("expo-localization", () => ({ getLocales }));

import { detectDeviceLocale } from "./deviceLocale";

describe("device locale detection", () => {
  it("loads Brazilian Portuguese from the device locale", () => {
    expect(detectDeviceLocale()).toBe("pt-BR");
  });

  it("falls back to English for a release-disabled device locale", () => {
    getLocales.mockReturnValueOnce([{ languageTag: "de-DE" }]);
    expect(detectDeviceLocale()).toBe("en");
  });

  it("falls back to English when the native locale API fails", () => {
    getLocales.mockImplementationOnce(() => {
      throw new Error("native locale unavailable");
    });
    expect(detectDeviceLocale()).toBe("en");
  });
});
