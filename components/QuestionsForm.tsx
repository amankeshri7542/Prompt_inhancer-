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
      className="w-full bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-2xl p-6"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-300">
          <HelpCircle size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Clarifying questions</h3>
          <p className="text-xs text-neutral-500">Answer to tailor the final prompt</p>
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
            <label className="block text-sm font-medium text-neutral-200 mb-1.5">
              <span className="text-neutral-500 mr-2">{i + 1}.</span>{q}
            </label>
            <textarea
              required
              rows={2}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-neutral-100 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition resize-none placeholder:text-neutral-600"
              placeholder="Your answer..."
              value={answers[q] || ''}
              onChange={(e) => setAnswers((p) => ({ ...p, [q]: e.target.value }))}
            />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
