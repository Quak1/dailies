export function getMostRecentDailyReset(
  now: Date,
  resetHourUTC: number,
  resetMinuteUTC: number = 0,
): Date {
  const reset = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      resetHourUTC,
      resetMinuteUTC,
      0,
      0,
    ),
  );

  if (now.getTime() < reset.getTime()) {
    reset.setUTCDate(reset.getUTCDate() - 1);
  }

  return reset;
}

export function getNextDailyReset(
  now: Date,
  resetHourUTC: number,
  resetMinuteUTC: number = 0,
): Date {
  const recent = getMostRecentDailyReset(now, resetHourUTC, resetMinuteUTC);
  return new Date(recent.getTime() + 24 * 60 * 60 * 1000);
}

export function getMostRecentWeeklyReset(
  now: Date,
  resetHourUTC: number,
  resetMinuteUTC: number = 0,
  weeklyResetDay: number = 2, // 0=Sun, 1=Mon, 2=Tue, etc.
): Date {
  const dailyReset = getMostRecentDailyReset(now, resetHourUTC, resetMinuteUTC);
  const currentDay = dailyReset.getUTCDay();
  const daysDiff = (currentDay - weeklyResetDay + 7) % 7;

  const weeklyReset = new Date(dailyReset);
  weeklyReset.setUTCDate(weeklyReset.getUTCDate() - daysDiff);
  return weeklyReset;
}

export function getNextWeeklyReset(
  now: Date,
  resetHourUTC: number,
  resetMinuteUTC: number = 0,
  weeklyResetDay: number = 2,
): Date {
  const recent = getMostRecentWeeklyReset(
    now,
    resetHourUTC,
    resetMinuteUTC,
    weeklyResetDay,
  );
  return new Date(recent.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export function isTaskCompleted(
  lastCompletedAt: string | undefined | null,
  cadence: "daily" | "weekly",
  resetHourUTC: number,
  resetMinuteUTC: number = 0,
  weeklyResetDay: number = 2,
  now: Date = new Date(),
): boolean {
  if (!lastCompletedAt) return false;

  const completedTime = new Date(lastCompletedAt).getTime();
  if (isNaN(completedTime)) return false;

  if (cadence === "daily") {
    const mostRecentReset = getMostRecentDailyReset(
      now,
      resetHourUTC,
      resetMinuteUTC,
    );
    return completedTime >= mostRecentReset.getTime();
  } else {
    const mostRecentReset = getMostRecentWeeklyReset(
      now,
      resetHourUTC,
      resetMinuteUTC,
      weeklyResetDay,
    );
    return completedTime >= mostRecentReset.getTime();
  }
}

export function formatTimeRemaining(
  targetDate: Date,
  now: Date = new Date(),
): string {
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return "Resetting...";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  const h = hours.toString().padStart(2, "0");
  const m = minutes.toString().padStart(2, "0");
  const s = seconds.toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}
