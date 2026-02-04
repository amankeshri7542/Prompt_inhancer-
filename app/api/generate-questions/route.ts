import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert prompt engineer. The user wants a highly detailed and optimized prompt. To achieve this, you need to ask 3-4 clarifying questions to better understand their specific needs, context, format preference, and audience. Return the questions as a JSON array of strings, e.g., [\"Question 1\", \"Question 2\"]."
        },
        {
          role: "user",
          content: `Here is my initial prompt idea: "${prompt}". What questions should I answer to make this prompt perfect?`
        }
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    let questions = [];

    if (responseContent) {
        const parsed = JSON.parse(responseContent);
        // Handle different possible JSON structures if the model varies, but instruct for array
        if (Array.isArray(parsed.questions)) {
            questions = parsed.questions;
        } else {
             // Fallback if the model returns just keys or a different structure, though json_object + prompt usually works
             // For safety, let's assume it might wrap it or return a direct list if we prompt hard enough. 
             // Let's rely on theparsed object having a key meant for questions.
             questions = Object.values(parsed).flat().filter(q => typeof q === 'string');
        }
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
