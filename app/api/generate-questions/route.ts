import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildQuestionsSystemPrompt } from '@/lib/prompt-templates';
import type { TaskType } from '@/lib/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API });

export async function POST(req: Request) {
  try {
    const { prompt, taskType } = (await req.json()) as {
      prompt?: string;
      taskType?: TaskType;
    };

    if (!prompt || !taskType) {
      return NextResponse.json({ error: 'Missing prompt or taskType' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('generate-questions error:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
