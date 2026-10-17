/**
 * Pure functions for deterministic server-reset calculations and countdown timers.
 */

export function getMostRecentReset(
  cadence: "daily" | "weekly",
  resetHourUTC: number,
  resetMinuteUTC: number,
  weeklyResetDay: number = 2,
  now: Date = new Date(),
): Date {
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();
  const currentDate = now.getUTCDate();

  const todayReset = new Date(
    Date.UTC(
      currentYear,
      currentMonth,
      currentDate,
      resetHourUTC,
      resetMinuteUTC,
      0,
      0,
    ),
  );

  if (cadence === "daily") {
    if (now.getTime() >= todayReset.getTime()) {
      return todayReset;
    }
    return new Date(todayReset.getTime() - 24 * 60 * 60 * 1000);
  }

  // Weekly cadence
  const currentDay = now.getUTCDay();
  let daysSinceTarget = (currentDay - weeklyResetDay + 7) % 7;

  if (daysSinceTarget === 0) {
    if (now.getTime() >= todayReset.getTime()) {
      return todayReset;
    }
    // Reset has not occurred yet today, so the most recent was 7 days ago
    return new Date(todayReset.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Reset was daysSinceTarget days ago
  return new Date(todayReset.getTime() - daysSinceTarget * 24 * 60 * 60 * 1000);
}

export function getNextReset(
  cadence: "daily" | "weekly",
  resetHourUTC: number,
  resetMinuteUTC: number,
  weeklyResetDay: number = 2,
  now: Date = new Date(),
): Date {
  const recent = getMostRecentReset(
    cadence,
    resetHourUTC,
    resetMinuteUTC,
    weeklyResetDay,
    now,
  );
  const durationMs =
    cadence === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return new Date(recent.getTime() + durationMs);
}

export function isTaskCompleted(
  lastCompletedAt: string | undefined | null,
  cadence: "daily" | "weekly",
  resetHourUTC: number,
  resetMinuteUTC: number,
  weeklyResetDay: number = 2,
  now: Date = new Date(),
): boolean {
  if (!lastCompletedAt) {
    return false;
  }

  const completedTime = new Date(lastCompletedAt).getTime();
  if (isNaN(completedTime)) {
    return false;
  }

  const mostRecentReset = getMostRecentReset(
    cadence,
    resetHourUTC,
    resetMinuteUTC,
    weeklyResetDay,
    now,
  );
  return completedTime >= mostRecentReset.getTime();
}

export function formatCountdown(
  nextResetDate: Date,
  now: Date = new Date(),
): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  isPast: boolean;
} {
  const diffMs = nextResetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "Resetting...",
      isPast: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = "";
  if (days > 0) {
    formatted = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    formatted = `${minutes}m ${seconds}s`;
  }

  return { hours, minutes, seconds, formatted, isPast: false };
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
