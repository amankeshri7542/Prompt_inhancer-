'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { LENGTH_LABELS, LENGTH_HINTS } from '@/lib/prompt-templates';
import type { PromptLength } from '@/lib/types';

interface LengthSelectorProps {
  value: PromptLength;
  onChange: (v: PromptLength) => void;
}

const ORDER: PromptLength[] = ['compact', 'standard', 'comprehensive'];

// Visualizer: stacked bars that "fill up" with the chosen depth.
function Bars({ level, active }: { level: number; active: boolean }) {
  // level 1..3 → number of bars; each bar a little wider than the last.
  const widths = [
    ['62%'],
    ['86%', '54%'],
    ['100%', '76%', '48%'],
  ][level - 1];

  return (
    <div className="flex flex-col gap-[3px] w-7">
      {widths.map((w, i) => (
        <motion.span
          key={i}
          className={clsx(
            'h-[3px] rounded-full',
            active ? 'bg-[var(--accent)]' : 'bg-[var(--faint)]',
          )}
          initial={false}
          animate={{ width: w }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        />
      ))}
    </div>
  );
}

export default function LengthSelector({ value, onChange }: LengthSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--faint)] font-medium">
          Prompt length
        </span>
        <span className="text-[10px] text-[var(--faint)] font-mono hidden sm:inline">
          {LENGTH_HINTS[value]}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ORDER.map((key, idx) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={active}
              className={clsx(
                'relative flex flex-col gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors min-h-[58px]',
                active
                  ? 'border-[var(--accent)]/55 bg-[var(--accent-soft)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]',
              )}
            >
              {active && (
                <motion.span
                  layoutId="length-glow"
                  className="pointer-events-none absolute -inset-px rounded-xl shadow-[0_0_24px_-6px_var(--accent)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <Bars level={idx + 1} active={active} />
              <span
                className={clsx(
                  'text-[11px] font-semibold leading-none',
                  active ? 'text-[var(--text)]' : 'text-[var(--muted)]',
                )}
              >
                {LENGTH_LABELS[key]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
