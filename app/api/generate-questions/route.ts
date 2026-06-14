import { NextResponse } from 'next/server';
import { getOpenAI, MODEL, MISSING_API_KEY } from '@/lib/openai';
import { buildQuestionsSystemPrompt } from '@/lib/prompt-templates';
import type { TaskType } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { prompt, taskType } = (await req.json()) as {
      prompt?: string;
      taskType?: TaskType;
    };

    if (!prompt || !taskType) {
      return NextResponse.json({ error: 'Missing prompt or taskType' }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildQuestionsSystemPrompt(taskType) },
        { role: 'user', content: `Initial prompt idea: "${prompt}"` },
      ],
    });

    const raw = completion.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw);
    const questions: string[] = Array.isArray(parsed.questions)
      ? parsed.questions.filter((q: unknown) => typeof q === 'string')
      : [];

    return NextResponse.json({ questions, model: completion.model });
  } catch (error) {
    if (error instanceof Error && error.message === MISSING_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured on the server.' },
        { status: 500 },
      );
    }
    console.error('generate-questions error:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
