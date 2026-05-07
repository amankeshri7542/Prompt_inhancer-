import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/lib/prompt-templates';
import type { ProEnhanceRequest } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API });

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ProEnhanceRequest>;
    const { prompt, answers, targetLLM, taskType, technique, profile } = body;

    if (!prompt || !answers || !targetLLM || !taskType || !technique) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt({
      targetLLM,
      taskType,
      technique,
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    const enhancedPrompt = completion.choices[0].message.content ?? '';
    return NextResponse.json({ enhancedPrompt });
  } catch (error) {
    console.error('enhance-pro error:', error);
    return NextResponse.json({ error: 'Failed to enhance prompt' }, { status: 500 });
  }
}
