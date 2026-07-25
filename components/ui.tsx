'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

/** Utility label. Every field in the app is titled with one of these. */
export function Label({ children }: { children: React.ReactNode }) {
  return <span className="label">{children}</span>;
}

export function Select<T extends string>({
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
    <label className="flex min-w-0 flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2.5 pr-8 text-sm font-medium text-[var(--chalk)] outline-none transition hover:border-[var(--line-strong)] focus:border-[var(--signal)]"
        >
          {(Object.entries(options) as [T, string][]).map(([k, v]) => (
            <option key={k} value={k} className="bg-[#191b24]">
              {v}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--dim)]"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path
            d="M3 5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </label>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

/** Sliding segmented control. The thumb carries the current signal colour. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  layoutId,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  layoutId: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      role="tablist"
      className="relative inline-flex w-full rounded-lg border border-[var(--line)] bg-[var(--ink-2)] p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
              size === 'sm' ? 'min-h-8 text-[11px]' : 'min-h-9 text-xs',
              active
                ? 'text-[var(--on-signal)]'
                : 'text-[var(--ash)] hover:text-[var(--chalk)]',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-md bg-[var(--signal)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Small metadata chip. Quiet by default, signal-tinted when `accent`. */
export function Chip({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={clsx(
        'readout rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em]',
        accent
          ? 'border-[var(--signal-line)] bg-[var(--signal-soft)] text-[var(--signal)]'
          : 'border-[var(--line)] bg-[var(--slab-2)] text-[var(--ash)]',
      )}
    >
      {children}
    </span>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
    >
      {children}
    </div>
  );
}
