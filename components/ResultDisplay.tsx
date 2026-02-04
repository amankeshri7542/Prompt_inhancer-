'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultDisplayProps {
    result: string;
}

export default function ResultDisplay({ result }: ResultDisplayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!result) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mt-8"
        >
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />

                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                        Enhanced Prompt
                    </h3>
                    <button
                        onClick={handleCopy}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {result}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
