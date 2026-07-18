import { describe, expect, it } from "vitest";
import { formatLocalizedNumber, t, translationKeys, translationsFor } from "../i18n";
import {
  CATALOG_LOCALES,
  LANGUAGE_OPTIONS,
  LOCALE_DEFINITIONS,
  RELEASE_DISABLED_LOCALES,
  RELEASE_LOCALES,
  resolveCatalogLocale,
  resolveLocale
} from "./locales";

const CRITICAL_SCREEN_PREFIXES = [
  "settings.",
  "workerLodge.",
  "workerDispatch.",
  "raidmap.",
  "raid.",
  "shopHub.",
  "shop.",
  "gemStore.",
  "daily.",
  "quests.",
  "quest."
] as const;

function placeholders(value: string) {
  return [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort();
}

describe("localization release policy", () => {
  it("exposes only the four enabled v1.0 locales", () => {
    expect(RELEASE_LOCALES).toEqual(["en", "tr", "es", "pt-BR"]);
    expect(LANGUAGE_OPTIONS.map(({ id }) => id)).toEqual(RELEASE_LOCALES);
  });

  it("keeps future catalogs explicitly release-disabled", () => {
    expect(RELEASE_DISABLED_LOCALES).toEqual(["de", "fr", "ja", "ko"]);
    expect(
      LOCALE_DEFINITIONS
        .filter(({ releaseStatus }) => releaseStatus === "release-disabled")
        .map(({ id }) => id)
    ).toEqual(RELEASE_DISABLED_LOCALES);
  });

  it("does not auto-select a release-disabled device or saved locale", () => {
    for (const locale of ["de-DE", "fr-FR", "ja-JP", "ko-KR"]) {
      expect(resolveLocale(locale)).toBe("en");
    }
  });

  it("normalizes enabled choices without changing them", () => {
    for (const locale of RELEASE_LOCALES) expect(resolveLocale(locale)).toBe(locale);
    expect(resolveLocale("pt_BR")).toBe("pt-BR");
    expect(resolveLocale("pt-PT")).toBe("pt-BR");
  });

  it("falls back to English for unsupported and malformed locales", () => {
    expect(resolveLocale("it-IT")).toBe("en");
    expect(resolveLocale("zh-Hans-CN")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
    expect(t("menu.start", "it-IT")).toBe("Start Game");
  });
});

describe("retained localization catalogs", () => {
  it("materializes the same complete key set for every retained catalog", () => {
    const englishKeys = Object.keys(translationsFor("en")).sort();
    expect(englishKeys).toEqual(translationKeys().sort());
    for (const locale of CATALOG_LOCALES) {
      expect(Object.keys(translationsFor(locale)).sort()).toEqual(englishKeys);
    }
  });

  it("has no empty user-facing value in any retained catalog", () => {
    for (const locale of CATALOG_LOCALES) {
      for (const [key, value] of Object.entries(translationsFor(locale))) {
        expect(value.trim(), `${locale}:${key}`).not.toBe("");
      }
    }
  });

  it("keeps disabled catalogs directly accessible for a later release", () => {
    expect(resolveCatalogLocale("ja-JP")).toBe("ja");
    expect(t("settings.privacy", "de")).toBe("Datenschutzrichtlinie");
    expect(t("settings.privacy", "fr")).toBe("Politique de confidentialité");
    expect(t("settings.privacy", "ja")).toBe("プライバシーポリシー");
    expect(t("settings.privacy", "ko")).toBe("개인정보 처리방침");
  });

  it("preserves interpolation parameters across every retained catalog", () => {
    const english = translationsFor("en");
    for (const locale of CATALOG_LOCALES) {
      const localized = translationsFor(locale);
      for (const key of translationKeys()) {
        expect(placeholders(localized[key] ?? ""), `${locale}:${key}`).toEqual(
          placeholders(english[key] ?? "")
        );
      }
    }
    expect(t("settings.linkErrorBody", "ja", { page: "サポート" })).toContain("サポート");
  });
});

describe("active locale critical screens", () => {
  const criticalKeys = translationKeys().filter((key) =>
    CRITICAL_SCREEN_PREFIXES.some((prefix) => key.startsWith(prefix))
  );

  it("covers Settings, workers, raids, stores, quests, and daily rewards", () => {
    expect(criticalKeys.length).toBeGreaterThan(250);
    for (const locale of RELEASE_LOCALES) {
      const localized = translationsFor(locale);
      for (const key of criticalKeys) {
        expect(localized[key]?.trim(), `${locale}:${key}`).toBeTruthy();
      }
    }
  });

  it("preserves critical-screen interpolation tokens in all four active locales", () => {
    const english = translationsFor("en");
    for (const locale of RELEASE_LOCALES) {
      const localized = translationsFor(locale);
      for (const key of criticalKeys) {
        expect(placeholders(localized[key] ?? ""), `${locale}:${key}`).toEqual(
          placeholders(english[key] ?? "")
        );
      }
    }
  });

  it("formats display numbers without changing their numeric value", () => {
    expect(formatLocalizedNumber(1234, "en")).toBe("1,234");
    expect(formatLocalizedNumber(1234, "pt-BR")).toBe("1.234");
    expect(t("common.levelBadge", "es", { n: 12 })).toContain("12");
  });
});
