'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Loader2, Sparkles, Settings, Plus, Pencil } from 'lucide-react';
import Toolbar from '@/components/Toolbar';
import ResultDisplay from '@/components/ResultDisplay';
import QuestionsForm from '@/components/QuestionsForm';
import HistoryPanel from '@/components/HistoryPanel';
import ProfilePanel from '@/components/ProfilePanel';
import type {
  TargetLLM,
  TaskType,
  Technique,
  Mode,
  StyleProfile,
  HistoryItem,
} from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';

const LS_PROFILE = 'prompt-enhancer:profile';
const LS_HISTORY = 'prompt-enhancer:history';
const LS_PREFS = 'prompt-enhancer:prefs';
const HISTORY_LIMIT = 5;

type Step = 'input' | 'questions' | 'result';

export default function Home() {
  const [profile, setProfile] = useState<StyleProfile>(DEFAULT_PROFILE);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);

  const [targetLLM, setTargetLLM] = useState<TargetLLM>('gpt');
  const [taskType, setTaskType] = useState<TaskType>('coding');
  const [technique, setTechnique] = useState<Technique>('auto');
  const [mode, setMode] = useState<Mode>('fast');

  const [prompt, setPrompt] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [resultMeta, setResultMeta] = useState<{ targetLLM: TargetLLM; taskType: TaskType; technique: Technique } | null>(null);
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
        if (parsed.mode) setMode(parsed.mode);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist prefs whenever they change
  useEffect(() => {
    localStorage.setItem(LS_PREFS, JSON.stringify({ targetLLM, taskType, technique, mode }));
  }, [targetLLM, taskType, technique, mode]);

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
          body: JSON.stringify({ prompt, targetLLM, taskType, technique, profile }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Something went wrong');
          return;
        }
        setResult(data.enhancedPrompt);
        setResultMeta({ targetLLM, taskType, technique });
        setStep('result');
        addToHistory({
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          original: prompt,
          enhanced: data.enhancedPrompt,
          targetLLM, taskType, technique, mode,
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
        body: JSON.stringify({ prompt, answers, targetLLM, taskType, technique, profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      setResult(data.enhancedPrompt);
      setResultMeta({ targetLLM, taskType, technique });
      setStep('result');
      addToHistory({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        original: prompt,
        enhanced: data.enhancedPrompt,
        targetLLM, taskType, technique, mode: 'pro',
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
    // Go back to input step but keep the prompt so user can tweak and re-run
    setStep('input');
    setQuestions([]);
    setError(null);
  };

  const loadFromHistory = (item: HistoryItem) => {
    // Load into editable input step, prefilled with original prompt + same settings.
    setPrompt(item.original);
    setResult(item.enhanced);
    setResultMeta({ targetLLM: item.targetLLM, taskType: item.taskType, technique: item.technique });
    setTargetLLM(item.targetLLM);
    setTaskType(item.taskType);
    setTechnique(item.technique);
    setMode(item.mode);
    setQuestions([]);
    setError(null);
    setStep('input');
  };

  return (
    <main className="min-h-screen bg-[#070709] text-neutral-100 relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-cyan-500/[0.06] rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.08),transparent_50%)]" />
      </div>

      {/* Top bar */}
      <header className="relative z-20 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wand2 size={17} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Prompt Enhancer</h1>
              <p className="text-[11px] text-neutral-500 -mt-0.5">Personal prompt engineering toolkit</p>
            </div>
          </div>
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm text-neutral-300 hover:text-white transition"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Workspace */}
          <div className="space-y-5">
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
                  <div className="relative group">
                    <div className="absolute -inset-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition duration-500" />
                    <div className="relative bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-2xl">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe what you want the AI to do..."
                        className="w-full h-44 p-5 bg-transparent rounded-2xl outline-none resize-none text-neutral-100 placeholder:text-neutral-600 text-base leading-relaxed"
                      />
                      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                        <span className="text-xs text-neutral-500">{prompt.length} chars</span>
                        <button
                          onClick={handleEnhance}
                          disabled={!prompt.trim() || busy}
                          className="group/btn relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {busy ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : (
                            <Sparkles size={15} className="group-hover/btn:rotate-12 transition-transform" />
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
                      className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg"
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
                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg">
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
                  {/* Top action bar — sticky so it stays visible on long results */}
                  <div className="sticky top-2 z-10 flex items-center justify-between gap-2 bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={reset}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-md shadow-md shadow-blue-500/20 transition"
                      >
                        <Plus size={13} /> New prompt
                      </button>
                      <button
                        onClick={editCurrent}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white rounded-md transition"
                      >
                        <Pencil size={12} /> Edit & re-run
                      </button>
                    </div>
                    <span className="text-[10px] text-neutral-500 hidden sm:inline">Saved to history</span>
                  </div>

                  <ResultDisplay result={result} meta={resultMeta ?? undefined} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 self-start">
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
    </main>
  );
}
