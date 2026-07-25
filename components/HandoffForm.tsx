'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, ArrowRight, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { Label, Select, Segmented, ErrorNote } from './ui';
import { redactSecrets } from '@/lib/redact';
import {
  SOURCE_LABELS,
  TARGET_LABELS,
  BRIEF_LENGTH_LABELS,
  BRIEF_LENGTH_HINTS,
} from '@/lib/handoff-templates';
import {
  MAX_TRANSCRIPT_CHARS,
  MAX_TRANSCRIPT_CHARS_LONG,
  type BriefLength,
  type HandoffTarget,
  type SessionSource,
} from '@/lib/types';

export interface HandoffSubmit {
  transcript: string;
  source: SessionSource;
  target: HandoffTarget;
  briefLength: BriefLength;
  focus: string;
  allowLong: boolean;
}

const LENGTH_OPTIONS: { value: BriefLength; label: string }[] = [
  { value: 'tight', label: BRIEF_LENGTH_LABELS.tight },
  { value: 'standard', label: BRIEF_LENGTH_LABELS.standard },
  { value: 'full', label: BRIEF_LENGTH_LABELS.full },
];

export default function HandoffForm({
  busy,
  error,
  onSubmit,
}: {
  busy: boolean;
  error: string | null;
  onSubmit: (v: HandoffSubmit) => void;
}) {
  const [transcript, setTranscript] = useState('');
  const [source, setSource] = useState<SessionSource>('claude-code');
  const [target, setTarget] = useState<HandoffTarget>('claude-code');
  const [briefLength, setBriefLength] = useState<BriefLength>('standard');
  const [focus, setFocus] = useState('');
  const [allowLong, setAllowLong] = useState(false);
  const [showFindings, setShowFindings] = useState(false);

  // Redaction runs on every keystroke's worth of pasted text so the count is
  // live, and so the text that leaves the browser is already clean.
  const redacted = useMemo(() => redactSecrets(transcript), [transcript]);

  const cap = allowLong ? MAX_TRANSCRIPT_CHARS_LONG : MAX_TRANSCRIPT_CHARS;
  const overCap = redacted.text.length > cap;
  const tooShort = transcript.trim().length > 0 && transcript.trim().length < 200;
  const approxTokens = Math.round(redacted.text.length / 4);
  const estCost = (approxTokens / 1_000_000) * 0.77;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || overCap || redacted.text.trim().length < 200) return;
    onSubmit({
      transcript: redacted.text,
      source,
      target,
      briefLength,
      focus,
      allowLong,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="slab overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
          <Label>Paste the session</Label>
          <span className="readout text-[10px] text-[var(--dim)]">
            {redacted.text.length.toLocaleString()} / {cap.toLocaleString()} chars
          </span>
        </div>

        <label htmlFor="transcript" className="sr-only">
          Session transcript
        </label>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Select the whole conversation in your terminal, copy, and paste it here. Tool output and diffs are useful — keep them in."
          className="h-52 w-full resize-none bg-transparent p-4 font-[family-name:var(--font-term)] text-[13px] leading-relaxed text-[var(--chalk)] outline-none placeholder:font-[family-name:var(--font-body)] placeholder:text-[var(--dim)] sm:h-64 sm:p-5"
        />

        {/* Redaction report — visible so over-redaction is catchable. */}
        <AnimatePresence>
          {redacted.total > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-[var(--line)] bg-[var(--signal-soft)]"
            >
              <button
                type="button"
                onClick={() => setShowFindings((v) => !v)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left sm:px-5"
              >
                <ShieldCheck size={13} className="shrink-0 text-[var(--signal)]" />
                <span className="text-xs text-[var(--chalk)]">
                  {redacted.total} secret{redacted.total === 1 ? '' : 's'} removed before sending
                </span>
                <ChevronDown
                  size={13}
                  className={clsx(
                    'ml-auto shrink-0 text-[var(--dim)] transition-transform',
                    showFindings && 'rotate-180',
                  )}
                />
              </button>
              {showFindings && (
                <ul className="readout space-y-1 px-4 pb-3 text-[10px] text-[var(--ash)] sm:px-5">
                  {redacted.findings.map((f) => (
                    <li key={f.label} className="flex justify-between gap-4">
                      <span>{f.label}</span>
                      <span className="text-[var(--dim)]">{f.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-3 border-t border-[var(--line)] p-4 sm:grid-cols-2 sm:p-5">
          <Select
            label="Session came from"
            value={source}
            onChange={setSource}
            options={SOURCE_LABELS}
          />
          <Select
            label="Continue in"
            value={target}
            onChange={setTarget}
            options={TARGET_LABELS}
          />
        </div>

        <div className="border-t border-[var(--line)] px-4 py-4 sm:px-5">
          <div className="mb-2 flex items-center justify-between">
            <Label>Brief length</Label>
            <span className="readout text-[10px] text-[var(--signal)]">
              {BRIEF_LENGTH_HINTS[briefLength]}
            </span>
          </div>
          <Segmented
            value={briefLength}
            onChange={setBriefLength}
            options={LENGTH_OPTIONS}
            layoutId="brief-length"
          />
        </div>

        <div className="border-t border-[var(--line)] px-4 py-4 sm:px-5">
          <label htmlFor="focus" className="mb-2 block">
            <Label>Focus (optional)</Label>
          </label>
          <input
            id="focus"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            maxLength={1000}
            placeholder="e.g. only the auth refactor — skip the CSS work"
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2.5 text-sm text-[var(--chalk)] outline-none transition hover:border-[var(--line-strong)] focus:border-[var(--signal)] placeholder:text-[var(--dim)]"
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 border-t border-[var(--line)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--ash)]">
            <input
              type="checkbox"
              checked={allowLong}
              onChange={(e) => setAllowLong(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--signal)]"
            />
            Long session
            <span className="readout text-[10px] text-[var(--dim)]">
              (raises the cap to {(MAX_TRANSCRIPT_CHARS_LONG / 1000).toFixed(0)}k)
            </span>
          </label>

          <div className="flex items-center gap-3">
            {approxTokens > 0 && (
              <span className="readout text-[10px] text-[var(--dim)]">
                ≈{(approxTokens / 1000).toFixed(0)}k tokens · ~${estCost.toFixed(3)}
              </span>
            )}
            <button
              type="submit"
              disabled={busy || overCap || redacted.text.trim().length < 200}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--signal)] px-5 text-sm font-semibold text-[var(--on-signal)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              {busy ? <Loader2 className="animate-spin" size={15} /> : <ArrowRight size={15} />}
              Write the brief
            </button>
          </div>
        </div>
      </div>

      {tooShort && (
        <ErrorNote>That looks too short to be a session. Paste the whole conversation.</ErrorNote>
      )}
      {overCap && (
        <ErrorNote>
          {redacted.text.length.toLocaleString()} characters is over the{' '}
          {cap.toLocaleString()} limit.{' '}
          {allowLong ? 'Split the session and run it in two passes.' : 'Turn on “Long session”.'}
        </ErrorNote>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
    </form>
  );
}
