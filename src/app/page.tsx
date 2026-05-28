import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroUrlInput from "@/components/HeroUrlInput";
import StoreLogoImg from "@/components/StoreLogoImg";
import { ChatButtons } from "@/components/ChatButtons";
import Link from "next/link";
import { SITE, STORES, TESTIMONIALS } from "@/lib/constants";

function Star() {
  return (
    <svg className="h-4 w-4 text-[var(--gold)]" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 overflow-hidden">

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <section className="grain relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center sm:px-6">
          {/* Glow orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold)]/[.06] blur-[120px]" />
            <div className="absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-[var(--blue)]/[.05] blur-[100px]" />
          </div>

          {/* UK → BD route indicator */}
          <div className="animate-fade-in relative mb-10 flex items-center gap-3 sm:gap-5">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl font-black text-sm text-white"
                style={{ background: "linear-gradient(135deg, #012169 50%, #C8102E 50%)", boxShadow: "0 2px 12px rgba(1,33,105,0.4)" }}>
                UK
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--muted)]">United Kingdom</span>
            </div>

            {/* Flight line */}
            <div className="relative flex items-center">
              <div className="h-px w-10 bg-gradient-to-r from-[#012169]/60 to-white/10 sm:w-16" />
              <div className="mx-2 text-[var(--muted)]">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
              <div className="h-px w-10 bg-gradient-to-r from-white/10 to-[#006A4E]/60 sm:w-16" />
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl font-black text-sm text-white"
                style={{ background: "linear-gradient(135deg, #006A4E 0%, #006A4E 60%, #F42A41 60%)", boxShadow: "0 2px 12px rgba(0,106,78,0.4)" }}>
                BD
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--muted)]">Bangladesh</span>
            </div>
          </div>

          {/* Tagline badge */}
          <div className="animate-fade-up sec-label mb-5">
            {SITE.tagline}
          </div>

          {/* Main headline */}
          <h1 className="animate-fade-up d-100 mx-auto max-w-3xl text-4xl font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
            Shop the <span className="text-gold-shimmer">UK</span>.<br />
            Delivered to Your<br />
            <span className="text-white/80">Door in Bangladesh.</span>
          </h1>

          <p className="animate-fade-up d-200 mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--muted2)] sm:text-lg">
            Paste any UK product link — Amazon, Harrods, ASOS, Nike and 100+ more stores.
            We purchase, ship, and deliver straight to you. No middlemen.
          </p>

          {/* URL input */}
          <div className="animate-fade-up d-300 mt-10 w-full max-w-2xl">
            <HeroUrlInput />
          </div>

          {/* Stats */}
          <div className="animate-fade-up d-500 mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 border-t border-[var(--border)] pt-10">
            {[
              { n: String(SITE.established), l: "Est." },
              { n: `${SITE.fbPosts}+`,       l: "FB Posts" },
              { n: `${SITE.fbFollowers}K+`,  l: "Followers" },
              { n: "24 hr",                  l: "Quote Time" },
              { n: "Insured",                l: "Shipments" },
            ].map(({ n, l }) => (
              <div key={l} className="text-center">
                <p className="text-xl font-extrabold text-white">{n}</p>
                <p className="text-xs text-[var(--muted)]">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ STORE MARQUEE ══════════════════════════════════════════════ */}
        <div className="border-y border-[var(--border)] bg-[var(--bg2)] py-3 marquee-wrap overflow-hidden">
          <div className="marquee-track animate-marquee flex">
            {[...STORES, ...STORES].map((s, i) => (
              <span key={i} className="mx-6 inline-flex shrink-0 items-center gap-2.5 text-sm text-[var(--muted)]">
                <StoreLogoImg domain={s.domain} logoDomain={s.logoDomain} name={s.name} size={20} className="h-5 w-5 rounded opacity-75" />
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* ══ DISCOVER SECTION ════════════════════════════════════════════ */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 sm:grid-cols-3">
              <Link href="/how-it-works"
                className="card group relative overflow-hidden p-6 transition-all hover:border-[var(--gold)]/30">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold-dim)]">
                  <svg className="h-5 w-5 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="mb-1 font-bold text-white group-hover:text-[var(--gold)] transition">How It Works</h3>
                <p className="text-sm text-[var(--muted2)]">4 simple steps from product link to your doorstep in Bangladesh.</p>
                <svg className="absolute bottom-5 right-5 h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <Link href="/stores"
                className="card group relative overflow-hidden p-6 transition-all hover:border-[var(--gold)]/30">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold-dim)]">
                  <svg className="h-5 w-5 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
                  </svg>
                </div>
                <h3 className="mb-1 font-bold text-white group-hover:text-[var(--gold)] transition">UK Stores</h3>
                <p className="text-sm text-[var(--muted2)]">Amazon, Harrods, ASOS, Nike, Boots and 100+ retailers — all covered.</p>
                <svg className="absolute bottom-5 right-5 h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <Link href="/categories"
                className="card group relative overflow-hidden p-6 transition-all hover:border-[var(--gold)]/30">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold-dim)]">
                  <svg className="h-5 w-5 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <h3 className="mb-1 font-bold text-white group-hover:text-[var(--gold)] transition">Categories</h3>
                <p className="text-sm text-[var(--muted2)]">Fashion, electronics, beauty, luxury, home — every category, every brand.</p>
                <svg className="absolute bottom-5 right-5 h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ═══════════════════════════════════════════════ */}
        <section className="border-t border-[var(--border)] bg-[var(--bg2)] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <div className="sec-label">Customer Reviews</div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Customers Love AlyNaf</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="card gold-border flex flex-col gap-4 p-6">
                  <div className="flex gap-1">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} />)}</div>
                  <p className="flex-1 text-sm leading-relaxed text-[var(--muted2)]">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold-dim)] text-sm font-bold text-[var(--gold)]">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-[var(--muted)]">{t.city} · {t.product}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ════════════════════════════════════════════════════════ */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <div className="sec-label">FAQ</div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Common Questions</h2>
            </div>

            <div className="space-y-2">
              {[
                {
                  q: "How long does delivery from UK to Bangladesh take?",
                  a: "Typically 2–4 weeks from the day of purchase in the UK. We'll give you regular updates via WhatsApp at every stage.",
                },
                {
                  q: "How do I pay for my order?",
                  a: "After we confirm your quote, you can pay via bKash, Nagad, Rocket, or bank transfer. Full details are shared when your quote is ready.",
                },
                {
                  q: "Can I order from any UK website?",
                  a: "Yes — almost any UK website. Amazon, Harrods, ASOS, Boots, Nike, John Lewis, Selfridges and thousands more. If you can find it in the UK, we can get it for you.",
                },
                {
                  q: "How do I track my order?",
                  a: "Every order gets a unique order number. Use the Track Order page on our site to check status, or WhatsApp us directly for live updates.",
                },
                {
                  q: "What if the product is damaged or wrong?",
                  a: "We carefully inspect and pack all items before shipping. In the rare case of an issue, we work with you directly to resolve it — refund or re-order.",
                },
                {
                  q: "What is your service fee?",
                  a: "Our fee covers personal shopping, secure packaging, UK-to-BD shipping, and customs handling. We provide a full transparent quote before you confirm — no hidden charges.",
                },
              ].map(({ q, a }) => (
                <details key={q} className="card-flat group overflow-hidden rounded-xl">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-sm font-semibold text-white hover:text-[var(--gold)] transition">
                    {q}
                    <svg className="faq-arrow h-4 w-4 shrink-0 text-[var(--muted)] group-open:text-[var(--gold)] transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--muted2)]">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FIND US ON FACEBOOK ════════════════════════════════════════ */}
        <section className="border-t border-[var(--border)] bg-[var(--bg2)] px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="card relative overflow-hidden p-7 sm:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1877F2]/[.08] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#1877F2]/[.05] blur-3xl" />

              <div className="relative flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left">
                {/* Icon */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] shadow-xl shadow-[#1877F2]/30 sm:h-20 sm:w-20">
                  <svg className="h-8 w-8 text-white sm:h-10 sm:w-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className="sec-label mb-2">Find Us on Facebook</div>
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                    Follow <span className="text-gold-shimmer">@{SITE.fbHandle}</span>
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted2)]">
                    See our latest UK product drops, customer orders, and shipment updates straight from our Facebook page.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 sm:justify-start">
                    <span className="text-sm text-white font-semibold">{SITE.fbPosts}+ <span className="font-normal text-[var(--muted)]">Posts</span></span>
                    <span className="text-sm text-white font-semibold">{SITE.fbFollowers}K+ <span className="font-normal text-[var(--muted)]">Followers</span></span>
                    <span className="text-sm text-white font-semibold">Est. {SITE.established}</span>
                  </div>
                </div>

                {/* CTA */}
                <a href={SITE.facebook} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1877F2]/30 transition hover:bg-[#1464d6]">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Follow on Facebook
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ══ READY TO ORDER CTA ══════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 py-24 text-center sm:px-6">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold)]/[.05] blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <div className="sec-label mb-5">Ready to Order?</div>
            <h2 className="mb-4 text-3xl font-black tracking-tight sm:text-5xl">
              Your Favourite UK Brands,<br />
              <span className="text-gold-shimmer">Right Here in Bangladesh.</span>
            </h2>
            <p className="mb-8 text-base text-[var(--muted2)] sm:text-lg">
              Paste a product link and get a full quote in 24 hours.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Link href="/order" className="btn-gold px-8 py-3 text-sm sm:text-base">
                Place Your Order
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
