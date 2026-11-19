export function getDailyTarget(hour: number) {
  hour = hour % 24;

  const now = new Date();
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour),
  );

  if (target <= now) target.setUTCDate(target.getUTCDate() + 1);

  return target;
}

export function getWeeklyTarget(dayOfWeek: number, hour: number) {
  const now = new Date();
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour),
  );

  const diff = (dayOfWeek - now.getUTCDay() + 7) % 7;
  target.setUTCDate(target.getUTCDate() + diff);

  if (target <= now) {
    target.setUTCDate(target.getUTCDate() + 7);
  }

  return target;
}
