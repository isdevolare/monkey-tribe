import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";
import {
  SUPPORT_EMAIL,
  appBuildNumber,
  appVersion,
  safeDeviceModel,
  safePlatformLabel
} from "./appInfo";

// Where player reports land. Swap `deliverReport` for an HTTP endpoint
// once a backend exists — everything else stays the same.
const REPORT_LOG_KEY = "monkey-tribe:support-reports";

export type SupportIssueId =
  | "broken"
  | "noSound"
  | "freeze"
  | "lostProgress"
  | "purchase"
  | "other";

export const SUPPORT_ISSUES: SupportIssueId[] = [
  "broken",
  "noSound",
  "freeze",
  "lostProgress",
  "purchase",
  "other"
];

// Intentionally excludes player state, balances, purchases, and identifiers.
function buildDiagnostics(issueCategory: string) {
  return {
    appVersion: appVersion(),
    buildNumber: appBuildNumber(),
    platform: safePlatformLabel(),
    deviceModel: safeDeviceModel(),
    issueCategory
  };
}

async function appendLocalLog(entry: object) {
  try {
    const raw = await AsyncStorage.getItem(REPORT_LOG_KEY);
    const log = raw ? (JSON.parse(raw) as object[]) : [];
    log.push(entry);
    // Keep the local trail short.
    await AsyncStorage.setItem(REPORT_LOG_KEY, JSON.stringify(log.slice(-20)));
  } catch {
    // Logging must never break the report flow.
  }
}

async function deliverReport(subject: string, body: string) {
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  await Linking.openURL(url);
}

/**
 * Sends a support report: opens the player's mail app pre-filled with the
 * issue + diagnostics, and keeps a local copy. Returns false if no mail
 * client could be opened (caller shows a fallback message).
 */
export async function submitSupportReport(issueLabel: string, note: string) {
  const diagnostics = buildDiagnostics(issueLabel);
  await appendLocalLog({ issueLabel, note, ...diagnostics });

  const subject = `Monkey Tribe destek: ${issueLabel}`;
  const body = [
    `Sorun: ${issueLabel}`,
    note ? `Not: ${note}` : null,
    "",
    "--- Teşhis (otomatik) ---",
    ...Object.entries(diagnostics).map(([key, value]) => `${key}: ${value}`)
  ]
    .filter((line) => line != null)
    .join("\n");

  try {
    await deliverReport(subject, body);
    return true;
  } catch {
    return false;
  }
}
