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
    <div className="w-full bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-neutral-400" />
          <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
            Recent ({items.length}/5)
          </h3>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-neutral-500 hover:text-red-400 transition p-1 rounded"
            title="Clear history"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-neutral-600 text-center py-6">
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
                className="w-full text-left p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition group"
              >
                <p className="text-xs text-neutral-300 line-clamp-2 group-hover:text-white transition mb-1.5">
                  {item.original}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {LLM_LABELS[item.targetLLM].split(' ')[0]}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {TASK_LABELS[item.taskType]}
                  </span>
                  <span className="text-[9px] text-neutral-500 ml-auto">{timeAgo(item.createdAt)} ago</span>
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
