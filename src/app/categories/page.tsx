import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChatButtons } from "@/components/ChatButtons";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

/* SVG icons — one per category, in the same order as CATEGORIES */
const CATEGORY_ICONS = [
  /* Fashion & Clothing */
  <svg key="fashion" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L2 6v2h4l-1 2h10l-1-2h4V6l-4-4a3 3 0 01-8 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 8v13h12V8" />
  </svg>,

  /* Electronics & Tech */
  <svg key="electronics" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4M16 6V4M2 10h20" />
    <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
  </svg>,

  /* Beauty & Skincare */
  <svg key="beauty" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C9 2 7 4 7 7c0 2 1 3.5 2.5 4.5V18a2.5 2.5 0 005 0v-6.5C16 10.5 17 9 17 7c0-3-2-5-5-5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 11.5h5" />
  </svg>,

  /* Luxury & Designer */
  <svg key="luxury" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l3-7 3 4 3-7 3 7 3-7 3 7" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 11h18v2a8 8 0 01-16 0v-2z" />
  </svg>,

  /* Home & Living */
  <svg key="home" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>,

  /* Books & Stationery */
  <svg key="books" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>,

  /* Sports & Fitness */
  <svg key="sports" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.5l3-3 4 4 3-3 5 5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h3l1.5-3h9L18 6h3" />
    <rect x="3" y="6" width="18" height="3" rx="1" />
  </svg>,

  /* Kids & Toys */
  <svg key="kids" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
];

const ACCENT_COLORS = [
  { ring: "rgba(244,63,94,0.25)",  bg: "rgba(244,63,94,0.08)",   text: "rgb(251,113,133)" },
  { ring: "rgba(59,130,246,0.25)", bg: "rgba(59,130,246,0.08)",  text: "rgb(96,165,250)" },
  { ring: "rgba(168,85,247,0.25)", bg: "rgba(168,85,247,0.08)",  text: "rgb(192,132,252)" },
  { ring: "rgba(200,146,14,0.3)",  bg: "rgba(200,146,14,0.1)",   text: "#C8920E" },
  { ring: "rgba(16,185,129,0.25)", bg: "rgba(16,185,129,0.08)",  text: "rgb(52,211,153)" },
  { ring: "rgba(249,115,22,0.25)", bg: "rgba(249,115,22,0.08)",  text: "rgb(251,146,60)" },
  { ring: "rgba(132,204,22,0.25)", bg: "rgba(132,204,22,0.08)",  text: "rgb(163,230,53)" },
  { ring: "rgba(14,165,233,0.25)", bg: "rgba(14,165,233,0.08)",  text: "rgb(56,189,248)" },
];

export default function CategoriesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">

        {/* Header */}
        <section className="grain relative overflow-hidden px-4 py-20 text-center sm:px-6">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold)]/[.05] blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <div className="sec-label mb-4">What We Ship</div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Every Category, Every Brand</h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted2)] sm:text-lg">
              From luxury fashion to baby toys — AlyNaf sources any product from any UK store and delivers it to Bangladesh.
            </p>
          </div>
        </section>

        {/* Categories grid */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORIES.map((cat, i) => {
                const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
                const icon   = CATEGORY_ICONS[i];
                return (
                  <Link key={cat.name} href="/order"
                    className="card group relative flex flex-col gap-4 overflow-hidden p-6 transition-all hover:border-white/20"
                    style={{ borderColor: accent.ring }}>

                    {/* Icon */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ background: accent.bg, color: accent.text }}>
                      {icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1">
                      <h2 className="mb-1.5 font-bold text-white transition group-hover:text-[var(--gold)]">{cat.name}</h2>
                      <p className="text-sm leading-relaxed text-[var(--muted2)]">{cat.description}</p>
                    </div>

                    {/* Example tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {cat.examples.map((ex) => (
                        <span key={ex}
                          className="rounded-full px-2.5 py-0.5 text-[11px]"
                          style={{ background: accent.bg, color: accent.text, border: `1px solid ${accent.ring}` }}>
                          {ex}
                        </span>
                      ))}
                    </div>

                    {/* Arrow */}
                    <svg className="absolute bottom-4 right-4 h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                );
              })}
            </div>

            {/* Any category note */}
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
              <p className="text-sm font-semibold text-white">Don&apos;t see your category?</p>
              <p className="mt-1 text-sm text-[var(--muted2)]">
                We source almost anything available in the UK — just send us the product link and we&apos;ll handle the rest.
              </p>
              <Link href="/order" className="btn-gold mt-5 inline-flex px-6 py-2.5 text-sm">
                Start an Order
              </Link>
            </div>
          </div>
        </section>

        {/* Featured examples */}
        <section className="border-t border-[var(--border)] bg-[var(--bg2)] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <div className="sec-label mb-3">Popular Items</div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">What Customers Order Most</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { item: "Nike Air Max / Jordan Trainers",      store: "Nike UK / JD Sports" },
                { item: "Charlotte Tilbury Magic Cream",       store: "Boots / Selfridges" },
                { item: "Dyson Airwrap / V-series Vacuum",     store: "John Lewis / Argos" },
                { item: "ASOS Occasion Dresses",               store: "ASOS" },
                { item: "La Mer Skincare",                     store: "Harrods / Net-A-Porter" },
                { item: "Lego Sets (Architecture, Star Wars)", store: "Amazon UK / Argos" },
                { item: "Gymshark / Lululemon Activewear",     store: "Gymshark / John Lewis" },
                { item: "Gucci / LV Accessories",              store: "Selfridges / Farfetch" },
                { item: "Apple AirPods / MacBook",             store: "Amazon UK / John Lewis" },
              ].map(({ item, store }) => (
                <Link key={item} href="/order"
                  className="card-flat group flex items-start gap-3 rounded-xl p-4 transition-all hover:border-[var(--gold)]/30">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)] opacity-60" />
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[var(--gold)] transition">{item}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">{store}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-14 text-center sm:px-6">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Seen Something You Want?</h2>
            <p className="mt-3 text-sm text-[var(--muted2)]">Paste the UK product link into our order form and get a full quote within 24 hours.</p>
            <div className="mt-7 flex flex-col items-center gap-4">
              <Link href="/order" className="btn-gold px-7 py-3 text-sm">
                Place an Order
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <ChatButtons size="sm" />
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
