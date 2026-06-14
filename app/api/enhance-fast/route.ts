import { NextResponse } from 'next/server';
import { getOpenAI, MODEL, MISSING_API_KEY } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/prompt-templates';
import type { EnhanceRequest } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<EnhanceRequest>;
    const { prompt, targetLLM, taskType, technique, length, profile } = body;

    if (!prompt || !targetLLM || !taskType || !technique || !length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt({
      targetLLM,
      taskType,
      technique,
      length,
      profile: profile ?? DEFAULT_PROFILE,
    });

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      reasoning_effort: 'low',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    const enhancedPrompt = completion.choices[0].message.content ?? '';
    return NextResponse.json({ enhancedPrompt });
  } catch (error) {
    if (error instanceof Error && error.message === MISSING_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured on the server.' },
        { status: 500 },
      );
    }
    console.error('enhance-fast error:', error);
    return NextResponse.json({ error: 'Failed to enhance prompt' }, { status: 500 });
  }
}
