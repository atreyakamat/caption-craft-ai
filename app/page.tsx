'use client';

import React, { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, Sparkles, Copy, CheckCircle2, RefreshCw } from 'lucide-react';
import Tesseract from 'tesseract.js';

type GenerationState = 'idle' | 'loading' | 'error' | 'success';

const PLATFORM_OPTIONS = ['Instagram', 'LinkedIn', 'WhatsApp', 'TikTok'];
const TONE_OPTIONS = ['Fun', 'Professional', 'Gen Z', 'Salesy'];

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tone, setTone] = useState('Fun');
  const [platform, setPlatform] = useState('Instagram');
  const [useImageContext, setUseImageContext] = useState(true);
  const [results, setResults] = useState<string[]>([]);
  const [state, setState] = useState<GenerationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canGenerate = useMemo(() => {
    return Boolean(inputText.trim() || selectedFile);
  }, [inputText, selectedFile]);

  const setFile = (file: File) => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setFile(file);
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setError('Copy failed. Please copy manually.');
      setState('error');
    }
  };

  const cleanOCRText = (text: string) => {
    return text.replace(/\n+/g, ' ').replace(/[^\w\s₹.,!?]/g, '').replace(/\s{2,}/g, ' ').trim();
  };

  const resetError = () => {
    setError(null);
    setState(results.length > 0 ? 'success' : 'idle');
  };

  const generateCaptions = async () => {
    if (!canGenerate) {
      setError('Please add text or an image to continue.');
      setState('error');
      return;
    }

    setState('loading');
    setResults([]);
    setError(null);

    try {
      let finalContext = inputText.trim();

      if (selectedFile && useImageContext) {
        try {
          const worker = await Tesseract.createWorker('eng');
          const ocrResult = await worker.recognize(selectedFile);
          const cleaned = cleanOCRText(ocrResult.data.text);
          if (cleaned) {
            finalContext = [finalContext, `Extracted image text: ${cleaned}`].filter(Boolean).join('\n\n');
          }
          await worker.terminate();
        } catch {
          finalContext = finalContext || 'No additional OCR context detected.';
        }
      }

      if (!finalContext) {
        finalContext = 'A social media post that needs engaging caption ideas.';
      }

      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: finalContext,
          final_context: finalContext,
          tone,
          platform,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate captions');
      }

      const captions: string[] = Array.isArray(data.captions) ? data.captions : [];
      if (captions.length === 0) {
        throw new Error('No captions returned by the model.');
      }

      setResults(captions.slice(0, 3));
      setState('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setState('error');
    }
  };

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
        <nav className="glass sticky top-3 z-20 flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">C</div>
            <span className="text-lg font-bold text-slate-100 sm:text-xl">
              CaptionCraft <span className="gradient-text">AI</span>
            </span>
          </div>
          <button
            type="button"
            className="h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition-all duration-200 ease-in-out hover:border-indigo-300/60 hover:bg-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Upgrade
          </button>
        </nav>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="glass flex flex-col gap-4 p-5 lg:col-span-5">
            <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">Generate captions fast</h1>
            <p className="text-sm text-slate-300">Add text, optionally scan an image, choose tone + platform, and generate in seconds.</p>

            <div
              className={`relative min-h-[180px] cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-4 transition-all duration-200 ease-in-out ${
                imagePreview ? 'border-indigo-400/60 bg-white/10' : 'border-white/25 bg-white/5 hover:border-indigo-300/60'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Upload image"
            >
              {imagePreview ? (
                <>
                  <Image src={imagePreview} alt="Uploaded preview" fill className="object-cover opacity-85" unoptimized />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 text-xs font-semibold text-white">
                    Click or drop to replace image
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <UploadCloud className="h-8 w-8 text-indigo-300" />
                  <p className="text-sm font-semibold text-slate-100">Drop image here or click to upload</p>
                  <p className="text-xs text-slate-400">OCR will extract text context when enabled.</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <textarea
              className="min-h-[120px] w-full resize-y rounded-2xl border border-white/20 bg-white/5 p-3 text-sm leading-6 text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              placeholder="Describe your post, product, launch, or mood..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </section>

          <section className="flex flex-col gap-6 lg:col-span-7">
            <div className="glass grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Tone
                <select
                  className="h-11 rounded-xl border border-white/20 bg-slate-950/40 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  {TONE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Platform
                <select
                  className="h-11 rounded-xl border border-white/20 bg-slate-950/40 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  {PLATFORM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2 flex h-11 items-center justify-between rounded-xl border border-white/20 bg-white/5 px-3 text-sm text-slate-200">
                Use image context
                <input
                  type="checkbox"
                  checked={useImageContext}
                  onChange={() => setUseImageContext((v) => !v)}
                  className="h-5 w-5 accent-indigo-500"
                />
              </label>
            </div>

            <div className="flex flex-col items-stretch gap-3 md:items-center">
              <button
                type="button"
                onClick={generateCaptions}
                disabled={state === 'loading' || !canGenerate}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 text-base font-semibold text-white shadow-[0_8px_32px_rgba(99,102,241,0.4)] transition-all duration-200 ease-in-out hover:from-indigo-500 hover:to-indigo-400 hover:shadow-[0_10px_36px_rgba(99,102,241,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                {state === 'loading' ? (
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse" /> Generating captions...
                  </span>
                ) : (
                  'Generate Captions'
                )}
              </button>

              {state === 'error' && error && (
                <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={resetError}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-300/40 px-3 font-medium transition-all duration-200 ease-in-out hover:bg-red-400/20"
                  >
                    <RefreshCw className="h-4 w-4" /> Retry
                  </button>
                </div>
              )}
            </div>

            <section className="glass min-h-[260px] p-5">
              {state === 'loading' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-300">Generating captions...</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-36 animate-pulse rounded-2xl border border-white/20 bg-white/8 p-4">
                        <div className="h-3 w-3/4 rounded bg-white/20" />
                        <div className="mt-3 h-3 w-full rounded bg-white/15" />
                        <div className="mt-2 h-3 w-5/6 rounded bg-white/15" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state !== 'loading' && results.length === 0 && (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
                  <div className="text-3xl">✨</div>
                  <p className="text-sm font-medium text-slate-200">Your captions will appear here</p>
                  <p className="text-xs text-slate-400">Tip: add product details or upload poster text for better results.</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {results.map((caption, index) => (
                    <article
                      key={`${caption}-${index}`}
                      className="relative flex min-h-[180px] flex-col justify-between rounded-2xl border border-white/20 bg-white/8 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.24)]"
                    >
                      <p className="pr-2 text-sm leading-6 text-slate-100">{caption}</p>
                      <div className="mt-4 flex items-end justify-between">
                        <span className="text-xs text-slate-400">Caption {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(caption, index)}
                          className="inline-flex h-10 items-center gap-1 rounded-lg border border-indigo-300/40 bg-indigo-500/20 px-3 text-xs font-semibold text-indigo-100 transition-all duration-200 ease-in-out hover:bg-indigo-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                        >
                          {copiedIndex === index ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
