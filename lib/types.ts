export type TargetLLM = 'gpt' | 'claude' | 'gemini' | 'grok';

export type TaskType =
  | 'coding'
  | 'writing'
  | 'image'
  | 'video'
  | 'research'
  | 'agent'
  | 'sql';

export type Technique =
  | 'auto'
  | 'zero-shot'
  | 'chain-of-thought'
  | 'few-shot'
  | 'react'
  | 'tree-of-thought'
  | 'role-based';

export type Mode = 'fast' | 'pro';

export interface StyleProfile {
  tone: string;
  audience: string;
  identity: string;
  outputFormat: string;
  avoid: string;
  defaultLLM: TargetLLM;
}

export interface EnhanceRequest {
  prompt: string;
  targetLLM: TargetLLM;
  taskType: TaskType;
  technique: Technique;
  profile: StyleProfile;
}

export interface ProEnhanceRequest extends EnhanceRequest {
  answers: Record<string, string>;
}

export interface HistoryItem {
  id: string;
  createdAt: number;
  original: string;
  enhanced: string;
  targetLLM: TargetLLM;
  taskType: TaskType;
  technique: Technique;
  mode: Mode;
}

export const DEFAULT_PROFILE: StyleProfile = {
  tone: 'Professional and direct',
  audience: 'Technical (developers, AI engineers)',
  identity: 'Full-stack developer working with AI tools',
  outputFormat: 'Structured markdown with clear sections',
  avoid: 'Fluff, disclaimers, excessive emojis, marketing speak',
  defaultLLM: 'gpt',
};
