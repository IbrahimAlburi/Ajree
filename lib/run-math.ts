/** Returns pace string like `5:12/km` from km and `mm:ss` duration, or empty if invalid. */
export function computePaceFromDuration(distanceKm: number, durationMmSs: string): string {
  const m = durationMmSs.trim().match(/^(\d+):(\d{2})$/);
  if (!m || distanceKm <= 0) return '';
  const totalMin = parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
  const minPerKm = totalMin / distanceKm;
  const pm = Math.floor(minPerKm);
  const ps = Math.min(59, Math.round((minPerKm - pm) * 60));
  return `${pm}:${ps.toString().padStart(2, '0')}/km`;
}
