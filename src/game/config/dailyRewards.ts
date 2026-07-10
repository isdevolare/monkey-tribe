import type { Resources } from "../types/game";

export type DailyReward = Partial<Resources> & { gems?: number };

// 7-day escalating streak, gem-weighted: resources are earned by raiding,
// the calendar hands out the scarce currency. Day 7 is the big one.
export const DAILY_REWARDS: DailyReward[] = [
  { bananas: 80 },
  { gems: 1 },
  { wood: 80 },
  { gems: 2 },
  { stones: 100 },
  { gems: 3 },
  { gems: 5, bananas: 150 }
];

/** Local calendar day as YYYY-MM-DD, used to gate one claim per day. */
export function todayKey(now = Date.now()) {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Difference in whole calendar days between two day keys (b - a). */
export function dayDiff(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const at = Date.UTC(ay ?? 1970, (am ?? 1) - 1, ad ?? 1);
  const bt = Date.UTC(by ?? 1970, (bm ?? 1) - 1, bd ?? 1);
  return Math.round((bt - at) / 86400000);
}
