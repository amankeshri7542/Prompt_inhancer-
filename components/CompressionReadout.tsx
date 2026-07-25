'use client';

import { motion } from 'framer-motion';
import type { RunCost } from '@/lib/types';

/**
 * The compression readout — how much session went in versus how much brief came
 * out. It is the most satisfying number the product can show, so it gets the
 * largest type on the page and nothing else competes with it.
 */
export default function CompressionReadout({
  cost,
  briefWords,
}: {
  cost: RunCost | null;
  briefWords: number;
}) {
  if (!cost || cost.promptTokens === 0) return null;

  const ratio = cost.completionTokens > 0 ? cost.promptTokens / cost.completionTokens : 0;
  // Output share of the bar, floored so a huge ratio still leaves a visible sliver.
  const outShare = Math.max(1.5, Math.min(50, (1 / Math.max(ratio, 1)) * 100));

  return (
    <div className="slab-quiet overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-4 py-4 sm:px-5">
        <div>
          <div className="label mb-2">Session compressed</div>
          <div className="readout flex items-baseline gap-2 text-[var(--chalk)]">
            <span className="text-[clamp(1.5rem,5vw,2.25rem)] font-semibold leading-none">
              {cost.promptTokens.toLocaleString()}
            </span>
            <span className="text-[var(--dim)]">→</span>
            <span className="text-[clamp(1.5rem,5vw,2.25rem)] font-semibold leading-none text-[var(--signal)]">
              {cost.completionTokens.toLocaleString()}
            </span>
            <span className="text-xs text-[var(--dim)]">tokens</span>
          </div>
        </div>

        {ratio >= 2 && (
          <div className="text-right">
            <div className="label mb-2">Density</div>
            <div className="readout text-[clamp(1.5rem,5vw,2.25rem)] font-semibold leading-none text-[var(--chalk)]">
              {ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}
              <span className="text-[var(--dim)]">×</span>
            </div>
          </div>
        )}
      </div>

      {/* Proportional bar: ground is the session, signal is what survived. */}
      <div className="flex h-1.5 w-full overflow-hidden bg-[var(--slab-2)]">
        <motion.div
          className="h-full bg-[var(--signal)]"
          initial={{ width: 0 }}
          animate={{ width: `${outShare}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.15 }}
        />
      </div>

      <div className="readout flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[10px] text-[var(--dim)] sm:px-5">
        <span>{briefWords.toLocaleString()} words in the brief</span>
        <span>
          ${cost.costUsd < 0.01 ? cost.costUsd.toFixed(4) : cost.costUsd.toFixed(3)} ·{' '}
          {cost.provider}
        </span>
      </div>
    </div>
  );
}
