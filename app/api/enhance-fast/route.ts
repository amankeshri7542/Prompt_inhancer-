import { NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/prompt-templates';
import { parseEnhanceRequest } from '@/lib/request-validation';
import { streamGeneration } from '@/lib/route-stream';

export const maxDuration = 300;

export async function POST(req: Request) {
  const parsed = parseEnhanceRequest(await req.json().catch(() => null));
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { prompt, targetLLM, taskType, technique, length, profile } = parsed.data;

  return streamGeneration({
    label: 'enhance-fast',
    // Reasoning off: this is the one-shot path, and GLM 5.2 reasons at `high`
    // by default — leaving it on makes Fast mode slower than Pro.
    reasoning: 'off',
    maxTokens: 4_000,
    length,
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt({ targetLLM, taskType, technique, length, profile }),
      },
      { role: 'user', content: prompt },
    ],
  });
}
