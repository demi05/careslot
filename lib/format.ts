export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Normalizes a doctor's display name to carry a "Dr." title, regardless of
 * which onboarding path set it (admin direct-create vs. self-signup, where
 * nothing stops someone typing their plain name). Applied at write time
 * wherever a doctor's full_name is set, not at every render site, so it
 * stays consistent everywhere that name shows up without having to touch
 * each screen individually.
 */
export function formatDoctorName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "Doctor";
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}
