'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { StyleProfile } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';
import { LLM_LABELS } from '@/lib/prompt-templates';
import { Label, Select } from './ui';

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
  profile: StyleProfile;
  onSave: (p: StyleProfile) => void;
}

export default function ProfilePanel(props: ProfilePanelProps) {
  return (
    <AnimatePresence>{props.open && <PanelContent key="panel" {...props} />}</AnimatePresence>
  );
}

function PanelContent({ onClose, profile, onSave }: ProfilePanelProps) {
  const [draft, setDraft] = useState<StyleProfile>(profile);

  const update = <K extends keyof StyleProfile>(k: K, v: StyleProfile[K]) =>
    setDraft((prev) => ({ ...prev, [k]: v }));

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        className="safe-bottom fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l border-[var(--line)] bg-[var(--ink-2)] sm:w-[440px]"
      >
        <div className="panel-header sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--line)] bg-[var(--ink-2)]/95 px-5 pb-4 backdrop-blur-xl">
          <div>
            <h2 className="display text-lg text-[var(--chalk)]">Style profile</h2>
            <p className="mt-1 text-xs text-[var(--ash)]">Applied to every prompt you build.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-[var(--ash)] transition hover:bg-[var(--slab-2)] hover:text-[var(--chalk)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <Field
            label="Tone"
            value={draft.tone}
            onChange={(v) => update('tone', v)}
            placeholder="Professional and direct"
          />
          <Field
            label="Audience"
            value={draft.audience}
            onChange={(v) => update('audience', v)}
            placeholder="Senior developers"
          />
          <Field
            label="Your identity"
            value={draft.identity}
            onChange={(v) => update('identity', v)}
            placeholder="Full-stack dev building AI tools"
            rows={2}
          />
          <Field
            label="Preferred output format"
            value={draft.outputFormat}
            onChange={(v) => update('outputFormat', v)}
            placeholder="Structured markdown"
          />
          <Field
            label="Always avoid"
            value={draft.avoid}
            onChange={(v) => update('avoid', v)}
            placeholder="Fluff, disclaimers, emojis"
            rows={2}
          />

          <Select
            label="Default target LLM"
            value={draft.defaultLLM}
            onChange={(v) => update('defaultLLM', v)}
            options={LLM_LABELS}
          />

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--signal)] px-4 text-sm font-semibold text-[var(--on-signal)] transition hover:brightness-110"
            >
              <Save size={15} /> Save profile
            </button>
            <button
              onClick={() => setDraft(DEFAULT_PROFILE)}
              title="Reset to defaults"
              aria-label="Reset to defaults"
              className="flex min-h-11 items-center rounded-xl border border-[var(--line)] bg-[var(--ink-2)] px-4 text-[var(--ash)] transition hover:border-[var(--line-strong)] hover:text-[var(--chalk)]"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows = 1,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block">
        <Label>{label}</Label>
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--ink)] px-3 py-2.5 text-sm text-[var(--chalk)] outline-none transition hover:border-[var(--line-strong)] focus:border-[var(--signal)] placeholder:text-[var(--dim)]"
      />
    </label>
  );
}
