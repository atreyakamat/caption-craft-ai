import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { final_context, platform, tone } = await req.json();

    if (!final_context) {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 });
    }

    // Prepare Prompt
    const prompt = `You are a social media caption writer.
Generate 3–5 captions based on the context below.

Context:
${final_context}

Platform: ${platform || 'Instagram'}
Tone: ${tone || 'Fun'}

Rules:
- Keep captions short (max 20 words)
- Use simple, engaging language
- Include 2 emojis
- Include 3 relevant hashtags
- Add a clear call-to-action
- Format as a numbered list

Output:
- Structured list of captions`;

    // Try hitting local Ollama first based on project constraints
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3.5:0.6b',
          prompt: prompt,
          stream: false,
        }),
      });

      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        const text = ollamaData.response;
        return NextResponse.json({ captions: parseCaptions(text) });
      }
    } catch (err) {
      console.warn("Ollama is not available locally. Falling back to Gemini if configured.");
    }

    // Fallback to Gemini API if Ollama isn't running locally (important for the AI Studio preview environment)
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      if (response.text) {
         return NextResponse.json({ captions: parseCaptions(response.text) });
      }
    }

    return NextResponse.json({ error: 'No AI service available. Please ensure Ollama is running or GEMINI_API_KEY is set.' }, { status: 503 });

  } catch (error) {
    console.error('Caption generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseCaptions(text: string): string[] {
  // Extract numbered list items roughly
  const regex = /\d+\.\s+([^\n]+)/g;
  const matches = [...text.matchAll(regex)];
  
  if (matches.length > 0) {
    return matches.map(m => m[1].trim());
  }
  
  // Alternative fallback splitting
  return text.split('\n')
    .filter(line => line.trim().length > 10)
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^- /, '').trim());
}
