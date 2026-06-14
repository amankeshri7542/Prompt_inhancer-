import { NextResponse } from 'next/server';
import { getOpenAI, MODEL, MISSING_API_KEY } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/prompt-templates';
import { enforcePromptLength } from '@/lib/prompt-output';
import { parseEnhanceRequest } from '@/lib/request-validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
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

    const systemPrompt = buildSystemPrompt({
      targetLLM,
      taskType,
      technique,
      length,
      profile,
      isProFinal: true,
    });

    const answersBlock = Object.entries(answers as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .slice(0, 6)
      .map(([q, a]) => `Q: ${q.slice(0, 500)}\nA: ${a.trim().slice(0, 2_000)}`)
      .filter((entry) => !entry.endsWith('A: '))
      .join('\n\n');
    if (!answersBlock) {
      return NextResponse.json({ error: 'Answer at least one clarifying question.' }, { status: 400 });
    }

    const userMessage = `INITIAL IDEA:
${prompt}

CLARIFYING ANSWERS:
${answersBlock}

Construct the perfect prompt now.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      reasoning_effort: 'medium',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
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
    console.error('enhance-pro error:', error);
    return NextResponse.json({ error: 'Failed to enhance prompt' }, { status: 500 });
  }
}
