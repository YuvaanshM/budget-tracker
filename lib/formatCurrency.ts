/**
 * Format currency, handling very high/low values for charts and cards.
 * Pass { exact: true } to always show the full amount (e.g. $20,000 instead of $20.0k).
 */
export function formatCurrency(
  value: number,
  opts?: { exact?: boolean }
): string {
  if (opts?.exact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }
  if (value < 0.01 && value > 0) {
    return `$${value.toFixed(4)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
