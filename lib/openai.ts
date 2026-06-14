import OpenAI from 'openai';

/**
 * The model used for every enhancement. GPT-5 mini is a reasoning model:
 * it does NOT accept a custom `temperature` (only the default), and instead
 * exposes `reasoning_effort` to trade latency for depth.
 */
export const MODEL = 'gpt-5-mini';

/** Sentinel thrown when no API key is configured, so routes can surface a clear message. */
export const MISSING_API_KEY = 'MISSING_API_KEY';

let client: OpenAI | null = null;

/**
 * Lazily construct a single shared OpenAI client. Reads `OPENAI_API` first
 * (the key this project already ships with) and falls back to the SDK's
 * conventional `OPENAI_API_KEY` so either env var works.
 */
export function getOpenAI(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error(MISSING_API_KEY);
  client = new OpenAI({ apiKey });
  return client;
}
