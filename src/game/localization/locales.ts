export const CATALOG_LOCALES = ["en", "tr", "es", "pt-BR", "de", "fr", "ja", "ko"] as const;

export type Lang = (typeof CATALOG_LOCALES)[number];
export type LocaleReleaseStatus = "enabled" | "release-disabled";

type LocaleDefinition = {
  id: Lang;
  label: string;
  releaseStatus: LocaleReleaseStatus;
};

/**
 * Single source of truth for locale availability. Disabled catalogs remain
 * complete and testable so a later release can re-enable them by changing
 * only this policy.
 */
export const LOCALE_DEFINITIONS = [
  { id: "en", label: "English", releaseStatus: "enabled" },
  { id: "tr", label: "Türkçe", releaseStatus: "enabled" },
  { id: "es", label: "Español", releaseStatus: "enabled" },
  { id: "pt-BR", label: "Português (Brasil)", releaseStatus: "enabled" },
  { id: "de", label: "Deutsch", releaseStatus: "release-disabled" },
  { id: "fr", label: "Français", releaseStatus: "release-disabled" },
  { id: "ja", label: "日本語", releaseStatus: "release-disabled" },
  { id: "ko", label: "한국어", releaseStatus: "release-disabled" }
] as const satisfies readonly LocaleDefinition[];

export const RELEASE_LOCALES: readonly Lang[] = LOCALE_DEFINITIONS
  .filter((locale) => locale.releaseStatus === "enabled")
  .map((locale) => locale.id);

export const RELEASE_DISABLED_LOCALES: readonly Lang[] = LOCALE_DEFINITIONS
  .filter((locale) => locale.releaseStatus === "release-disabled")
  .map((locale) => locale.id);

/** Options are derived here, never filtered ad hoc by Settings UI. */
export const LANGUAGE_OPTIONS: ReadonlyArray<{ id: Lang; label: string }> = LOCALE_DEFINITIONS
  .filter((locale) => locale.releaseStatus === "enabled")
  .map(({ id, label }) => ({ id, label }));

const CATALOG_LOCALE_SET = new Set<string>(CATALOG_LOCALES);
const RELEASE_LOCALE_SET = new Set<string>(RELEASE_LOCALES);

function normalizedLocaleCandidate(locale: unknown, allowedLocales: ReadonlySet<string>): Lang {
  if (typeof locale !== "string" || locale.trim().length === 0) return "en";
  const normalized = locale.trim().replace(/_/g, "-");
  if (allowedLocales.has(normalized)) return normalized as Lang;

  const lower = normalized.toLowerCase();
  if (
    (lower === "pt-br" || lower.startsWith("pt-br-") || lower === "pt" || lower.startsWith("pt-")) &&
    allowedLocales.has("pt-BR")
  ) {
    return "pt-BR";
  }

  const language = lower.split("-")[0];
  if (language && allowedLocales.has(language)) return language as Lang;
  return "en";
}

/** Resolves device and saved BCP-47 tags to the enabled v1.0 locale set. */
export function resolveLocale(locale: unknown): Lang {
  return normalizedLocaleCandidate(locale, RELEASE_LOCALE_SET);
}

/** Allows retained, release-disabled catalogs to stay testable and ready to re-enable. */
export function resolveCatalogLocale(locale: unknown): Lang {
  return normalizedLocaleCandidate(locale, CATALOG_LOCALE_SET);
}

export function usesSystemCjkFont(locale: Lang) {
  return locale === "ja" || locale === "ko";
}
