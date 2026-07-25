import {
  DEFAULT_PROFILE,
  MAX_TRANSCRIPT_CHARS,
  MAX_TRANSCRIPT_CHARS_LONG,
  type BriefLength,
  type EnhanceRequest,
  type HandoffRequest,
  type HandoffTarget,
  type PromptLength,
  type SessionSource,
  type StyleProfile,
  type TargetLLM,
  type TaskType,
  type Technique,
} from './types';

const TARGET_LLMS = new Set<TargetLLM>(['gpt', 'claude', 'gemini', 'grok']);
const TASK_TYPES = new Set<TaskType>([
  'coding',
  'writing',
  'image',
  'video',
  'research',
  'agent',
  'sql',
]);
const TECHNIQUES = new Set<Technique>([
  'auto',
  'zero-shot',
  'chain-of-thought',
  'few-shot',
  'react',
  'tree-of-thought',
  'role-based',
]);
const PROMPT_LENGTHS = new Set<PromptLength>(['compact', 'standard', 'comprehensive']);

const MAX_PROMPT_CHARS = 12_000;
const MAX_PROFILE_FIELD_CHARS = 500;

function cleanProfileField(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().slice(0, MAX_PROFILE_FIELD_CHARS);
  return cleaned || fallback;
}

function cleanProfile(value: unknown): StyleProfile {
  if (!value || typeof value !== 'object') return DEFAULT_PROFILE;
  const profile = value as Partial<StyleProfile>;

  return {
    tone: cleanProfileField(profile.tone, DEFAULT_PROFILE.tone),
    audience: cleanProfileField(profile.audience, DEFAULT_PROFILE.audience),
    identity: cleanProfileField(profile.identity, DEFAULT_PROFILE.identity),
    outputFormat: cleanProfileField(profile.outputFormat, DEFAULT_PROFILE.outputFormat),
    avoid: cleanProfileField(profile.avoid, DEFAULT_PROFILE.avoid),
    defaultLLM: TARGET_LLMS.has(profile.defaultLLM as TargetLLM)
      ? (profile.defaultLLM as TargetLLM)
      : DEFAULT_PROFILE.defaultLLM,
  };
}

export function parseEnhanceRequest(value: unknown):
  | { data: EnhanceRequest }
  | { error: string } {
  if (!value || typeof value !== 'object') {
    return { error: 'Request body must be a JSON object.' };
  }

  const body = value as Partial<EnhanceRequest>;
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

  if (!prompt) return { error: 'Enter a prompt idea before generating.' };
  if (prompt.length > MAX_PROMPT_CHARS) {
    return { error: `Prompt idea must be ${MAX_PROMPT_CHARS.toLocaleString()} characters or fewer.` };
  }
  if (!TARGET_LLMS.has(body.targetLLM as TargetLLM)) {
    return { error: 'Invalid target LLM.' };
  }
  if (!TASK_TYPES.has(body.taskType as TaskType)) {
    return { error: 'Invalid task type.' };
  }
  if (!TECHNIQUES.has(body.technique as Technique)) {
    return { error: 'Invalid prompting technique.' };
  }
  if (!PROMPT_LENGTHS.has(body.length as PromptLength)) {
    return { error: 'Invalid prompt length.' };
  }

  return {
    data: {
      prompt,
      targetLLM: body.targetLLM as TargetLLM,
      taskType: body.taskType as TaskType,
      technique: body.technique as Technique,
      length: body.length as PromptLength,
      profile: cleanProfile(body.profile),
    },
  };
}

export function isTaskType(value: unknown): value is TaskType {
  return TASK_TYPES.has(value as TaskType);
}

const SESSION_SOURCES = new Set<SessionSource>([
  'claude-code',
  'codex',
  'cursor',
  'generic',
]);
const HANDOFF_TARGETS = new Set<HandoffTarget>([
  'claude-code',
  'codex',
  'cursor',
  'generic',
]);
const BRIEF_LENGTHS = new Set<BriefLength>(['tight', 'standard', 'full']);

const MAX_FOCUS_CHARS = 1_000;

export function parseHandoffRequest(
  value: unknown,
): { data: HandoffRequest } | { error: string } {
  if (!value || typeof value !== 'object') {
    return { error: 'Request body must be a JSON object.' };
  }

  const body = value as Partial<HandoffRequest> & { allowLong?: unknown };
  const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : '';

  if (!transcript) return { error: 'Paste a session transcript first.' };
  if (transcript.length < 200) {
    return { error: 'That transcript is too short to summarise. Paste the full session.' };
  }

  // The cap is what bounds worst-case spend, since the app has no access gate.
  const cap = body.allowLong === true ? MAX_TRANSCRIPT_CHARS_LONG : MAX_TRANSCRIPT_CHARS;
  if (transcript.length > cap) {
    return {
      error: `Transcript is ${transcript.length.toLocaleString()} characters; the limit is ${cap.toLocaleString()}. ${
        body.allowLong === true
          ? 'Split the session and summarise it in two passes.'
          : 'Turn on "Long session" to raise the limit.'
      }`,
    };
  }
  if (!SESSION_SOURCES.has(body.source as SessionSource)) {
    return { error: 'Invalid session source.' };
  }
  if (!HANDOFF_TARGETS.has(body.target as HandoffTarget)) {
    return { error: 'Invalid handoff target.' };
  }
  if (!BRIEF_LENGTHS.has(body.briefLength as BriefLength)) {
    return { error: 'Invalid brief length.' };
  }

  return {
    data: {
      transcript,
      source: body.source as SessionSource,
      target: body.target as HandoffTarget,
      briefLength: body.briefLength as BriefLength,
      focus: typeof body.focus === 'string' ? body.focus.trim().slice(0, MAX_FOCUS_CHARS) : '',
    },
  };
}
