'use client';

import { Zap, Sparkles } from 'lucide-react';
import { LLM_LABELS, TASK_LABELS, TECHNIQUE_LABELS } from '@/lib/prompt-templates';
import type { TargetLLM, TaskType, Technique, Mode } from '@/lib/types';
import { Label, Select, Segmented } from './ui';

interface ToolbarProps {
  targetLLM: TargetLLM;
  setTargetLLM: (v: TargetLLM) => void;
  taskType: TaskType;
  setTaskType: (v: TaskType) => void;
  technique: Technique;
  setTechnique: (v: Technique) => void;
  mode: Mode;
  setMode: (v: Mode) => void;
}

export default function Toolbar({
  targetLLM,
  setTargetLLM,
  taskType,
  setTaskType,
  technique,
  setTechnique,
  mode,
  setMode,
}: ToolbarProps) {
  return (
    <div className="slab grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
      <Select label="Target LLM" value={targetLLM} onChange={setTargetLLM} options={LLM_LABELS} />
      <Select label="Task type" value={taskType} onChange={setTaskType} options={TASK_LABELS} />
      <Select
        label="Technique"
        value={technique}
        onChange={setTechnique}
        options={TECHNIQUE_LABELS}
      />

      <div className="flex flex-col gap-1.5">
        <Label>Mode</Label>
        <Segmented
          value={mode}
          onChange={setMode}
          layoutId="enhance-mode"
          options={[
            { value: 'fast', label: 'Fast', icon: <Zap size={12} /> },
            { value: 'pro', label: 'Pro', icon: <Sparkles size={12} /> },
          ]}
        />
      </div>
    </div>
  );
}
