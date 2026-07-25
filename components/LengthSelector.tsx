'use client';

import { LENGTH_LABELS, LENGTH_HINTS } from '@/lib/prompt-templates';
import type { PromptLength } from '@/lib/types';
import { Label, Segmented } from './ui';

const OPTIONS: { value: PromptLength; label: string }[] = [
  { value: 'compact', label: LENGTH_LABELS.compact },
  { value: 'standard', label: LENGTH_LABELS.standard },
  { value: 'comprehensive', label: LENGTH_LABELS.comprehensive },
];

export default function LengthSelector({
  value,
  onChange,
}: {
  value: PromptLength;
  onChange: (v: PromptLength) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>Prompt length</Label>
        <span className="readout text-[10px] text-[var(--signal)]">{LENGTH_HINTS[value]}</span>
      </div>
      <Segmented value={value} onChange={onChange} options={OPTIONS} layoutId="prompt-length" />
    </div>
  );
}
