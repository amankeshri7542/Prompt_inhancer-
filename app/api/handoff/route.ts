import { NextResponse } from 'next/server';
import {
  buildHandoffSystemPrompt,
  buildHandoffUserMessage,
} from '@/lib/handoff-templates';
import { parseHandoffRequest } from '@/lib/request-validation';
import { streamGeneration } from '@/lib/route-stream';
import type { BriefLength } from '@/lib/types';

export const maxDuration = 300;

/** Output ceiling per brief size, with headroom above the prose target. */
const MAX_TOKENS: Record<BriefLength, number> = {
  tight: 2_000,
  standard: 4_000,
  full: 8_000,
};

export async function POST(req: Request) {
  const parsed = parseHandoffRequest(await req.json().catch(() => null));
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { transcript, source, target, briefLength, focus } = parsed.data;

  return streamGeneration({
    label: 'handoff',
    // Long-context synthesis across a whole session — the reasoning earns its cost.
    reasoning: 'high',
    maxTokens: MAX_TOKENS[briefLength],
    // Slightly higher than prompt generation: this is synthesis, not templating.
    temperature: 0.4,
    // Deliberately no `length` — briefs have a prose target, not a hard band, and
    // truncating a handoff would drop the next-steps section off the end.
    messages: [
      {
        role: 'system',
        content: buildHandoffSystemPrompt({ source, target, briefLength, focus }),
      },
      { role: 'user', content: buildHandoffUserMessage(transcript) },
    ],
  });
}
