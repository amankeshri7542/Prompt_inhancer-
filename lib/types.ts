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

export type PromptLength = 'compact' | 'standard' | 'comprehensive';

/** Top-level surface. Enhance builds prompts; Handoff resumes agent sessions. */
export type Surface = 'enhance' | 'handoff';

/** Where the pasted transcript came from — shapes how the model parses its structure. */
export type SessionSource =
  | 'claude-code'
  | 'codex'
  | 'cursor'
  | 'gemini'
  | 'chatgpt'
  | 'claude-chat'
  | 'other';

/** Where the brief gets pasted — shapes the brief's own formatting. */
export type HandoffTarget =
  | 'claude-code'
  | 'codex'
  | 'cursor'
  | 'gemini'
  | 'chatgpt'
  | 'claude-chat'
  | 'other';

export type BriefLength = 'tight' | 'standard' | 'full';

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
  length: PromptLength;
  profile: StyleProfile;
}

export interface ProEnhanceRequest extends EnhanceRequest {
  answers: Record<string, string>;
}

export interface HandoffRequest {
  transcript: string;
  source: SessionSource;
  target: HandoffTarget;
  briefLength: BriefLength;
  /** Optional steer, e.g. "focus on the auth refactor, ignore the CSS work". */
  focus: string;
}

/** Usage + cost for one generation, surfaced in the UI and kept in history. */
export interface RunCost {
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  model: string;
  provider: string;
}

export interface HistoryItem {
  id: string;
  createdAt: number;
  original: string;
  enhanced: string;
  targetLLM: TargetLLM;
  taskType: TaskType;
  technique: Technique;
  length: PromptLength;
  mode: Mode;
  cost?: RunCost;
}

export interface HandoffHistoryItem {
  id: string;
  createdAt: number;
  brief: string;
  source: SessionSource;
  target: HandoffTarget;
  briefLength: BriefLength;
  /** Transcript characters that went in — drives the compression readout. */
  inputChars: number;
  cost?: RunCost;
}

export const DEFAULT_PROFILE: StyleProfile = {
  tone: 'Professional and direct',
  audience: 'Technical (developers, AI engineers)',
  identity: 'Full-stack developer working with AI tools',
  outputFormat: 'Structured markdown with clear sections',
  avoid: 'Fluff, disclaimers, excessive emojis, marketing speak',
  defaultLLM: 'gpt',
};

/**
 * Transcript size caps. With no access gate on the app, these are what bound
 * worst-case spend: at GLM 5.2's $0.77/M input, 400k chars is roughly $0.10 a
 * call and the long-session ceiling roughly $0.55.
 */
export const MAX_TRANSCRIPT_CHARS = 400_000;
export const MAX_TRANSCRIPT_CHARS_LONG = 2_800_000;
