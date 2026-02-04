import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/utils/rate-limit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API,
});

export async function POST(req: Request) {
  try {
    const { allowed, cookieName, newValue, limit } = await checkRateLimit('pro');

    if (!allowed) {
      return NextResponse.json(
        { error: `Daily limit of ${limit} reached for Pro Mode.` },
        { status: 429 }
      );
    }

    const { prompt, answers } = await req.json(); // answers is expected to be an object or array of {question, answer}

    if (!prompt || !answers) {
      return NextResponse.json({ error: 'Prompt and answers are required' }, { status: 400 });
    }

    const answersContext = typeof answers === 'string' ? answers : JSON.stringify(answers, null, 2);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert prompt engineer. Construct a comprehensive, high-quality prompt based on the user's initial idea and their answers to clarifying questions. The final prompt should be structure, detailed, and ready to paste into an LLM. Return ONLY the enhanced prompt."
        },
        {
          role: "user",
          content: `Initial Idea: "${prompt}"\n\nClarifying Info:\n${answersContext}\n\nCreate the perfect prompt.`
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
    console.error('Error enhancing pro prompt:', error);
    return NextResponse.json({ error: 'Failed to enhance prompt' }, { status: 500 });
  }
}
