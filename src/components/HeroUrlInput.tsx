"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "https://www.amazon.co.uk/Nike-Air-Max-90/dp/...",
  "https://www.boots.com/charlotte-tilbury/...",
  "https://www.harrods.com/gucci-bag/...",
  "https://www.asos.com/adidas/...",
];

export default function HeroUrlInput() {
  const [url, setUrl] = useState("");
  const [exIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/order?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex overflow-hidden rounded-2xl border border-[rgba(200,146,14,0.4)] bg-[#0c1022] p-1.5 shadow-xl shadow-black/40 focus-within:border-[rgba(200,146,14,0.7)] focus-within:shadow-[0_0_40px_rgba(200,146,14,0.12)] transition-all">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={EXAMPLES[exIdx]}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="btn-gold shrink-0 rounded-xl px-6 py-3 text-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Get Quote
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
        <span className="text-xs text-slate-600">Try:</span>
        {["Amazon UK", "Harrods", "ASOS", "Boots", "Nike UK"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              const domains: Record<string, string> = {
                "Amazon UK": "https://www.amazon.co.uk/",
                Harrods: "https://www.harrods.com/",
                ASOS: "https://www.asos.com/",
                Boots: "https://www.boots.com/",
                "Nike UK": "https://www.nike.com/gb/",
              };
              router.push(`/order?url=${encodeURIComponent(domains[s])}`);
            }}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-400 hover:border-[rgba(200,146,14,0.4)] hover:text-white transition"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  );
}
