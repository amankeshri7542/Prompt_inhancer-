'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface QuestionsFormProps {
    questions: string[];
    onSubmit: (answers: Record<string, string>) => void;
    isLoading: boolean;
}

export default function QuestionsForm({ questions, onSubmit, isLoading }: QuestionsFormProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(answers);
    };

    return (
        <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl mt-6 space-y-6"
            onSubmit={handleSubmit}
        >
            <div className="space-y-4">
                {questions.map((question, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                    >
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {question}
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                            placeholder="Your answer..."
                            value={answers[question] || ''}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [question]: e.target.value }))}
                        />
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Enhancing...
                        </>
                    ) : (
                        <>
                            Generate Final Prompt
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </div>
        </motion.form>
    );
}
