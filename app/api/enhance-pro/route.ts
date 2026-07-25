import { NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/prompt-templates';
import { parseEnhanceRequest } from '@/lib/request-validation';
import { streamGeneration } from '@/lib/route-stream';

export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = parseEnhanceRequest(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const answers =
    body && typeof body === 'object' && 'answers' in body ? body.answers : null;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return NextResponse.json({ error: 'Clarifying answers are required.' }, { status: 400 });
  }

  const { prompt, targetLLM, taskType, technique, length, profile } = parsed.data;

  const answersBlock = Object.entries(answers as Record<string, unknown>)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .slice(0, 6)
    .map(([q, a]) => `Q: ${q.slice(0, 500)}\nA: ${a.trim().slice(0, 2_000)}`)
    .filter((entry) => !entry.endsWith('A: '))
    .join('\n\n');

  if (!answersBlock) {
    return NextResponse.json({ error: 'Answer at least one clarifying question.' }, { status: 400 });
  }

  return streamGeneration({
    label: 'enhance-pro',
    // This is the quality path — worth the reasoning latency.
    reasoning: 'high',
    maxTokens: 6_000,
    length,
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt({
          targetLLM,
          taskType,
          technique,
          length,
          profile,
          isProFinal: true,
        }),
      },
      {
        role: 'user',
        content: `INITIAL IDEA:
${prompt}

CLARIFYING ANSWERS:
${answersBlock}

Construct the perfect prompt now.`,
      },
    ],
  });
}
