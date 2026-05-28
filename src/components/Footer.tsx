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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)] text-[#07080E] font-black text-sm">AN</div>
              <div>
                <p className="font-bold text-white">{SITE.name}</p>
                <p className="text-[9px] uppercase tracking-widest text-[var(--muted)]">Est. {SITE.established}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {SITE.tagline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Your trusted UK-to-Bangladesh shopping service. We buy, ship, and deliver — you just choose.
            </p>
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white transition">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              @{SITE.fbHandle}
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Quick Links</p>
            <ul className="space-y-2.5 text-sm text-[var(--muted2)]">
              {[
                ["/order",          "Place an Order"],
                ["/track",          "Track Order"],
                ["/how-it-works",   "How It Works"],
                ["/stores",         "UK Stores"],
                ["/categories",     "Categories"],
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
                  <Link href="/stores" className="hover:text-white transition">{s}</Link>
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
                <a href={`https://wa.me/${SITE.whatsapp.replace("+", "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white transition">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20">
                    <svg className="h-3 w-3 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </span>
                  {SITE.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={SITE.messenger} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white transition">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0084ff]/20">
                    <svg className="h-3 w-3 text-[#0084ff]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
                    </svg>
                  </span>
                  Facebook Messenger
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {SITE.name} · {SITE.tagline} · UK to Bangladesh Shopping
      </div>
    </footer>
  );
}
