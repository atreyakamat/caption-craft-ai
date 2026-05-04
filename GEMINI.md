# CaptionCraft AI

CaptionCraft AI is a local-first AI caption generator built with Next.js. It allows users to generate engaging social media captions for various platforms and tones, using either local AI models (via Ollama) or the Gemini API as a fallback. It also features integrated OCR to extract context from images.

## Project Overview

- **Core Technology:** Next.js 15 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS 4 with a custom "glassmorphism" aesthetic.
- **AI Integration:** 
  - **Ollama:** Primary engine (local-first), specifically targeting the `qwen3.5:0.6b` model.
  - **Google Gemini:** Fallback engine (remote) using the `@google/genai` SDK.
- **OCR Engine:** Tesseract.js for extracting text from uploaded images.
- **Architecture:** 
  - **Frontend:** Single-page application logic in `app/page.tsx`.
  - **Backend:** API route for generation in `app/api/generate-caption/route.ts`.

## Building and Running

### Prerequisites
- Node.js (v20+ recommended)
- Ollama (optional, for local generation)

### Commands
- **Install Dependencies:** `npm install`
- **Development Server:** `npm run dev` (Runs on `http://localhost:3000`)
- **Build for Production:** `npm run build`
- **Start Production Server:** `npm run start`
- **Linting:** `npm run lint`

### Configuration
1. Copy `.env.example` to `.env.local`.
2. Set `GEMINI_API_KEY` if you intend to use the Gemini fallback.
3. If using Ollama, ensure it is running locally with the `qwen3.5:0.6b` model pulled (`ollama pull qwen3.5:0.6b`).

## Development Conventions

- **Component Structure:** Uses the Next.js App Router. UI components are primarily located in the `app/` directory.
- **Client Components:** Interactive parts of the UI are marked with `'use client'`.
- **API Routes:** Server-side logic for AI generation is handled in `app/api/`.
- **Styling Patterns:**
  - Uses Tailwind CSS 4.
  - Custom "glass" classes defined in `app/globals.css` for a consistent UI.
  - Utility for class merging: `cn` function in `lib/utils.ts`.
- **OCR Logic:** OCR is performed on the client-side using `tesseract.js` before sending context to the API.
- **AI Logic:** The API route implements a fallback mechanism: Ollama (local) -> Gemini (remote).

## Key Files

- `app/page.tsx`: The main user interface and client-side logic (OCR, state management).
- `app/api/generate-caption/route.ts`: The core AI orchestration logic.
- `app/globals.css`: Global styles, including Tailwind 4 directives and custom glassmorphism effects.
- `metadata.json`: Metadata for AI Studio applet configuration.
