// Nigeria is UTC+1 year-round (WAT, no DST), so a fixed offset from the
// real epoch time gives Lagos wall-clock time regardless of where this
// code runs (Vercel serverless functions run in UTC; a browser could be
// set to any timezone) or what the visitor's device clock is set to.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export function nowInLagos(): { date: string; time: string } {
  const lagos = new Date(Date.now() + LAGOS_OFFSET_MS);
  return {
    date: lagos.toISOString().slice(0, 10),
    time: lagos.toISOString().slice(11, 19),
  };
}

/** True if the given appointment date/time has already passed, in Lagos time. */
export function isPastSlot(date: string, time: string): boolean {
  const { date: today, time: now } = nowInLagos();
  if (date < today) return true;
  if (date > today) return false;
  return time <= now;
}
