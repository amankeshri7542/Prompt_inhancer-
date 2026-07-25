import type { PromptLength, RunCost } from './types';
import { chatComplete } from './ai';

export const LENGTH_LIMITS: Record<
  PromptLength,
  {
    min?: number;
    max?: number;
    target: string;
    repairTarget: string;
    repairShape: string;
  }
> = {
  compact: {
    max: 150,
    target: '≤150 words',
    repairTarget: '120-140 words with an absolute maximum of 150',
    repairShape: 'Use compact prose or at most 4 short lines. Do not use examples or sub-lists.',
  },
  standard: {
    min: 300,
    max: 400,
    target: '300-400 words',
    repairTarget: '330-370 words with an absolute maximum of 400',
    repairShape:
      'Use at most 6 short sections and 12 bullets total. Group related deliverables instead of enumerating every file or field.',
  },
  comprehensive: {
    min: 600,
    target: '600+ words',
    repairTarget: '650-850 words with an absolute minimum of 600',
    repairShape: 'Use detailed sections, but avoid repeating requirements across sections.',
  },
};

export function countWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function isOutsideLength(value: string, length: PromptLength): boolean {
  const words = countWords(value);
  const { min, max } = LENGTH_LIMITS[length];
  return (min !== undefined && words < min) || (max !== undefined && words > max);
}

function truncateWords(value: string, maxWords: number): string {
  const words = value.trim().split(/\s+/u);
  if (words.length <= maxWords) return value.trim();

  const clipped = words.slice(0, maxWords).join(' ');
  const lastBoundary = Math.max(
    clipped.lastIndexOf('.'),
    clipped.lastIndexOf('!'),
    clipped.lastIndexOf('?'),
    clipped.lastIndexOf('>'),
  );

  // Prefer a complete final sentence when it does not discard too much useful output.
  if (lastBoundary >= clipped.length * 0.72) {
    return clipped.slice(0, lastBoundary + 1).trim();
  }

  return clipped.trimEnd().replace(/[,:;\-–—]+$/u, '') + '.';
}

/** True when the draft already satisfies the length contract, so no repair runs. */
export function needsLengthRepair(value: string, length: PromptLength): boolean {
  const cleaned = value.trim();
  return Boolean(cleaned) && isOutsideLength(cleaned, length);
}

/**
 * Second pass that pulls an out-of-band draft back inside its word band.
 *
 * This cannot be streamed: whether a draft is too long is only knowable once it
 * is complete. Routes stream the draft, then announce a `tightening` stage and
 * send the corrected text in the final event.
 *
 * Returns the extra usage so the caller can add it to the run's total cost.
 */
export async function enforcePromptLength({
  prompt,
  length,
}: {
  prompt: string;
  length: PromptLength;
}): Promise<{ text: string; extra: RunCost[] }> {
  const cleaned = prompt.trim();
  const extra: RunCost[] = [];
  if (!cleaned || !isOutsideLength(cleaned, length)) return { text: cleaned, extra };

  const limits = LENGTH_LIMITS[length];
  let candidate = cleaned;

  for (let attempt = 0; attempt < 2 && isOutsideLength(candidate, length); attempt += 1) {
    const { text, meta } = await chatComplete({
      reasoning: 'off',
      maxTokens: 4_000,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are a precise prompt editor. Rewrite the supplied prompt to ${limits.repairTarget}.
Preserve its intent, concrete constraints, target-model formatting, and output specification.
${limits.repairShape}
Keep every section complete; remove lower-priority detail instead of ending mid-list or mid-structure.
Return only the rewritten prompt. Do not discuss the edit or report a word count.`,
        },
        { role: 'user', content: candidate },
      ],
    });

    if (meta.usage) {
      extra.push({ ...meta.usage, model: meta.model, provider: meta.provider });
    }
    candidate = text || candidate;
  }

  return {
    text: limits.max ? truncateWords(candidate, limits.max) : candidate,
    extra,
  };
}
