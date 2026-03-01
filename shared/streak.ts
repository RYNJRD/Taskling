import type { Family, User } from "./schema";

export type DateKey = string;

export function getFamilyTimeZone(family?: Family | null): string {
  return (
    family?.timeZone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC"
  );
}

export function getLocalDateKey(date: Date, timeZone: string): DateKey {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getPreviousDateKey(dateKey: DateKey): DateKey {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function getEffectiveStreakForDate(
  user: Pick<User, "streak" | "streakLastCompletedDate">,
  date: Date,
  timeZone: string
): number {
  if (!user.streak || !user.streakLastCompletedDate) return 0;
  const todayKey = getLocalDateKey(date, timeZone);
  const yesterdayKey = getPreviousDateKey(todayKey);
  if (user.streakLastCompletedDate === yesterdayKey) {
    return user.streak;
  }
  return 0;
}

export function calculateStreakMultiplier(streakDays: number): {
  multiplier: number;
  bonusPercent: number;
} {
  if (streakDays <= 0) {
    return { multiplier: 1, bonusPercent: 0 };
  }
  const multiplier = Math.min(1 + 0.2 * streakDays, 2);
  const bonusPercent = Math.round((multiplier - 1) * 100);
  return { multiplier, bonusPercent };
}

