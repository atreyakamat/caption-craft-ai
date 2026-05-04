'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Sparkles, Copy, CheckCircle2, RotateCcw } from 'lucide-react';
import Tesseract from 'tesseract.js';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [tone, setTone] = useState('Fun');
  const [platform, setPlatform] = useState('Instagram');
  const [useImageContext, setUseImageContext] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const cleanOCRText = (text: string) => {
    // Remove excessive newlines, bizarre characters, and normalize spaces
    return text.replace(/\n+/g, ' ').replace(/[^a-zA-Z0-9.,?!#@$%&()\s]/g, '').replace(/\s{2,}/g, ' ').trim();
  };

  const generateCaptions = async () => {
    if (!inputText.trim() && !selectedFile) {
      setError('Please provide some text context or an image.');
      return;
    }

    setIsGenerating(true);
    setResults([]);
    setError(null);

    try {
      let finalContext = inputText.trim();

      // OCR Processing
      if (selectedFile && useImageContext) {
        try {
          const worker = await Tesseract.createWorker('eng');
          const ret = await worker.recognize(selectedFile);
          const cleanedText = cleanOCRText(ret.data.text);
          if (cleanedText) {
             finalContext += `\n\n[Image Text context]: ${cleanedText}`;
          }
          await worker.terminate();
        } catch (ocrError) {
          console.warn('OCR processing failed:', ocrError);
          // Continue generating even if OCR fails
        }
      }

      if (!finalContext) {
          finalContext = "An interesting image or video to share with my audience.";
      }

      // API Call
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_context: finalContext,
          tone,
          platform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate captions');
      }

      setResults(data.captions || []);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative font-sans text-slate-200 p-4 md:p-6 max-w-[1200px] mx-auto">
      
      {/* Navbar */}
      <nav className="flex flex-col sm:flex-row justify-between items-center mb-6 min-h-[48px] px-4 py-3 sm:py-0 glass gap-4 sm:gap-0 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">C</div>
          <span className="text-xl font-bold tracking-tight">
            CaptionCraft <span className="gradient-text">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium flex-wrap justify-center">
          <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/5">
             <div className="status-dot"></div>
             <span>Ollama: qwen3.5:0.6b</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/5">
             <span>OCR Engine: Tesseract</span>
          </div>
        </div>
      </nav>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left Column */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="glass p-5 flex-1 flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Visual Context</h3>
            
            {/* Image Drop/Upload */}
            <div 
              className={`flex-1 border-2 border-dashed ${imagePreview ? 'border-indigo-500/50' : 'border-white/10'} rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer glass-hover transition-all bg-white/5 relative min-h-[160px] overflow-hidden`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 absolute inset-0" />
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-semibold bg-slate-900/80 px-3 py-1.5 rounded-full shadow-md">Change Image</span>
                  </div>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Drop image or click to scan</p>
                  <p className="text-[10px] text-slate-500">Auto-detecting text via OCR...</p>
                </>
              )}
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
            </div>
            
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Extra Details</h3>
                
                {/* OCR Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[10px] text-slate-500 font-medium">Use OCR</span>
                  <div className="relative inline-flex items-center">
                    <input type="checkbox" className="sr-only peer" checked={useImageContext} onChange={() => setUseImageContext(!useImageContext)} />
                    <div className="w-7 h-4 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-500"></div>
                  </div>
                </label>
              </div>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500/50 h-32 resize-none placeholder:text-slate-600 text-slate-200"
                placeholder="Add specific details about the vibe, people, or location..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            onClick={generateCaptions}
            disabled={isGenerating || (!inputText.trim() && !selectedFile)}
            className="h-16 bg-gradient-to-r from-indigo-600 to-sky-500 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                 <Sparkles className="w-5 h-5 spinning-glow" /> 
                 Generating...
              </div>
            ) : (
               'Generate Captions'
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Controls Bar */}
          <div className="glass p-5 lg:h-24 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 w-full">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold text-center sm:text-left">Platform</label>
                <div className="flex flex-wrap bg-black/20 p-1 rounded-lg gap-1">
                   {['Instagram', 'LinkedIn', 'WhatsApp', 'TikTok'].map(plat => (
                      <button 
                        key={plat}
                        onClick={() => setPlatform(plat)}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${platform === plat ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'}`}
                      >
                         {plat === 'WhatsApp' ? 'WhatsApp' : plat === 'TikTok' ? 'TikTok' : plat === 'Instagram' ? 'Instagram' : 'LinkedIn'}
                      </button>
                   ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold text-center sm:text-left">Tone</label>
                <div className="flex flex-wrap bg-black/20 p-1 rounded-lg gap-1">
                   {['Fun', 'Professional', 'Gen Z', 'Salesy'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${tone === t ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'}`}
                      >
                         {t}
                      </button>
                   ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Results Area */}
          <div className="grid grid-cols-1 gap-4 flex-1">
            {isGenerating && results.length === 0 && (
              <div className="glass p-6 flex flex-col items-center justify-center min-h-[300px] text-center gap-4">
                 <Sparkles className="w-8 h-8 text-indigo-400 spinning-glow" />
                 <div>
                   <p className="text-lg font-bold text-slate-200">Analyzing Context...</p>
                   <p className="text-sm text-slate-500">Drafting the perfect narrative</p>
                 </div>
              </div>
            )}

            {!isGenerating && results.length === 0 && !error && (
               <div className="glass p-6 border-dashed border-white/5 flex flex-col items-center justify-center min-h-[300px] text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                     <span className="text-2xl opacity-50">✨</span>
                  </div>
                  <p className="text-slate-400 text-sm">Your generated captions will appear here.</p>
               </div>
            )}

            {results.map((caption, i) => (
              <div key={i} className="glass glass-hover p-6 flex flex-col justify-between group relative overflow-hidden animate-[fadeIn_0.4s_ease-out_forwards]">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    onClick={() => handleCopy(caption, i)}
                    className="text-[10px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1"
                  >
                    {copiedIndex === i ? (
                       <><CheckCircle2 className="w-3 h-3 text-green-400"/> Copied</>
                    ) : (
                       <><Copy className="w-3 h-3"/> Click to Copy</>
                    )}
                  </button>
                </div>
                
                <p className="text-base leading-relaxed text-slate-100 whitespace-pre-wrap mr-24">{caption}</p>
                
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-xs font-mono text-slate-500">
                    Variation #{i + 1}
                  </span>
                  
                  {/* Visual purely decorative dots */}
                  <div className="flex gap-2">
                     <div className={`w-2 h-2 rounded-full ${i % 3 === 0 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                     <div className={`w-2 h-2 rounded-full ${i % 3 === 1 ? 'bg-sky-500' : 'bg-slate-700'}`}></div>
                     <div className={`w-2 h-2 rounded-full ${i % 3 === 2 ? 'bg-indigo-400' : 'bg-slate-700'}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
