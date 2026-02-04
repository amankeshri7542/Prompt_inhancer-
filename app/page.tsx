'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import ModeToggle from '@/components/ModeToggle';
import ResultDisplay from '@/components/ResultDisplay';
import QuestionsForm from '@/components/QuestionsForm';

export default function Home() {
  const [mode, setMode] = useState<'fast' | 'pro'>('fast');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [step, setStep] = useState<'input' | 'questions' | 'result'>('input');
  const [error, setError] = useState<string | null>(null);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;

    setIsEnhancing(true);
    setResult('');
    setQuestions([]);
    setError(null);

    try {
      if (mode === 'fast') {
        const res = await fetch('/api/enhance-fast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Something went wrong');
          return;
        }

        if (data.enhancedPrompt) {
          setResult(data.enhancedPrompt);
          setStep('result');
        }
      } else {
        // Pro mode - get questions first
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Something went wrong');
          return;
        }

        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setStep('questions');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to connect to the server.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleProSubmit = async (answers: Record<string, string>) => {
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/enhance-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, answers }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      if (data.enhancedPrompt) {
        setResult(data.enhancedPrompt);
        setStep('result');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to connect to the server.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const reset = () => {
    setStep('input');
    setPrompt('');
    setResult('');
    setQuestions([]);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -bottom-20 -right-20 pointer-events-none" />

      <motion.div
        layout
        className="w-full max-w-4xl z-10 flex flex-col items-center"
      >
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white mb-4 shadow-lg shadow-blue-500/20">
            <Wand2 size={24} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
            Prompt Enhancer
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Transform simple ideas into professional AI prompts instantly.
          </p>
        </motion.div>

        {/* Controls */}
        {step === 'input' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl flex flex-col items-center gap-6"
          >
            <ModeToggle mode={mode} setMode={setMode} />

            <div className="w-full relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur" />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want the AI to do..."
                className="relative w-full h-40 p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm focus:border-blue-500 dark:focus:border-blue-500 outline-none resize-none transition-all text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 text-lg"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-center text-sm font-medium"
              >
                {error}
              </motion.div>
            )}

            <button
              onClick={handleEnhance}
              disabled={!prompt.trim() || isEnhancing}
              className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 bg-neutral-900 dark:bg-white dark:text-black rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {isEnhancing ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Sparkles className="mr-2 group-hover:rotate-12 transition-transform" size={20} />
              )}
              {mode === 'fast' ? 'Enhance Prompt' : 'Start Pro Mode'}
            </button>
          </motion.div>
        )}

        {/* Pro Mode Questions */}
        {step === 'questions' && (
          <div className="w-full max-w-2xl">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-center text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
            <QuestionsForm
              questions={questions}
              onSubmit={handleProSubmit}
              isLoading={isEnhancing}
            />
          </div>
        )}

        {/* Result */}
        {step === 'result' && (
          <div className="flex flex-col items-center w-full">
            <ResultDisplay result={result} />
            <button
              onClick={reset}
              className="mt-8 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors flex items-center gap-2"
            >
              <ArrowRight size={16} className="rotate-180" />
              Enhance another prompt
            </button>
          </div>
        )}

      </motion.div>
    </main>
  );
}
