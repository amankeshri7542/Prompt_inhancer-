'use client';

import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Chip } from './ui';
import { SessionSpend, formatUsd } from './CostMeter';

/** Normalised row so one panel serves both surfaces. */
export interface HistoryEntry {
  id: string;
  createdAt: number;
  preview: string;
  chips: string[];
  costUsd?: number;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function HistoryPanel({
  entries,
  emptyLine,
  sessionSpend,
  onSelect,
  onClear,
}: {
  entries: HistoryEntry[];
  emptyLine: string;
  sessionSpend: number;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="slab p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="label">Recent · {entries.length}/5</span>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            aria-label="Clear history"
            title="Clear history"
            className="rounded p-1 text-[var(--dim)] transition hover:text-[var(--danger)]"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-xs leading-relaxed text-[var(--dim)]">{emptyLine}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <motion.li key={entry.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
              <button
                onClick={() => onSelect(entry.id)}
                className="group w-full rounded-lg border border-[var(--line)] bg-[var(--ink-2)] p-3 text-left transition hover:border-[var(--line-strong)]"
              >
                <p className="mb-2 line-clamp-2 text-xs text-[var(--ash)] transition group-hover:text-[var(--chalk)]">
                  {entry.preview}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {entry.chips.map((c, i) => (
                    <Chip key={c} accent={i === 0}>
                      {c}
                    </Chip>
                  ))}
                  <span className="readout ml-auto text-[9px] text-[var(--dim)]">
                    {entry.costUsd ? `${formatUsd(entry.costUsd)} · ` : ''}
                    {timeAgo(entry.createdAt)}
                  </span>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      {sessionSpend > 0 && (
        <div className="mt-4 border-t border-[var(--line)] pt-3">
          <SessionSpend total={sessionSpend} />
        </div>
      )}
    </div>
  );
}
