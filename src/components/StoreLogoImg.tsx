"use client";

import { useState } from "react";

interface StoreLogoImgProps {
  domain: string;
  /** Filename in /public/logos/ without extension */
  logoFile?: string;
  /** Clearbit fallback domain override */
  logoDomain?: string;
  name: string;
  size?: number;
  className?: string;
}

export default function StoreLogoImg({
  domain,
  logoFile,
  logoDomain,
  name,
  size = 48,
  className = "",
}: StoreLogoImgProps) {
  // 0 = local SVG, 1 = Clearbit, 2 = initials
  const [attempt, setAttempt] = useState(0);

  const clearbitDomain = logoDomain ?? domain;
  const sources: string[] = [
    ...(logoFile ? [`/logos/${logoFile}.svg`] : []),
    `https://logo.clearbit.com/${clearbitDomain}`,
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

  const isLocal = sources[attempt].startsWith("/");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={attempt}
      src={sources[attempt]}
      alt={name}
      width={size}
      height={size}
      className={`rounded-xl object-contain ${isLocal ? "" : "bg-white"} ${className}`}
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
