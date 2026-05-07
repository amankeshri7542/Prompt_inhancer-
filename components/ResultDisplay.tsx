'use client';

import { Copy, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LLM_LABELS, TASK_LABELS, TECHNIQUE_LABELS } from '@/lib/prompt-templates';
import type { TargetLLM, TaskType, Technique } from '@/lib/types';

interface ResultDisplayProps {
  result: string;
  meta?: { targetLLM: TargetLLM; taskType: TaskType; technique: Technique };
}

export default function ResultDisplay({ result, meta }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="relative bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-300">
              <Sparkles size={13} />
            </div>
            <h3 className="text-sm font-semibold text-white">Enhanced Prompt</h3>
            {meta && (
              <div className="hidden sm:flex items-center gap-1.5 ml-3">
                <Tag color="blue">{LLM_LABELS[meta.targetLLM].split(' ')[0]}</Tag>
                <Tag color="purple">{TASK_LABELS[meta.taskType]}</Tag>
                <Tag color="emerald">{TECHNIQUE_LABELS[meta.technique]}</Tag>
              </div>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-neutral-300 hover:text-white transition"
          >
            {copied ? <><Check size={13} className="text-emerald-400" /> Copied</> : <><Copy size={13} /> Copy</>}
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-neutral-200 break-words">
            {result}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: 'blue' | 'purple' | 'emerald' }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  };
  return (
    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${colors[color]}`}>
      {children}
    </span>
  );
}
