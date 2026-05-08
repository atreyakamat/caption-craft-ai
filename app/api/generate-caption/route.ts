import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { cleanContext } from '@/lib/context';

type GenerateCaptionBody = {
  text?: string;
  final_context?: string;
  platform?: string;
  tone?: string;
};

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'qwen3.5:0.6b';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateCaptionBody;
    const platform = (body.platform || 'Instagram').trim();
    const tone = (body.tone || 'Fun').trim();
    const rawContext = (body.text || body.final_context || '').trim();

    if (!rawContext) {
      return NextResponse.json({ error: 'Context is required.' }, { status: 400 });
    }

    const context = cleanContext(rawContext);
    const prompt = buildPrompt({ context, platform, tone });

    const localText = await generateWithOllama(prompt);
    if (localText) {
      return NextResponse.json({ captions: parseCaptions(localText) });
    }

    const remoteText = await generateWithGemini(prompt);
    if (remoteText) {
      return NextResponse.json({ captions: parseCaptions(remoteText) });
    }

    return NextResponse.json(
      { error: 'No AI service available. Start Ollama or configure GEMINI_API_KEY.' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Caption generation error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}


function buildPrompt({ context, platform, tone }: { context: string; platform: string; tone: string }): string {
  return `You are a social media caption writer.

Write exactly 3 distinct captions.

Context:
${context}

Platform: ${platform}
Tone: ${tone}
Variation styles:
1) quirky
2) premium
3) emotional

Rules:
- Keep each caption within 20 words
- Use simple language
- Include 2 emojis
- Include 3 relevant hashtags
- Include a clear CTA
- Return only this numbered format:
1. <caption>
2. <caption>
3. <caption>`;
}

async function generateWithOllama(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { response?: string };
    return data.response?.trim() || null;
  } catch {
    return null;
  }
}

async function generateWithGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || null;
  } catch {
    return null;
  }
}

function parseCaptions(output: string): string[] {
  const numbered = [...output.matchAll(/^\s*\d+[.)-]?\s+(.+)$/gm)]
    .map((m) => m[1].trim())
    .filter(Boolean);

  const cleaned = (numbered.length > 0 ? numbered : output.split('\n'))
    .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, '').trim())
    .filter((line) => line.length > 0);

  const unique = Array.from(new Set(cleaned));
  return unique.slice(0, 3);
}
