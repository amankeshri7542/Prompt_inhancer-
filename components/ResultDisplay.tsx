'use client';

import { Copy, Check, Share2, CircleCheck, CircleAlert, Download } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { LLM_LABELS, TASK_LABELS, TECHNIQUE_LABELS, LENGTH_LABELS } from '@/lib/prompt-templates';
import type { TargetLLM, TaskType, Technique, PromptLength, RunCost } from '@/lib/types';
import { LENGTH_LIMITS, countWords } from '@/lib/prompt-output';
import { Chip } from './ui';
import CostMeter from './CostMeter';

export type Stage = 'idle' | 'drafting' | 'tightening';

interface ResultDisplayProps {
  result: string;
  title: string;
  stage: Stage;
  cost: RunCost | null;
  /** Filename stem for the download action; download is hidden when absent. */
  downloadName?: string;
  meta?: {
    targetLLM: TargetLLM;
    taskType: TaskType;
    technique: Technique;
    length?: PromptLength;
  };
}

export default function ResultDisplay({
  result,
  title,
  stage,
  cost,
  downloadName,
  meta,
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const streaming = stage !== 'idle';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleShare = async () => {
    try {
      await navigator.share({ title, text: result });
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      // cancelled or unsupported — copying is the useful fallback
      handleCopy();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!result && !streaming) return null;

  const words = countWords(result);
  const limits = meta?.length ? LENGTH_LIMITS[meta.length] : null;
  const withinRange =
    !limits ||
    ((limits.min === undefined || words >= limits.min) &&
      (limits.max === undefined || words <= limits.max));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <div className="slab overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <h3 className="bracket text-sm font-semibold text-[var(--chalk)]">{title}</h3>
            {meta && (
              <div className="hidden items-center gap-1.5 md:flex">
                <Chip accent>{LLM_LABELS[meta.targetLLM].split(' ')[0]}</Chip>
                <Chip>{TASK_LABELS[meta.taskType]}</Chip>
                <Chip>{TECHNIQUE_LABELS[meta.technique]}</Chip>
                {meta.length && <Chip>{LENGTH_LABELS[meta.length]}</Chip>}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {downloadName && !streaming && result && (
              <IconButton onClick={handleDownload} label="Download">
                <Download size={13} />
              </IconButton>
            )}
            {canShare && (
              <IconButton onClick={handleShare} label="Share">
                {shared ? <Check size={13} className="text-[var(--good)]" /> : <Share2 size={13} />}
              </IconButton>
            )}
            <button
              onClick={handleCopy}
              disabled={!result}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--ink-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--ash)] transition hover:border-[var(--line-strong)] hover:text-[var(--chalk)] disabled:opacity-40"
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

        {/*
          Two-stage progress. The tightening pass can't be streamed — whether a
          draft is over its word band is only knowable once it's complete — so
          the stage is announced rather than the text silently changing.
        */}
        {streaming && (
          <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--signal-soft)] px-4 py-2 sm:px-5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--signal)] opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
            </span>
            <span className="readout text-[10px] uppercase tracking-[0.16em] text-[var(--signal)]">
              {stage === 'drafting' ? 'Drafting' : 'Tightening to length'}
            </span>
          </div>
        )}

        <div className="rule-field max-h-[56vh] overflow-y-auto p-4 sm:p-5">
          <pre
            className={clsx(
              'whitespace-pre-wrap break-words font-[family-name:var(--font-term)] text-[13px] leading-relaxed text-[var(--chalk)]',
              streaming && 'cursor',
            )}
          >
            {result}
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--line)] px-4 py-2.5 sm:px-5">
          <span
            className={clsx(
              'readout flex items-center gap-1.5 text-[10px]',
              limits && !streaming
                ? withinRange
                  ? 'text-[var(--good)]'
                  : 'text-[var(--danger)]'
                : 'text-[var(--dim)]',
            )}
          >
            {limits && !streaming ? (
              withinRange ? (
                <CircleCheck size={12} />
              ) : (
                <CircleAlert size={12} />
              )
            ) : null}
            {words.toLocaleString()} words
            {limits ? ` · target ${limits.target}` : ''}
          </span>
          <CostMeter cost={cost} />
        </div>
      </div>
    </motion.div>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-lg border border-[var(--line)] bg-[var(--ink-2)] p-1.5 text-[var(--ash)] transition hover:border-[var(--line-strong)] hover:text-[var(--chalk)]"
    >
      {children}
    </button>
  );
}
