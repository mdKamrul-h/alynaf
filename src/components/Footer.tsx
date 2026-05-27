import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[#05060F]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold)] text-[#07080E] font-black text-sm">AN</div>
              <div>
                <p className="font-bold text-white">{SITE.name}</p>
                <p className="text-[9px] uppercase tracking-widest text-[var(--muted)]">Est. {SITE.established}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Your trusted UK-to-Bangladesh shopping service. We buy, ship, and deliver — you just choose.
            </p>
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white transition">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </a>
          </div>

          {/* Links */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Quick Links</p>
            <ul className="space-y-2.5 text-sm text-[var(--muted2)]">
              {[
                ["/order",         "Place an Order"],
                ["/track",         "Track Order"],
                ["/#how-it-works", "How It Works"],
                ["/#stores",       "UK Stores"],
                ["/#categories",   "Categories"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular stores */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Popular Stores</p>
            <ul className="space-y-2.5 text-sm text-[var(--muted2)]">
              {["Amazon UK", "Harrods", "ASOS", "John Lewis", "Boots", "Nike UK"].map((s) => (
                <li key={s}>
                  <Link href="/order" className="hover:text-white transition">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Contact</p>
            <ul className="space-y-3 text-sm text-[var(--muted2)]">
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-white transition break-all">{SITE.email}</a>
              </li>
              <li>
                <a href={`tel:${SITE.phone}`} className="hover:text-white transition">{SITE.phone}</a>
              </li>
              <li>
                <a href={`https://wa.me/${SITE.whatsapp.replace("+","")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white transition">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366]/20 text-[#25D366] text-xs">W</span>
                  {SITE.whatsappDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved. UK to BD Shopping Service.
      </div>
    </footer>
  );
}
