"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/stores",       label: "Stores" },
  { href: "/categories",   label: "Categories" },
  { href: "/track",        label: "Track Order" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#070914]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold)] text-[#07080E] font-black text-sm shadow-lg shadow-[rgba(200,146,14,0.35)] group-hover:shadow-[rgba(200,146,14,0.55)] transition-shadow">
            AN
          </div>
          <div>
            <span className="block text-[15px] font-bold tracking-tight text-white leading-tight">{SITE.name}</span>
            <span className="block text-[9px] uppercase tracking-[0.22em] text-[var(--muted)] leading-tight">Attaining the Unthought</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className={`text-sm transition ${pathname === l.href ? "text-white" : "text-[var(--muted2)] hover:text-white"}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <a href={SITE.facebook} target="_blank" rel="noopener noreferrer"
            aria-label="AlyNaf on Facebook"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted2)] transition hover:text-white hover:border-white/20">
            <IconFacebook />
          </a>
          <a href={`https://wa.me/${SITE.whatsapp.replace("+", "")}`} target="_blank" rel="noopener noreferrer"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-[13px] text-[var(--muted2)] transition hover:text-white hover:border-white/20">
            WhatsApp
          </a>
          <Link href="/order" className="btn-gold rounded-full px-5 py-2 text-[13px]">
            Order Now
          </Link>
        </div>

        {/* Mobile: order + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/order" className="btn-gold rounded-full px-4 py-1.5 text-[12px]" onClick={() => setOpen(false)}>
            Order Now
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted2)]"
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-[var(--border)] bg-[#070914] px-4 pb-4 md:hidden">
          <nav className="mt-3 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  pathname === l.href
                    ? "bg-[rgba(200,146,14,0.1)] text-[var(--gold)]"
                    : "text-[var(--muted2)] hover:bg-white/5 hover:text-white"
                }`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-3">
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-[13px] text-[var(--muted2)]">
              <IconFacebook />
              Facebook
            </a>
            <a href={`https://wa.me/${SITE.whatsapp.replace("+", "")}`} target="_blank" rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-[13px] text-[var(--muted2)]">
              <IconWhatsApp />
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function IconFacebook() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
