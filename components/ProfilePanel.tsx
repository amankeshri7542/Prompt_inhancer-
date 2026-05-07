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
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-neutral-950 border-l border-white/10 z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-neutral-950/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Style Profile</h2>
                <p className="text-xs text-neutral-500">Personalizes every prompt you generate</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition"
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
                <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">
                  Default target LLM
                </label>
                <select
                  value={draft.defaultLLM}
                  onChange={(e) => update('defaultLLM', e.target.value as StyleProfile['defaultLLM'])}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-neutral-100 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition"
                >
                  {(Object.entries(LLM_LABELS) as [StyleProfile['defaultLLM'], string][]).map(([k, v]) => (
                    <option key={k} value={k} className="bg-neutral-900">{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { onSave(draft); onClose(); }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
                >
                  <Save size={15} /> Save profile
                </button>
                <button
                  onClick={() => setDraft(DEFAULT_PROFILE)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-sm rounded-lg flex items-center gap-2 transition"
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
      <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-neutral-100 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition resize-none placeholder:text-neutral-600"
      />
    </div>
  );
}
