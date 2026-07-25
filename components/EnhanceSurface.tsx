'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Plus, Pencil } from 'lucide-react';
import Toolbar from './Toolbar';
import LengthSelector from './LengthSelector';
import ResultDisplay, { type Stage } from './ResultDisplay';
import QuestionsForm from './QuestionsForm';
import HistoryPanel, { type HistoryEntry } from './HistoryPanel';
import { Label, ErrorNote } from './ui';
import { runStream } from '@/lib/client-stream';
import { LLM_LABELS, TASK_LABELS, LENGTH_LABELS } from '@/lib/prompt-templates';
import type {
  TargetLLM,
  TaskType,
  Technique,
  PromptLength,
  Mode,
  StyleProfile,
  HistoryItem,
  RunCost,
} from '@/lib/types';

const LS_HISTORY = 'prompt-enhancer:history';
const LS_PREFS = 'prompt-enhancer:prefs';
const HISTORY_LIMIT = 5;
const MAX_PROMPT_CHARS = 12_000;

type Step = 'input' | 'questions' | 'result';
type ResultMeta = {
  targetLLM: TargetLLM;
  taskType: TaskType;
  technique: Technique;
  length: PromptLength;
};

export default function EnhanceSurface({
  profile,
  onSpend,
  sessionSpend,
}: {
  profile: StyleProfile;
  onSpend: (usd: number) => void;
  sessionSpend: number;
}) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [targetLLM, setTargetLLM] = useState<TargetLLM>(profile.defaultLLM);
  const [taskType, setTaskType] = useState<TaskType>('coding');
  const [technique, setTechnique] = useState<Technique>('auto');
  const [length, setLength] = useState<PromptLength>('standard');
  const [mode, setMode] = useState<Mode>('fast');

  const [prompt, setPrompt] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [cost, setCost] = useState<RunCost | null>(null);
  const [resultMeta, setResultMeta] = useState<ResultMeta | null>(null);
  const [step, setStep] = useState<Step>('input');
  const [stage, setStage] = useState<Stage>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const h = localStorage.getItem(LS_HISTORY);
      if (h) setHistory(JSON.parse(h));
      const prefs = localStorage.getItem(LS_PREFS);
      if (prefs) {
        const p = JSON.parse(prefs);
        if (p.targetLLM) setTargetLLM(p.targetLLM);
        if (p.taskType) setTaskType(p.taskType);
        if (p.technique) setTechnique(p.technique);
        if (p.length) setLength(p.length);
        if (p.mode) setMode(p.mode);
      }
    } catch {
      // corrupt storage shouldn't break the app
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      LS_PREFS,
      JSON.stringify({ targetLLM, taskType, technique, length, mode }),
    );
  }, [targetLLM, taskType, technique, length, mode]);

  const addToHistory = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, HISTORY_LIMIT);
      localStorage.setItem(LS_HISTORY, JSON.stringify(next));
      return next;
    });
  }, []);

  const finish = useCallback(
    (text: string, runCost: RunCost | null, usedMode: Mode) => {
      setResult(text);
      setCost(runCost);
      if (runCost) onSpend(runCost.costUsd);
      setResultMeta({ targetLLM, taskType, technique, length });
      addToHistory({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        original: prompt,
        enhanced: text,
        targetLLM,
        taskType,
        technique,
        length,
        mode: usedMode,
        cost: runCost ?? undefined,
      });
    },
    [addToHistory, length, onSpend, prompt, targetLLM, taskType, technique],
  );

  const stream = (url: string, body: unknown, usedMode: Mode) =>
    runStream(url, body, {
      onStage: (s) => setStage(s),
      onDelta: (t) => setResult((prev) => prev + t),
      onDone: (text, runCost) => {
        setStage('idle');
        finish(text, runCost, usedMode);
      },
      onError: (message) => {
        setStage('idle');
        setError(message);
      },
    });

  const handleEnhance = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError(null);
    setResult('');
    setCost(null);
    setQuestions([]);

    try {
      if (mode === 'fast') {
        setStep('result');
        await stream(
          '/api/enhance-fast',
          { prompt, targetLLM, taskType, technique, length, profile },
          'fast',
        );
      } else {
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, taskType }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Something went wrong.');
          return;
        }
        if (data.cost) onSpend(data.cost.costUsd);
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          setStep('questions');
        } else {
          setError('No clarifying questions came back. Try Fast mode.');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleProSubmit = async (answers: Record<string, string>) => {
    setBusy(true);
    setError(null);
    setResult('');
    setCost(null);
    setStep('result');
    try {
      await stream(
        '/api/enhance-pro',
        { prompt, answers, targetLLM, taskType, technique, length, profile },
        'pro',
      );
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStep('input');
    setPrompt('');
    setQuestions([]);
    setResult('');
    setCost(null);
    setResultMeta(null);
    setError(null);
  };

  const editCurrent = () => {
    setStep('input');
    setQuestions([]);
    setError(null);
  };

  const entries: HistoryEntry[] = history.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    preview: item.original,
    chips: [
      LLM_LABELS[item.targetLLM].split(' ')[0],
      TASK_LABELS[item.taskType],
      LENGTH_LABELS[item.length],
    ],
    costUsd: item.cost?.costUsd,
  }));

  const loadFromHistory = (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    setPrompt(item.original);
    setResult(item.enhanced);
    setCost(item.cost ?? null);
    setResultMeta({
      targetLLM: item.targetLLM,
      taskType: item.taskType,
      technique: item.technique,
      length: item.length,
    });
    setTargetLLM(item.targetLLM);
    setTaskType(item.taskType);
    setTechnique(item.technique);
    setLength(item.length);
    setMode(item.mode);
    setQuestions([]);
    setError(null);
    setStage('idle');
    setStep('result');
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_310px] lg:gap-6">
      <div className="space-y-4">
        <Toolbar
          targetLLM={targetLLM}
          setTargetLLM={setTargetLLM}
          taskType={taskType}
          setTaskType={setTaskType}
          technique={technique}
          setTechnique={setTechnique}
          mode={mode}
          setMode={setMode}
        />

        <AnimatePresence mode="wait" initial={false}>
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="slab overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
                  <Label>Your idea</Label>
                  <span className="readout text-[10px] text-[var(--dim)]">
                    {mode === 'fast' ? 'one pass' : 'guided'}
                  </span>
                </div>
                <label htmlFor="prompt-idea" className="sr-only">
                  Prompt idea
                </label>
                <textarea
                  id="prompt-idea"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={MAX_PROMPT_CHARS}
                  placeholder="Describe the outcome you want, the context that matters, and any constraints."
                  className="h-40 w-full resize-none bg-transparent p-4 text-base leading-relaxed text-[var(--chalk)] outline-none placeholder:text-[var(--dim)] sm:h-48 sm:p-5"
                />

                <div className="border-t border-[var(--line)] px-4 py-4 sm:px-5">
                  <LengthSelector value={length} onChange={setLength} />
                </div>

                <div className="flex flex-col items-stretch justify-between gap-3 border-t border-[var(--line)] px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
                  <span className="readout text-[10px] text-[var(--dim)]">
                    {prompt.length.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()} chars
                  </span>
                  <button
                    onClick={handleEnhance}
                    disabled={!prompt.trim() || busy}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--signal)] px-5 text-sm font-semibold text-[var(--on-signal)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? (
                      <Loader2 className="animate-spin" size={15} />
                    ) : (
                      <Sparkles size={15} />
                    )}
                    {mode === 'fast' ? 'Enhance' : 'Ask me questions'}
                  </button>
                </div>
              </div>

              {error && <ErrorNote>{error}</ErrorNote>}
            </motion.div>
          )}

          {step === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <QuestionsForm
                questions={questions}
                onSubmit={handleProSubmit}
                isLoading={busy}
                onCancel={reset}
              />
              {error && <ErrorNote>{error}</ErrorNote>}
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--signal)] px-3 py-1.5 text-xs font-semibold text-[var(--on-signal)] transition hover:brightness-110"
                >
                  <Plus size={13} /> New prompt
                </button>
                <button
                  onClick={editCurrent}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--ink-2)] px-3 py-1.5 text-xs font-medium text-[var(--ash)] transition hover:border-[var(--line-strong)] hover:text-[var(--chalk)]"
                >
                  <Pencil size={12} /> Edit and re-run
                </button>
              </div>

              {error ? (
                <ErrorNote>{error}</ErrorNote>
              ) : (
                <ResultDisplay
                  result={result}
                  title="Enhanced prompt"
                  stage={stage}
                  cost={cost}
                  meta={resultMeta ?? undefined}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <aside className="self-start lg:sticky lg:top-[84px]">
        <HistoryPanel
          entries={entries}
          emptyLine="Your last five prompts stay on this device."
          sessionSpend={sessionSpend}
          onSelect={loadFromHistory}
          onClear={() => {
            setHistory([]);
            localStorage.removeItem(LS_HISTORY);
          }}
        />
      </aside>
    </div>
  );
}
