'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { StyleProfile } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';
import { LLM_LABELS } from '@/lib/prompt-templates';

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
  profile: StyleProfile;
  onSave: (p: StyleProfile) => void;
}

export default function ProfilePanel(props: ProfilePanelProps) {
  return (
    <AnimatePresence>
      {props.open && <PanelContent key="panel" {...props} />}
    </AnimatePresence>
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-[var(--bg-tint)] border-l border-[var(--border)] z-50 overflow-y-auto safe-bottom"
          >
            <div className="profile-panel-header sticky top-0 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-tint)]/90 px-6 pb-4 backdrop-blur-xl">
              <div>
                <h2 className="text-lg font-semibold font-display text-[var(--text)]">Style Profile</h2>
                <p className="text-xs text-[var(--muted)]">Personalizes every prompt you generate</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <FieldArea label="Tone" value={draft.tone} onChange={(v) => update('tone', v)} placeholder="e.g., Professional and direct" />
              <FieldArea label="Audience" value={draft.audience} onChange={(v) => update('audience', v)} placeholder="e.g., Senior developers" />
              <FieldArea label="Your identity / context" value={draft.identity} onChange={(v) => update('identity', v)} placeholder="e.g., Full-stack dev building AI tools" rows={2} />
              <FieldArea label="Preferred output format" value={draft.outputFormat} onChange={(v) => update('outputFormat', v)} placeholder="e.g., Structured markdown" />
              <FieldArea label="Always avoid" value={draft.avoid} onChange={(v) => update('avoid', v)} placeholder="e.g., Fluff, disclaimers, emojis" rows={2} />

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[var(--faint)] font-semibold mb-2">
                  Default target LLM
                </label>
                <select
                  value={draft.defaultLLM}
                  onChange={(e) => update('defaultLLM', e.target.value as StyleProfile['defaultLLM'])}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text)] text-sm rounded-lg px-3 py-2.5 outline-none focus:border-[var(--accent)]/55 focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                >
                  {(Object.entries(LLM_LABELS) as [StyleProfile['defaultLLM'], string][]).map(([k, v]) => (
                    <option key={k} value={k} className="bg-neutral-900">{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { onSave(draft); onClose(); }}
                  className="flex-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] hover:brightness-110 text-[var(--on-accent)] text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent)]/20 transition"
                >
                  <Save size={15} /> Save profile
                </button>
                <button
                  onClick={() => setDraft(DEFAULT_PROFILE)}
                  className="px-4 py-2.5 bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] text-sm rounded-lg flex items-center gap-2 transition"
                  title="Reset to defaults"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>
      </motion.aside>
    </>
  );
}

function FieldArea({
  label, value, onChange, placeholder, rows = 1,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-[var(--faint)] font-semibold mb-2">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text)] text-sm rounded-lg px-3 py-2.5 outline-none focus:border-[var(--accent)]/55 focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none placeholder:text-[var(--faint)]"
      />
    </div>
  );
}
