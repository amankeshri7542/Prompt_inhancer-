import { NextResponse } from 'next/server';
import { chatComplete, MISSING_API_KEY, MODELS } from '@/lib/ai';
import { buildQuestionsSystemPrompt } from '@/lib/prompt-templates';
import type { TaskType } from '@/lib/types';
import { isTaskType } from '@/lib/request-validation';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { prompt, taskType } = (await req.json()) as {
      prompt?: string;
      taskType?: TaskType;
    };

    const cleanPrompt = typeof prompt === 'string' ? prompt.trim() : '';
    if (!cleanPrompt || !isTaskType(taskType)) {
      return NextResponse.json({ error: 'Missing prompt or taskType' }, { status: 400 });
    }
    if (cleanPrompt.length > 12_000) {
      return NextResponse.json({ error: 'Prompt idea is too long.' }, { status: 400 });
    }

    // Not streamed: the client needs the whole JSON object before it can render
    // the question form, so there is nothing to show progressively.
    const { text, meta } = await chatComplete({
      model: MODELS.enhance,
      reasoning: 'off',
      maxTokens: 1_000,
      json: true,
      messages: [
        { role: 'system', content: buildQuestionsSystemPrompt(taskType) },
        { role: 'user', content: `Initial prompt idea:\n---\n${cleanPrompt}\n---` },
      ],
    });

    const parsed = JSON.parse(text || '{}');
    const questions: string[] = Array.isArray(parsed.questions)
      ? parsed.questions
          .filter((q: unknown): q is string => typeof q === 'string')
          .map((q: string) => q.trim())
          .filter(Boolean)
          .slice(0, 4)
      : [];

    return NextResponse.json({
      questions,
      model: meta.model,
      provider: meta.provider,
      cost: meta.usage
        ? { ...meta.usage, model: meta.model, provider: meta.provider }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === MISSING_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER is not set on the server.' },
        { status: 500 },
      );
    }
    console.error('generate-questions error:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
