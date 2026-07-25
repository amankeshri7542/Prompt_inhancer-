'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import HandoffForm, { type HandoffSubmit } from './HandoffForm';
import ResultDisplay, { type Stage } from './ResultDisplay';
import CompressionReadout from './CompressionReadout';
import HistoryPanel, { type HistoryEntry } from './HistoryPanel';
import { ErrorNote } from './ui';
import { runStream } from '@/lib/client-stream';
import { countWords } from '@/lib/prompt-output';
import { SOURCE_LABELS, BRIEF_LENGTH_LABELS } from '@/lib/handoff-templates';
import type { HandoffHistoryItem, RunCost } from '@/lib/types';

const LS_HANDOFF = 'prompt-enhancer:handoffs';
const HISTORY_LIMIT = 5;

export default function HandoffSurface({
  onSpend,
  sessionSpend,
}: {
  onSpend: (usd: number) => void;
  sessionSpend: number;
}) {
  const [history, setHistory] = useState<HandoffHistoryItem[]>([]);
  const [brief, setBrief] = useState('');
  const [cost, setCost] = useState<RunCost | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // After mount, not in an initialiser: localStorage doesn't exist during SSR, so
  // reading it eagerly would make the first client render disagree with the
  // server HTML. One extra render on mount is the correct trade here.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_HANDOFF);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // corrupt storage shouldn't break the app
    }
  }, []);

  const addToHistory = useCallback((item: HandoffHistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, HISTORY_LIMIT);
      localStorage.setItem(LS_HANDOFF, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSubmit = async (values: HandoffSubmit) => {
    setBusy(true);
    setError(null);
    setBrief('');
    setCost(null);
    setShowResult(true);

    await runStream('/api/handoff', values, {
      onStage: (s) => setStage(s),
      onDelta: (t) => setBrief((prev) => prev + t),
      onDone: (text, runCost) => {
        setStage('idle');
        setBrief(text);
        setCost(runCost);
        if (runCost) onSpend(runCost.costUsd);
        addToHistory({
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          brief: text,
          source: values.source,
          target: values.target,
          briefLength: values.briefLength,
          inputChars: values.transcript.length,
          cost: runCost ?? undefined,
        });
      },
      onError: (message) => {
        setStage('idle');
        setError(message);
      },
    });

    setBusy(false);
  };

  const entries: HistoryEntry[] = history.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    preview: item.brief.slice(0, 160),
    chips: [SOURCE_LABELS[item.source], BRIEF_LENGTH_LABELS[item.briefLength]],
    costUsd: item.cost?.costUsd,
  }));

  const loadFromHistory = (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    setBrief(item.brief);
    setCost(item.cost ?? null);
    setStage('idle');
    setError(null);
    setShowResult(true);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_310px] lg:gap-6">
      <div className="space-y-4">
        <AnimatePresence mode="wait" initial={false}>
          {!showResult ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <HandoffForm busy={busy} error={error} onSubmit={handleSubmit} />
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <button
                onClick={() => {
                  setShowResult(false);
                  setBrief('');
                  setCost(null);
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--signal)] px-3 py-1.5 text-xs font-semibold text-[var(--on-signal)] transition hover:brightness-110"
              >
                <Plus size={13} /> New handoff
              </button>

              {error ? (
                <ErrorNote>{error}</ErrorNote>
              ) : (
                <>
                  {stage === 'idle' && cost && (
                    <CompressionReadout cost={cost} briefWords={countWords(brief)} />
                  )}
                  <ResultDisplay
                    result={brief}
                    title="Handoff brief"
                    stage={stage}
                    cost={cost}
                    downloadName="handoff-brief"
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <aside className="self-start lg:sticky lg:top-[84px]">
        <HistoryPanel
          entries={entries}
          emptyLine="Briefs you generate stay on this device."
          sessionSpend={sessionSpend}
          onSelect={loadFromHistory}
          onClear={() => {
            setHistory([]);
            localStorage.removeItem(LS_HANDOFF);
          }}
        />
      </aside>
    </div>
  );
}
