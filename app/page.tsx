'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Loader2,
  Sparkles,
  Settings,
  Plus,
  Pencil,
  ShieldCheck,
  Gauge,
} from 'lucide-react';
import Toolbar from '@/components/Toolbar';
import LengthSelector from '@/components/LengthSelector';
import ResultDisplay from '@/components/ResultDisplay';
import QuestionsForm from '@/components/QuestionsForm';
import HistoryPanel from '@/components/HistoryPanel';
import ProfilePanel from '@/components/ProfilePanel';
import InstallHint from '@/components/InstallHint';
import type {
  TargetLLM,
  TaskType,
  Technique,
  PromptLength,
  Mode,
  StyleProfile,
  HistoryItem,
} from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';

const LS_PROFILE = 'prompt-enhancer:profile';
const LS_HISTORY = 'prompt-enhancer:history';
const LS_PREFS = 'prompt-enhancer:prefs';
const HISTORY_LIMIT = 5;
const MAX_PROMPT_CHARS = 12_000;

type Step = 'input' | 'questions' | 'result';
type ResultMeta = { targetLLM: TargetLLM; taskType: TaskType; technique: Technique; length: PromptLength };

export default function Home() {
  const [profile, setProfile] = useState<StyleProfile>(DEFAULT_PROFILE);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);

  const [targetLLM, setTargetLLM] = useState<TargetLLM>('gpt');
  const [taskType, setTaskType] = useState<TaskType>('coding');
  const [technique, setTechnique] = useState<Technique>('auto');
  const [length, setLength] = useState<PromptLength>('standard');
  const [mode, setMode] = useState<Mode>('fast');

  const [prompt, setPrompt] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [resultMeta, setResultMeta] = useState<ResultMeta | null>(null);
  const [step, setStep] = useState<Step>('input');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const p = localStorage.getItem(LS_PROFILE);
      if (p) {
        const parsed = JSON.parse(p) as StyleProfile;
        setProfile(parsed);
        setTargetLLM(parsed.defaultLLM);
      }
      const h = localStorage.getItem(LS_HISTORY);
      if (h) setHistory(JSON.parse(h));
      const prefs = localStorage.getItem(LS_PREFS);
      if (prefs) {
        const parsed = JSON.parse(prefs);
        if (parsed.targetLLM) setTargetLLM(parsed.targetLLM);
        if (parsed.taskType) setTaskType(parsed.taskType);
        if (parsed.technique) setTechnique(parsed.technique);
        if (parsed.length) setLength(parsed.length);
        if (parsed.mode) setMode(parsed.mode);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist prefs whenever they change
  useEffect(() => {
    localStorage.setItem(LS_PREFS, JSON.stringify({ targetLLM, taskType, technique, length, mode }));
  }, [targetLLM, taskType, technique, length, mode]);

  const saveProfile = (p: StyleProfile) => {
    setProfile(p);
    localStorage.setItem(LS_PROFILE, JSON.stringify(p));
  };

  const addToHistory = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, HISTORY_LIMIT);
      localStorage.setItem(LS_HISTORY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(LS_HISTORY);
  };

  const handleEnhance = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError(null);
    setResult('');
    setQuestions([]);

    try {
      if (mode === 'fast') {
        const res = await fetch('/api/enhance-fast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, targetLLM, taskType, technique, length, profile }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Something went wrong');
          return;
        }
        setResult(data.enhancedPrompt);
        setResultMeta({ targetLLM, taskType, technique, length });
        setStep('result');
        addToHistory({
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          original: prompt,
          enhanced: data.enhancedPrompt,
          targetLLM, taskType, technique, length, mode,
        });
      } else {
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, taskType }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Something went wrong');
          return;
        }
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          setStep('questions');
        } else {
          setError('Could not generate clarifying questions. Try again.');
        }
      }
    } catch (e) {
      console.error(e);
      setError('Failed to connect to the server.');
    } finally {
      setBusy(false);
    }
  };

  const handleProSubmit = async (answers: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/enhance-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, answers, targetLLM, taskType, technique, length, profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      setResult(data.enhancedPrompt);
      setResultMeta({ targetLLM, taskType, technique, length });
      setStep('result');
      addToHistory({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        original: prompt,
        enhanced: data.enhancedPrompt,
        targetLLM, taskType, technique, length, mode: 'pro',
      });
    } catch (e) {
      console.error(e);
      setError('Failed to connect to the server.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStep('input');
    setPrompt('');
    setQuestions([]);
    setResult('');
    setResultMeta(null);
    setError(null);
  };

  const editCurrent = () => {
    setStep('input');
    setQuestions([]);
    setError(null);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPrompt(item.original);
    setResult(item.enhanced);
    setResultMeta({ targetLLM: item.targetLLM, taskType: item.taskType, technique: item.technique, length: item.length });
    setTargetLLM(item.targetLLM);
    setTaskType(item.taskType);
    setTechnique(item.technique);
    setLength(item.length);
    setMode(item.mode);
    setQuestions([]);
    setError(null);
    setStep('result');
  };

  return (
    <main className="grain relative min-h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Ambient depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="studio-grid absolute inset-0 opacity-45" />
        <div className="absolute -top-40 -left-32 h-[560px] w-[560px] rounded-full bg-[var(--accent)]/[0.10] blur-[130px]" />
        <div className="absolute top-1/4 -right-40 h-[560px] w-[560px] rounded-full bg-[var(--accent-2)]/[0.08] blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-[var(--accent-deep)]/[0.07] blur-[110px]" />
        <div className="studio-vignette absolute inset-0" />
      </div>

      {/* Top bar */}
      <header className="safe-top safe-x sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="brand-mark grid h-10 w-10 place-items-center rounded-[14px] bg-gradient-to-br from-[var(--light-green-2)] via-[var(--accent-2)] to-[var(--accent-deep)] shadow-lg shadow-[var(--accent-2)]/25">
              <Wand2 size={17} className="text-[var(--on-accent)]" />
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-[18px] font-semibold tracking-tight">Prompt Enhancer</h1>
              <p className="-mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">Personal AI studio</p>
            </div>
          </div>
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="safe-main relative z-10 mx-auto max-w-6xl">
        <section className="mb-7 max-w-3xl sm:mb-9">
          <span className="kicker">Prompt Studio</span>
          <h2 className="mt-4 font-display text-[clamp(2.1rem,6.4vw,4rem)] leading-[0.95] tracking-[-0.045em] text-balance">
            Turn a rough thought into a prompt that{' '}
            <span className="ink-accent">actually works</span>.
          </h2>
          <hr className="rule-line my-5" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              Shape the model, task, technique, and depth. Fast mode gets you there in one pass;
              Pro mode asks the questions that make the final prompt sharper.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">
                <ShieldCheck size={12} />
                Private by design
              </span>
              <span className="eyebrow">
                <Gauge size={12} />
                Length controlled
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] lg:gap-6">
          {/* Workspace */}
          <div className="space-y-4 sm:space-y-5">
            <Toolbar
              targetLLM={targetLLM} setTargetLLM={setTargetLLM}
              taskType={taskType} setTaskType={setTaskType}
              technique={technique} setTechnique={setTechnique}
              mode={mode} setMode={setMode}
            />

            <AnimatePresence mode="wait">
              {step === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <div className="group relative">
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[var(--accent)]/30 to-[var(--accent-2)]/30 opacity-0 blur transition duration-500 group-focus-within:opacity-100" />
                    <div className="studio-card relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl">
                      <div className="console-bar border-b border-[var(--border)] px-4 py-2.5 sm:px-5">
                        <span className="console-dot" />
                        Your idea
                        <span className="ml-auto normal-case tracking-normal text-[var(--faint)]">
                          {mode === 'fast' ? 'Fast · one pass' : 'Pro · guided'}
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
                        placeholder="Describe the outcome you want, the context that matters, and any constraints…"
                        className="h-40 w-full resize-none bg-transparent p-4 text-base leading-relaxed text-[var(--text)] outline-none placeholder:text-[var(--faint)] sm:h-48 sm:p-5"
                      />

                      {/* Length chooser — pick depth before generating */}
                      <div className="border-t border-[var(--border)] px-4 py-3.5 sm:px-5">
                        <LengthSelector value={length} onChange={setLength} />
                      </div>

                      <div className="flex flex-col items-stretch justify-between gap-3 border-t border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                        <span className="font-mono text-[11px] text-[var(--faint)]">
                          {prompt.length.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()} characters
                        </span>
                        <button
                          onClick={handleEnhance}
                          disabled={!prompt.trim() || busy}
                          className="primary-action group/btn relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)] shadow-lg shadow-[var(--accent)]/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : (
                            <Sparkles size={15} className="transition-transform group-hover/btn:rotate-12" />
                          )}
                          {mode === 'fast' ? 'Enhance' : 'Start Pro Mode'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      role="alert"
                      className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger-text)]"
                    >
                      {error}
                    </motion.div>
                  )}
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
                  {error && (
                    <div role="alert" className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger-text)]">
                      {error}
                    </div>
                  )}
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
                  {/* Sticky action bar */}
                  <div className="sticky top-[72px] z-10 flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-tint)]/90 px-3 py-2 shadow-lg shadow-black/10 backdrop-blur-xl">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={reset}
                        className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-3 py-1.5 text-xs font-semibold text-[var(--on-accent)] shadow-md shadow-[var(--accent)]/20 transition hover:brightness-110"
                      >
                        <Plus size={13} /> New prompt
                      </button>
                      <button
                        onClick={editCurrent}
                        className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
                      >
                        <Pencil size={12} /> Edit &amp; re-run
                      </button>
                    </div>
                    <span className="hidden text-[10px] text-[var(--faint)] sm:inline">Saved to history</span>
                  </div>

                  <ResultDisplay result={result} meta={resultMeta ?? undefined} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <aside className="self-start lg:sticky lg:top-[88px]">
            <HistoryPanel items={history} onSelect={loadFromHistory} onClear={clearHistory} />
          </aside>
        </div>
      </div>

      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onSave={saveProfile}
      />

      <InstallHint />
    </main>
  );
}
