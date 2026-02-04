'use client';

import { Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ModeToggleProps {
    mode: 'fast' | 'pro';
    setMode: (mode: 'fast' | 'pro') => void;
}

export default function ModeToggle({ mode, setMode }: ModeToggleProps) {
    return (
        <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full inline-flex relative">
            <motion.div
                className="absolute top-1 bottom-1 bg-white dark:bg-neutral-600 rounded-full shadow-sm"
                initial={false}
                animate={{
                    left: mode === 'fast' ? 4 : '50%',
                    right: mode === 'fast' ? '50%' : 4,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />

            <button
                onClick={() => setMode('fast')}
                className={clsx(
                    "relative z-10 px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors duration-200",
                    mode === 'fast' ? "text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                )}
            >
                <Zap size={16} />
                Fast
            </button>

            <button
                onClick={() => setMode('pro')}
                className={clsx(
                    "relative z-10 px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors duration-200",
                    mode === 'pro' ? "text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                )}
            >
                <Sparkles size={16} />
                Pro
            </button>
        </div>
    );
}
