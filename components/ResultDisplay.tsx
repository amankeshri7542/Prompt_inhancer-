'use client';

import { Copy, Check, Sparkles, Share2 } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LLM_LABELS, TASK_LABELS, TECHNIQUE_LABELS, LENGTH_LABELS } from '@/lib/prompt-templates';
import type { TargetLLM, TaskType, Technique, PromptLength } from '@/lib/types';

interface ResultDisplayProps {
  result: string;
  meta?: {
    targetLLM: TargetLLM;
    taskType: TaskType;
    technique: Technique;
    length?: PromptLength;
  };
}

export default function ResultDisplay({ result, meta }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleShare = async () => {
    try {
      await navigator.share({ title: 'Enhanced prompt', text: result });
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      // user cancelled or unsupported — fall back to copy
      handleCopy();
    }
  };

  if (!result) return null;

  const words = result.trim().split(/\s+/).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="relative bg-[var(--surface)] border border-[var(--border)] backdrop-blur-xl rounded-2xl overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/55 to-transparent" />

        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles size={13} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text)] shrink-0">Enhanced Prompt</h3>
            {meta && (
              <div className="hidden md:flex items-center gap-1.5 ml-3">
                <Tag>{LLM_LABELS[meta.targetLLM].split(' ')[0]}</Tag>
                <Tag>{TASK_LABELS[meta.taskType]}</Tag>
                <Tag>{TECHNIQUE_LABELS[meta.technique]}</Tag>
                {meta.length && <Tag>{LENGTH_LABELS[meta.length]}</Tag>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {canShare && (
              <button
                onClick={handleShare}
                aria-label="Share"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition"
              >
                {shared ? <Check size={13} className="text-[var(--good)]" /> : <Share2 size={13} />}
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-[var(--good)]" /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 max-h-[58vh] overflow-y-auto">
          <pre className="whitespace-pre-wrap font-mono text-[13px] sm:text-sm leading-relaxed text-[var(--text)]/90 break-words">
            {result}
          </pre>
        </div>

        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-[var(--border)] text-[10px] text-[var(--faint)] font-mono">
          <span>{words.toLocaleString()} words</span>
          <span>{result.length.toLocaleString()} chars</span>
        </div>
      </div>
    </motion.div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]">
      {children}
    </span>
  );
}
