/**
 * The 24 h webhook delivery summary, shared by Webhooks (v2) and Settings so neither page imports the
 * other. The backend reports success_rate 0.0 for zero deliveries, and may omit it.
 */
export type DeliverySummary = {
  total?: number | null;
  success_rate?: number | null;
};

/** "96.4%", or "—" when nothing was delivered or the rate is missing / not a number
 * (it rendered "undefined%" / "NaN%" before). */
export function deliveredRate(summary?: DeliverySummary | null): string {
  if (!summary || !summary.total) return '—';
  const rate = summary.success_rate;
  if (typeof rate !== 'number' || !Number.isFinite(rate)) return '—';
  return `${(Math.round(rate * 10) / 10).toFixed(1)}%`;
}
