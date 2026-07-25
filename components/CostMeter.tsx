'use client';

import type { RunCost } from '@/lib/types';

export function formatUsd(usd: number): string {
  if (usd === 0) return '$0';
  if (usd < 0.001) return `$${usd.toFixed(5)}`;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/**
 * Per-run usage, straight from OpenRouter's `usage` block — actual charges, not
 * an estimate. Worth surfacing because one handoff can cost 50× an enhance.
 */
export default function CostMeter({ cost }: { cost: RunCost | null }) {
  if (!cost) return null;

  return (
    <span className="readout flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[var(--dim)]">
      <span className="text-[var(--ash)]">{formatUsd(cost.costUsd)}</span>
      <span aria-hidden>·</span>
      <span>
        {formatTokens(cost.promptTokens)} in / {formatTokens(cost.completionTokens)} out
      </span>
      <span aria-hidden>·</span>
      <span>{cost.provider}</span>
    </span>
  );
}

/** Running total for the session, shown in the sidebar. */
export function SessionSpend({ total }: { total: number }) {
  if (total <= 0) return null;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="label">Spent this session</span>
      <span className="readout text-sm text-[var(--chalk)]">{formatUsd(total)}</span>
    </div>
  );
}
