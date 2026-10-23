import { describe, it, expect } from "vitest";
import {
  getMostRecentDailyReset,
  getNextDailyReset,
  getMostRecentWeeklyReset,
  isTaskCompleted,
  formatTimeRemaining,
} from "./reset-calculator";

describe("reset-calculator", () => {
  it("correctly calculates daily most recent reset when now is after reset time", () => {
    // Reset at 15:00 UTC, now is 18:00 UTC on 2026-10-15
    const now = new Date("2026-10-15T18:00:00Z");
    const reset = getMostRecentDailyReset(now, 15, 0);
    expect(reset.toISOString()).toBe("2026-10-15T15:00:00.000Z");
  });

  it("correctly calculates daily most recent reset when now is before reset time", () => {
    // Reset at 15:00 UTC, now is 10:00 UTC on 2026-10-15
    const now = new Date("2026-10-15T10:00:00Z");
    const reset = getMostRecentDailyReset(now, 15, 0);
    expect(reset.toISOString()).toBe("2026-10-14T15:00:00.000Z");
  });

  it("correctly calculates next daily reset", () => {
    const now = new Date("2026-10-15T18:00:00Z");
    const next = getNextDailyReset(now, 15, 0);
    expect(next.toISOString()).toBe("2026-10-16T15:00:00.000Z");
  });

  it("determines task completion status across reset boundaries", () => {
    const now = new Date("2026-10-15T18:00:00Z"); // Reset was 15:00 UTC today
    const doneBeforeReset = "2026-10-15T14:30:00Z";
    const doneAfterReset = "2026-10-15T15:30:00Z";

    expect(isTaskCompleted(doneBeforeReset, "daily", 15, 0, 2, now)).toBe(
      false,
    );
    expect(isTaskCompleted(doneAfterReset, "daily", 15, 0, 2, now)).toBe(true);
  });

  it("calculates weekly reset accurately", () => {
    // Tuesday is day 2. Let's test from Thursday 2026-10-15 (day 4) at 18:00 UTC.
    // Reset is Tuesday 08:00 UTC (2026-10-13T08:00:00Z)
    const now = new Date("2026-10-15T18:00:00Z");
    const weeklyReset = getMostRecentWeeklyReset(now, 8, 0, 2);
    expect(weeklyReset.toISOString()).toBe("2026-10-13T08:00:00.000Z");
  });

  it("formats countdown string properly", () => {
    const now = new Date("2026-10-15T12:00:00Z");
    const targetNear = new Date("2026-10-15T14:30:45Z");
    expect(formatTimeRemaining(targetNear, now)).toBe("02:30:45");

    const targetFar = new Date("2026-10-17T15:00:00Z");
    expect(formatTimeRemaining(targetFar, now)).toBe("2d 3h");
  });
});
