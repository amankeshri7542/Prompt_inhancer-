'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface QuestionsFormProps {
  questions: string[];
  onSubmit: (answers: Record<string, string>) => void;
  isLoading: boolean;
  onCancel: () => void;
}

export default function QuestionsForm({
  questions,
  onSubmit,
  isLoading,
  onCancel,
}: QuestionsFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="slab p-4 sm:p-5"
      onSubmit={handleSubmit}
    >
      <div className="mb-5">
        <h3 className="bracket text-sm font-semibold text-[var(--chalk)]">Clarifying questions</h3>
        <p className="mt-1.5 pl-3.5 text-xs text-[var(--ash)]">
          Answer what you can. Blank answers are skipped.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <motion.div
            key={q}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <label
              htmlFor={`q-${i}`}
              className="mb-1.5 flex gap-2.5 text-sm font-medium text-[var(--chalk)]"
            >
              {/* Numbering is real here: these are a fixed, ordered set. */}
              <span className="readout shrink-0 text-[var(--signal)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              {q}
            </label>
            <textarea
              id={`q-${i}`}
              rows={2}
              className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2.5 text-sm text-[var(--chalk)] outline-none transition hover:border-[var(--line-strong)] focus:border-[var(--signal)] placeholder:text-[var(--dim)]"
              placeholder="Your answer"
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
          className="min-h-11 rounded-lg px-4 text-sm text-[var(--ash)] transition hover:bg-[var(--slab-2)] hover:text-[var(--chalk)]"
        >
          Start over
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--signal)] px-5 text-sm font-semibold text-[var(--on-signal)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={15} /> Building
            </>
          ) : (
            <>
              Build the prompt <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
