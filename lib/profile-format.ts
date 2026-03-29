/** Format total distance for profile stats (never append a stray “k” to the number). */
export function formatProfileKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '0';
  const rounded = km >= 100 ? Math.round(km) : Math.round(km * 10) / 10;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 1e-6;
  if (isWhole) {
    return Math.round(rounded).toLocaleString();
  }
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
