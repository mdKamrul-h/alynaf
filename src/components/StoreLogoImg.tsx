"use client";

import { useState } from "react";

interface StoreLogoImgProps {
  domain: string;
  /** Primary .com domain used for Clearbit; falls back to Google favicon then initials */
  logoDomain?: string;
  name: string;
  size?: number;
  className?: string;
}

export default function StoreLogoImg({
  domain,
  logoDomain,
  name,
  size = 48,
  className = "",
}: StoreLogoImgProps) {
  // 0 = try Clearbit, 1 = try Google favicon, 2 = show initials
  const [attempt, setAttempt] = useState(0);

  const clearbitDomain = logoDomain ?? domain;
  const sources = [
    `https://logo.clearbit.com/${clearbitDomain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];

  if (attempt >= sources.length) {
    const fontSize = Math.max(10, Math.round(size / 3.2));
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-white/10 font-bold text-white ${className}`}
        style={{ width: size, height: size, fontSize }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={attempt}
      src={sources[attempt]}
      alt={name}
      width={size}
      height={size}
      className={`rounded-xl bg-white object-contain ${className}`}
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
