export type DailyReward = { kind: "gems"; amount: number };

// The calendar uses the existing premium gem balance only. Festival fragments
// are intentionally not part of daily rewards during cosmetic normalization.
export const DAILY_REWARDS: DailyReward[] = [
  { kind: "gems", amount: 5 },
  { kind: "gems", amount: 8 },
  { kind: "gems", amount: 12 },
  { kind: "gems", amount: 15 },
  { kind: "gems", amount: 20 },
  { kind: "gems", amount: 30 },
  { kind: "gems", amount: 5 }
];

export const DAILY_WEEKLY_GEMS = DAILY_REWARDS.reduce(
  (total, reward) => total + reward.amount,
  0
);

export function resolveDailyReward(reward: DailyReward) {
  return { gems: reward.amount };
}

export function nextDailyRewardDay(
  streak: number,
  lastClaim: string | null,
  today: string
) {
  if (lastClaim === today) return null;
  const safeStreak = Number.isFinite(streak) ? Math.max(0, Math.floor(streak)) : 0;
  const consecutive = lastClaim != null && dayDiff(lastClaim, today) === 1;
  return consecutive ? (safeStreak % DAILY_REWARDS.length) + 1 : 1;
}

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
