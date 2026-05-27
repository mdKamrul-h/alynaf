import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function Navbar() {
  const links = [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#stores",       label: "Stores" },
    { href: "/#categories",   label: "Categories" },
    { href: "/track",         label: "Track Order" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#070914]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold)] text-[#07080E] font-black text-sm shadow-lg shadow-[rgba(200,146,14,0.4)] group-hover:shadow-[rgba(200,146,14,0.6)] transition-shadow">
            AN
          </div>
          <div>
            <span className="block text-[15px] font-bold tracking-tight text-white leading-tight">{SITE.name}</span>
            <span className="block text-[9px] uppercase tracking-[0.22em] text-[var(--muted)] leading-tight">UK → BD</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className="text-sm text-[var(--muted2)] transition hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={SITE.facebook}
            target="_blank" rel="noopener noreferrer"
            aria-label="AlyNaf on Facebook"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted2)] transition hover:text-white hover:border-white/20">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href={`https://wa.me/${SITE.whatsapp.replace("+","")}`}
            target="_blank" rel="noopener noreferrer"
            className="hidden rounded-full border border-[var(--border)] px-4 py-2 text-[13px] text-[var(--muted2)] transition hover:text-white hover:border-white/20 sm:block">
            WhatsApp
          </a>
          <Link href="/order" className="btn-gold rounded-full px-5 py-2 text-[13px]">
            Order Now
          </Link>
        </div>
      </div>

      {/* Mobile strip */}
      <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-4 py-1.5 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className="shrink-0 rounded-full px-3 py-1 text-xs text-[var(--muted2)] hover:bg-white/5 hover:text-white transition">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
