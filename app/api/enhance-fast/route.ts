import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/lib/prompt-templates';
import type { EnhanceRequest } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API });

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<EnhanceRequest>;
    const { prompt, targetLLM, taskType, technique, profile } = body;

    if (!prompt || !targetLLM || !taskType || !technique) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt({
      targetLLM,
      taskType,
      technique,
      profile: profile ?? DEFAULT_PROFILE,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    const enhancedPrompt = completion.choices[0].message.content ?? '';
    return NextResponse.json({ enhancedPrompt });
  } catch (error) {
    console.error('enhance-fast error:', error);
    return NextResponse.json({ error: 'Failed to enhance prompt' }, { status: 500 });
  }
}
