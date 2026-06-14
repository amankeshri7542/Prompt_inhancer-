'use client';

import { motion } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import type { HistoryItem } from '@/lib/types';
import { LLM_LABELS, TASK_LABELS } from '@/lib/prompt-templates';

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function HistoryPanel({ items, onSelect, onClear }: HistoryPanelProps) {
  return (
    <div className="w-full bg-[var(--surface)] border border-[var(--border)] backdrop-blur-xl rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[var(--muted)]" />
          <h3 className="text-xs uppercase tracking-[0.16em] text-[var(--muted)] font-semibold">
            Recent ({items.length}/5)
          </h3>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-[var(--faint)] hover:text-red-400 transition p-1 rounded"
            title="Clear history"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-[var(--faint)] text-center py-6">
          No history yet — your last 5 prompts will appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button
                onClick={() => onSelect(item)}
                className="w-full text-left p-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition group"
              >
                <p className="text-xs text-[var(--muted)] line-clamp-2 group-hover:text-[var(--text)] transition mb-1.5">
                  {item.original}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
                    {LLM_LABELS[item.targetLLM].split(' ')[0]}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)]">
                    {TASK_LABELS[item.taskType]}
                  </span>
                  <span className="text-[9px] text-[var(--faint)] ml-auto font-mono">{timeAgo(item.createdAt)} ago</span>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
