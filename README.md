# CaptionCraft AI

CaptionCraft AI is a local-first social caption generator built with Next.js. It uses Ollama (`qwen3.5:0.6b`) for fast offline generation, with Gemini as fallback, and optional OCR context extraction with Tesseract.

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4 + glassmorphism UI
- Local AI: Ollama (`qwen3.5:0.6b`)
- Fallback AI: Gemini (`@google/genai`)
- OCR: `tesseract.js`

## Features

- Fast caption generation (3 structured outputs)
- Text + optional image OCR context
- Tone + platform controls
- Responsive output cards (1/2/3 columns by viewport)
- Copy-to-clipboard feedback
- Local-first architecture with graceful fallback

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
3. (Optional fallback) Set `GEMINI_API_KEY` in `.env.local`.
4. (Recommended local-first) Start Ollama and pull model:
   ```bash
   ollama pull qwen3.5:0.6b
   ollama serve
   ```
5. Start app:
   ```bash
   npm run dev
   ```

## Commands

- `npm run dev` — Run development server
- `npm run build` — Build production app
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## API

`POST /api/generate-caption`

Request:

```json
{
  "text": "Mango dessert launch",
  "platform": "Instagram",
  "tone": "Fun"
}
```

Response:

```json
{
  "captions": [
    "🥭 ...",
    "✨ ...",
    "🔥 ..."
  ]
}
```

## Core Files

- `/home/runner/work/caption-craft-ai/caption-craft-ai/app/page.tsx`
- `/home/runner/work/caption-craft-ai/caption-craft-ai/app/api/generate-caption/route.ts`
- `/home/runner/work/caption-craft-ai/caption-craft-ai/app/globals.css`
