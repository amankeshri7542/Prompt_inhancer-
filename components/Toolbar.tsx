'use client';

import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import {
  LLM_LABELS,
  TASK_LABELS,
  TECHNIQUE_LABELS,
} from '@/lib/prompt-templates';
import type { TargetLLM, TaskType, Technique, Mode } from '@/lib/types';

interface ToolbarProps {
  targetLLM: TargetLLM;
  setTargetLLM: (v: TargetLLM) => void;
  taskType: TaskType;
  setTaskType: (v: TaskType) => void;
  technique: Technique;
  setTechnique: (v: Technique) => void;
  mode: Mode;
  setMode: (v: Mode) => void;
}

function Field<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Record<T, string>;
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--faint)] font-medium">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text)] text-sm font-medium rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-[var(--accent)]/55 focus:ring-2 focus:ring-[var(--accent)]/20 transition cursor-pointer"
        >
          {(Object.entries(options) as [T, string][]).map(([k, v]) => (
            <option key={k} value={k} className="bg-neutral-900">
              {v}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  );
}

export default function Toolbar(props: ToolbarProps) {
  const { targetLLM, setTargetLLM, taskType, setTaskType, technique, setTechnique, mode, setMode } = props;

  return (
    <div className="w-full bg-[var(--surface)] border border-[var(--border)] backdrop-blur-xl rounded-2xl p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Target LLM" value={targetLLM} onChange={setTargetLLM} options={LLM_LABELS} />
        <Field label="Task type" value={taskType} onChange={setTaskType} options={TASK_LABELS} />
        <Field label="Technique" value={technique} onChange={setTechnique} options={TECHNIQUE_LABELS} />

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--faint)] font-medium">Mode</span>
          <div className="bg-[var(--surface)] border border-[var(--border)] p-1 rounded-lg inline-flex relative h-[42px]">
            <motion.div
              className="absolute top-1 bottom-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] rounded-md shadow-lg shadow-[var(--accent)]/25"
              initial={false}
              animate={{
                left: mode === 'fast' ? 4 : '50%',
                right: mode === 'fast' ? '50%' : 4,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
            <button
              onClick={() => setMode('fast')}
              className={clsx(
                'relative z-10 flex-1 rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors',
                mode === 'fast' ? 'text-[var(--on-accent)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
              )}
            >
              <Zap size={13} /> Fast
            </button>
            <button
              onClick={() => setMode('pro')}
              className={clsx(
                'relative z-10 flex-1 rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors',
                mode === 'pro' ? 'text-[var(--on-accent)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
              )}
            >
              <Sparkles size={13} /> Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
