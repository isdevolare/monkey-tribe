import { getLocales } from "expo-localization";
import { resolveLocale, type Lang } from "./locales";

export function detectDeviceLocale(): Lang {
  try {
    return resolveLocale(getLocales()[0]?.languageTag);
  } catch {
    return "en";
  }
}
