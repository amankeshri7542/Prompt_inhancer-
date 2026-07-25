/**
 * OpenRouter client for GLM 5.2.
 *
 * This is a hand-rolled fetch wrapper rather than the `openai` SDK because every
 * request depends on three OpenRouter-only fields the SDK's types can't express
 * (`provider`, `usage.include`, `reasoning`). We only ever call chat/completions,
 * so the wrapper is smaller than the casts would be.
 */

export const MISSING_API_KEY = 'MISSING_API_KEY';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Two models, chosen per job rather than one for everything.
 *
 * HANDOFF needs the 1M context window to summarise a whole session in one pass.
 * ENHANCE is a short, latency-sensitive task where measured instruction-following
 * matters more than raw intelligence: benchmarked against the real system prompt,
 * Qwen 3.5 Flash hit both the Compact (≤150w) and Standard (300–400w) word bands
 * first try and emitted correct XML for Claude targets, in ~2s and at roughly a
 * tenth of GLM's cost. GLM 5.2 itself missed the Standard band on the same test.
 */
export const MODELS = {
  handoff: 'z-ai/glm-5.2',
  enhance: 'qwen/qwen3.5-flash-02-23',
} as const;

/** Back-compat default for callers that don't specify a model. */
export const MODEL: string = MODELS.handoff;

/**
 * Provider pin for GLM 5.2 — do not remove.
 *
 * OpenRouter auto-routing served a probe from a 96k-context provider. GLM 5.2's
 * headline 1M window is per-provider, so an unpinned request can silently land
 * somewhere that cannot hold a long session transcript. These three all serve the
 * full 1,048,576-token window at the ~$0.77/M price floor.
 */
const GLM_ROUTING = {
  only: ['baidu', 'novita', 'streamlake'],
  sort: 'price',
  data_collection: 'deny',
  require_parameters: true,
} as const;

/**
 * Everything else routes on price. No `only` pin: the enhance prompt is a few
 * thousand tokens, so no provider's context limit can truncate it.
 *
 * `data_collection: 'deny'` is on both paths — it excludes providers that may
 * retain or train on prompts, which matters because this app sends real work.
 */
const DEFAULT_ROUTING = {
  sort: 'price',
  data_collection: 'deny',
  require_parameters: true,
} as const;

function routingFor(model: string) {
  return model === MODELS.handoff ? GLM_ROUTING : DEFAULT_ROUTING;
}

/** GLM 5.2 reasons by default at `high`, which is far too slow for short calls. */
export type Reasoning = 'off' | 'high' | 'xhigh';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  /** Actual USD charged, straight from OpenRouter — not an estimate. */
  costUsd: number;
}

export interface ChatMeta {
  model: string;
  provider: string;
  usage: Usage | null;
}

export interface ChatOptions {
  messages: ChatMessage[];
  reasoning: Reasoning;
  maxTokens: number;
  /** Defaults to the handoff model; enhance routes pass MODELS.enhance. */
  model?: string;
  /** GLM 5.2 accepts temperature (gpt-5-mini did not). Low = repeatable prompts. */
  temperature?: number;
  json?: boolean;
  signal?: AbortSignal;
}

function apiKey(): string {
  const key = process.env.OPENROUTER ?? process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error(MISSING_API_KEY);
  // Tolerate a stray leading/trailing space in the env value.
  return key.trim();
}

function body(opts: ChatOptions, stream: boolean) {
  const model = opts.model ?? MODEL;
  return JSON.stringify({
    model,
    messages: opts.messages,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature ?? 0.3,
    reasoning:
      opts.reasoning === 'off' ? { enabled: false } : { effort: opts.reasoning },
    ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    provider: routingFor(model),
    usage: { include: true },
    stream,
  });
}

function headers() {
  return {
    Authorization: `Bearer ${apiKey()}`,
    'Content-Type': 'application/json',
    // Attribution in the OpenRouter dashboard.
    'HTTP-Referer': 'https://prompt-inhancer.vercel.app',
    'X-Title': 'Prompt Studio',
  };
}

function readUsage(raw: unknown): Usage | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  return {
    promptTokens: typeof u.prompt_tokens === 'number' ? u.prompt_tokens : 0,
    completionTokens: typeof u.completion_tokens === 'number' ? u.completion_tokens : 0,
    costUsd: typeof u.cost === 'number' ? u.cost : 0,
  };
}

async function failure(res: Response): Promise<never> {
  const text = await res.text().catch(() => '');
  let detail = text.slice(0, 400);
  try {
    const parsed = JSON.parse(text);
    detail = parsed?.error?.message ?? detail;
  } catch {
    // keep the raw slice
  }
  throw new Error(`OpenRouter ${res.status}: ${detail}`);
}

/** One-shot completion. Used where the whole string is needed before responding. */
export async function chatComplete(
  opts: ChatOptions,
): Promise<{ text: string; meta: ChatMeta }> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: headers(),
    body: body(opts, false),
    signal: opts.signal,
  });
  if (!res.ok) await failure(res);

  const data = await res.json();
  if (data?.error) throw new Error(data.error.message ?? 'OpenRouter returned an error.');

  return {
    text: (data?.choices?.[0]?.message?.content ?? '').trim(),
    meta: {
      model: data?.model ?? opts.model ?? MODEL,
      provider: data?.provider ?? 'unknown',
      usage: readUsage(data?.usage),
    },
  };
}

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; meta: ChatMeta };

/**
 * Streaming completion. Yields text deltas, then exactly one `done` event
 * carrying usage — OpenRouter attaches usage to the final chunk before [DONE].
 */
export async function* chatStream(opts: ChatOptions): AsyncGenerator<StreamEvent> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: headers(),
    body: body(opts, true),
    signal: opts.signal,
  });
  if (!res.ok) await failure(res);
  if (!res.body) throw new Error('OpenRouter returned no response body.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const meta: ChatMeta = { model: opts.model ?? MODEL, provider: 'unknown', usage: null };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE frames are newline-delimited; the last element may be a partial line.
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;

      let chunk: Record<string, unknown>;
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue; // OpenRouter sends `: keep-alive` comments and occasional partials
      }

      if (chunk.error) {
        const err = chunk.error as { message?: string };
        throw new Error(err.message ?? 'OpenRouter stream error.');
      }
      if (typeof chunk.model === 'string') meta.model = chunk.model;
      if (typeof chunk.provider === 'string') meta.provider = chunk.provider;
      if (chunk.usage) meta.usage = readUsage(chunk.usage);

      const choices = chunk.choices as Array<{ delta?: { content?: string } }> | undefined;
      const text = choices?.[0]?.delta?.content;
      if (text) yield { type: 'delta', text };
    }
  }

  yield { type: 'done', meta };
}
