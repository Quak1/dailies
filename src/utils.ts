export function getDailyTarget(hour: number, now = new Date()) {
  hour = hour % 24;

  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour),
  );

  if (target <= now) target.setUTCDate(target.getUTCDate() + 1);

  return target;
}

export function getLastDailyReset(hour: number, now = new Date()) {
  hour = hour % 24;

  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour),
  );

  if (target > now) target.setUTCDate(target.getUTCDate() - 1);

  return target;
}

export function getWeeklyTarget(dayOfWeek: number, hour: number, now = new Date()) {
  hour = hour % 24;

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

export function getLastWeeklyReset(
  dayOfWeek: number,
  hour: number,
  now = new Date(),
) {
  hour = hour % 24;

  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour),
  );

  const diff = (now.getUTCDay() - dayOfWeek + 7) % 7;
  target.setUTCDate(target.getUTCDate() - diff);

  if (target > now) {
    target.setUTCDate(target.getUTCDate() - 7);
  }

  return target;
}
