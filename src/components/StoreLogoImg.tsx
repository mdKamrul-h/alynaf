"use client";

import { useState } from "react";

interface StoreLogoImgProps {
  domain: string;
  name: string;
  size?: number;
  className?: string;
}

export default function StoreLogoImg({
  domain,
  name,
  size = 48,
  className = "",
}: StoreLogoImgProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(10, size / 4) }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      width={size}
      height={size}
      className={`rounded-lg bg-white object-contain ${className}`}
      onError={() => setError(true)}
    />
  );
}
