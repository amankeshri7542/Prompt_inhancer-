import { NextResponse } from 'next/server';
import { getOpenAI, MODEL, MISSING_API_KEY } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/prompt-templates';
import { enforcePromptLength } from '@/lib/prompt-output';
import { parseEnhanceRequest } from '@/lib/request-validation';

export async function POST(req: Request) {
  try {
    const parsed = parseEnhanceRequest(await req.json());
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { prompt, targetLLM, taskType, technique, length, profile } = parsed.data;

    const systemPrompt = buildSystemPrompt({
      targetLLM,
      taskType,
      technique,
      length,
      profile,
    });

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      reasoning_effort: 'low',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    const enhancedPrompt = await enforcePromptLength({
      openai,
      prompt: completion.choices[0]?.message.content ?? '',
      length,
    });
    if (!enhancedPrompt) {
      return NextResponse.json({ error: 'The model returned an empty prompt. Please retry.' }, { status: 502 });
    }
    return NextResponse.json({ enhancedPrompt, model: completion.model });
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
