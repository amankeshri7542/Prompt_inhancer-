import { NextResponse } from 'next/server';
import { getOpenAI, MODEL, MISSING_API_KEY } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/prompt-templates';
import type { ProEnhanceRequest } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ProEnhanceRequest>;
    const { prompt, answers, targetLLM, taskType, technique, length, profile } = body;

    if (!prompt || !answers || !targetLLM || !taskType || !technique || !length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt({
      targetLLM,
      taskType,
      technique,
      length,
      profile: profile ?? DEFAULT_PROFILE,
      isProFinal: true,
    });

    const answersBlock = Object.entries(answers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n\n');

    const userMessage = `INITIAL IDEA:
${prompt}

CLARIFYING ANSWERS:
${answersBlock}

Construct the perfect prompt now.`;

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      reasoning_effort: 'medium',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const enhancedPrompt = completion.choices[0].message.content ?? '';
    return NextResponse.json({ enhancedPrompt, model: completion.model });
  } catch (error) {
    if (error instanceof Error && error.message === MISSING_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured on the server.' },
        { status: 500 },
      );
    }
    console.error('enhance-pro error:', error);
    return NextResponse.json({ error: 'Failed to enhance prompt' }, { status: 500 });
  }
}
