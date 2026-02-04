import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/utils/rate-limit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API,
});

export async function POST(req: Request) {
  try {
    const { allowed, cookieName, newValue, limit } = await checkRateLimit('fast');

    if (!allowed) {
      return NextResponse.json(
        { error: `Daily limit of ${limit} reached for Fast Mode.` },
        { status: 429 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert prompt engineer. Your goal is to rewrite the user's prompt to be clear, specific, and optimized for LLMs. Maintain the original intent but add necessary constraints, context, and formatting to ensure the best possible output from an AI. Return ONLY the enhanced prompt."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const enhancedPrompt = completion.choices[0].message.content;

    const response = NextResponse.json({ enhancedPrompt });
    response.cookies.set(cookieName, newValue, { 
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json({ error: 'Failed to enhance prompt' }, { status: 500 });
  }
}
