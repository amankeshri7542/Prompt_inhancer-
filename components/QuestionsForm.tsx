'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Loader2, HelpCircle } from 'lucide-react';

interface QuestionsFormProps {
  questions: string[];
  onSubmit: (answers: Record<string, string>) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export default function QuestionsForm({ questions, onSubmit, isLoading, onCancel }: QuestionsFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="studio-card w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-xl sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <HelpCircle size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Clarifying questions</h3>
          <p className="text-xs text-[var(--muted)]">Answer to tailor the final prompt</p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
              <span className="text-[var(--accent)] mr-2 font-mono">{i + 1}.</span>{q}
            </label>
            <textarea
              required
              rows={2}
              className="w-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text)] text-sm rounded-lg px-3 py-2.5 outline-none focus:border-[var(--accent)]/55 focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none placeholder:text-[var(--faint)]"
              placeholder="Your answer..."
              value={answers[q] || ''}
              onChange={(e) => setAnswers((p) => ({ ...p, [q]: e.target.value }))}
            />
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg px-4 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="primary-action flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={15} />
              Generating...
            </>
          ) : (
            <>
              Generate prompt
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
