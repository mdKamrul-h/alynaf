import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroUrlInput from "@/components/HeroUrlInput";
import StoreLogoImg from "@/components/StoreLogoImg";
import Link from "next/link";
import { SITE, STORES, CATEGORIES, HOW_IT_WORKS, TESTIMONIALS } from "@/lib/constants";

/* ─────────────────── Small reusable atoms ─────────────────────── */
function Star() {
  return (
    <svg className="h-4 w-4 text-[var(--gold)]" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function Check({ green }: { green?: boolean }) {
  return green
    ? <span className="cmp-yes font-bold">✓</span>
    : <span className="cmp-no font-bold">✗</span>;
}

/* ─────────────────── Page ─────────────────────────────────────── */
export default function HomePage() {
  const featured = STORES.filter((s) => s.featured);

  return (
    <>
      <Navbar />
      <main className="flex-1 overflow-hidden">

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <section className="grain relative flex min-h-[94vh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center sm:px-6">
          {/* Background glow orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold)]/[.06] blur-[120px]" />
            <div className="absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-[var(--blue)]/[.05] blur-[100px]" />
          </div>

          {/* Route flag line */}
          <div className="animate-fade-in relative mb-10 flex items-center gap-4">
            <span className="flex flex-col items-center gap-1">
              <span className="text-3xl">🇬🇧</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">UK</span>
            </span>
            <div className="relative h-px w-28 sm:w-44">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--gold)]/60 via-white/20 to-[#006A4E]/60" />
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-base animate-float">✈️</div>
            </div>
            <span className="flex flex-col items-center gap-1">
              <span className="text-3xl">🇧🇩</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">BD</span>
            </span>
          </div>

          {/* Badge */}
          <div className="animate-fade-up sec-label mb-6">
            Trusted UK → Bangladesh Shopping since {SITE.established}
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up d-100 mx-auto max-w-3xl text-5xl font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
            Shop the <span className="text-gold-shimmer">UK</span>.<br />
            We Deliver to<br />
            <span className="text-white/80">Your Door in BD.</span>
          </h1>

          <p className="animate-fade-up d-200 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted2)]">
            Paste any UK product link — Amazon, Harrods, ASOS, Nike and 100+ more.
            We purchase, ship, and deliver straight to Bangladesh. No middlemen.
          </p>

          {/* URL Input */}
          <div className="animate-fade-up d-300 mt-10 w-full max-w-2xl">
            <HeroUrlInput />
          </div>

          {/* Stats row */}
          <div className="animate-fade-up d-500 mt-14 flex flex-wrap justify-center gap-x-10 gap-y-4 border-t border-[var(--border)] pt-10">
            {[
              { n: String(SITE.established),                  l: "Established" },
              { n: `${SITE.fbPosts}+`,                        l: "FB Posts" },
              { n: `${SITE.fbFollowers}`,                     l: "FB Followers" },
              { n: "24 hr",                                   l: "Quote Time" },
              { n: "Insured",                                 l: "Shipments" },
            ].map(({ n, l }) => (
              <div key={l} className="text-center">
                <p className="text-xl font-extrabold text-white">{n}</p>
                <p className="text-xs text-[var(--muted)]">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ MARQUEE ════════════════════════════════════════════ */}
        <div className="border-y border-[var(--border)] bg-[var(--bg2)] py-4 marquee-wrap">
          <div className="marquee-track animate-marquee">
            {[...STORES, ...STORES].map((s, i) => (
              <span key={i} className="mx-8 inline-flex items-center gap-3 text-sm text-[var(--muted)]">
                <StoreLogoImg domain={s.domain} name={s.name} size={20} className="h-5 w-5 rounded opacity-70" />
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
        <section id="how-it-works" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <div className="sec-label">Simple Process</div>
              <h2 className="text-4xl font-black tracking-tight">How It Works</h2>
              <p className="mt-3 text-[var(--muted2)]">From product link to your doorstep — 4 easy steps</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="card gold-border relative p-6">
                  <div className="mb-5 flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--gold-dim)] text-[var(--gold)] font-black text-lg">
                      {step.step}
                    </span>
                    <span className="text-6xl font-black text-white/[.04] select-none leading-none">{step.step}</span>
                  </div>
                  <h3 className="mb-2 font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted2)]">{step.description}</p>
                  {i < 3 && (
                    <div className="absolute -right-2.5 top-8 hidden text-[var(--muted)] lg:block">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ STORES ═════════════════════════════════════════════ */}
        <section id="stores" className="border-t border-[var(--border)] bg-[var(--bg2)] px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <div className="sec-label">100+ UK Retailers</div>
              <h2 className="text-4xl font-black tracking-tight">Shop From Any UK Store</h2>
              <p className="mt-3 text-[var(--muted2)]">These are just the most popular — if you can find it in the UK, we can get it for you</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {STORES.map((store) => (
                <Link key={store.domain} href="/order"
                  className="card group flex flex-col items-center gap-3 p-5 text-center">
                  <StoreLogoImg domain={store.domain} name={store.name} size={52}
                    className="h-13 w-13 rounded-xl border border-white/10 bg-white object-contain" />
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-[var(--gold)] transition">{store.name}</p>
                    <p className="text-[11px] text-[var(--muted)]">{store.category}</p>
                  </div>
                </Link>
              ))}

              {/* "Any store" placeholder */}
              <Link href="/order"
                className="card flex flex-col items-center justify-center gap-2 border-dashed p-5 text-center">
                <span className="text-3xl">🌐</span>
                <p className="text-sm font-semibold text-[var(--muted2)]">Any UK Store</p>
                <p className="text-[11px] text-[var(--muted)]">Just send us the link</p>
              </Link>
            </div>
          </div>
        </section>

        {/* ══ CATEGORIES ════════════════════════════════════════ */}
        <section id="categories" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <div className="sec-label">What We Ship</div>
              <h2 className="text-4xl font-black tracking-tight">Every Category, Every Brand</h2>
              <p className="mt-3 text-[var(--muted2)]">From luxury fashion to baby toys — we handle it all</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {CATEGORIES.map((cat) => (
                <Link key={cat.name} href="/order"
                  className={`card group relative overflow-hidden bg-gradient-to-br ${cat.color} p-6 border-[var(--border)]`}>
                  <div className="mb-3 text-4xl">{cat.emoji}</div>
                  <h3 className="mb-1 font-bold leading-snug text-white group-hover:text-[var(--gold)] transition">{cat.name}</h3>
                  <p className="text-xs text-[var(--muted2)] leading-relaxed">{cat.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {cat.examples.map((ex) => (
                      <span key={ex} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[var(--muted2)]">{ex}</span>
                    ))}
                  </div>
                  <svg className="absolute bottom-4 right-4 h-4 w-4 text-[var(--muted)] group-hover:text-[var(--gold)] transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══ WHY ALYNAF vs PEER-TO-PEER ════════════════════════ */}
        <section className="border-t border-[var(--border)] bg-[var(--bg2)] px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <div className="sec-label">Why Choose Us</div>
              <h2 className="text-4xl font-black tracking-tight">The Safer, Smarter Way to Shop the UK</h2>
              <p className="mt-3 text-[var(--muted2)]">Unlike peer-to-peer platforms that rely on strangers, AlyNaf is a professional managed service</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="cmp-cell w-1/3 text-left font-semibold text-[var(--muted2)]">Feature</th>
                    <th className="cmp-cell w-1/3 text-center">
                      <span className="inline-flex items-center gap-2 font-bold text-[var(--gold)]">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--gold)] text-[#07080E] text-[10px] font-black">AN</span>
                        AlyNaf
                      </span>
                    </th>
                    <th className="cmp-cell w-1/3 text-center text-[var(--muted2)] font-semibold">Peer-to-Peer Platforms</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Professional team handles your order",  true,  false],
                    ["No reliance on random strangers",        true,  false],
                    ["Direct purchase from official stores",   true,  false],
                    ["Guaranteed authentic products",          true,  false],
                    ["Real-time order tracking",               true,  false],
                    ["Fixed, transparent pricing",             true,  false],
                    ["Pay via bKash / Nagad / Bank",           true,  false],
                    ["Dedicated WhatsApp support",             true,  false],
                  ].map(([label, us, them], i) => (
                    <tr key={i} className={`${i % 2 === 0 ? "bg-white/[.015]" : ""}`}>
                      <td className="cmp-cell text-[var(--muted2)]">{label as string}</td>
                      <td className="cmp-cell text-center"><Check green={us as boolean} /></td>
                      <td className="cmp-cell text-center"><Check green={them as boolean} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-center">
              <Link href="/order" className="btn-gold">
                Start Shopping with AlyNaf
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══════════════════════════════════════ */}
        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <div className="sec-label">Reviews</div>
              <h2 className="text-4xl font-black tracking-tight">Customers Love AlyNaf</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
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

        {/* ══ FAQ ═══════════════════════════════════════════════ */}
        <section className="border-t border-[var(--border)] bg-[var(--bg2)] px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-14 text-center">
              <div className="sec-label">FAQ</div>
              <h2 className="text-4xl font-black tracking-tight">Common Questions</h2>
            </div>

            <div className="space-y-3">
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
                <details key={q}
                  className="card-flat group overflow-hidden rounded-xl">
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

        {/* ══ FACEBOOK ═══════════════════════════════════════════ */}
        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="card relative overflow-hidden p-8 sm:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1877F2]/[.08] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#1877F2]/[.05] blur-3xl" />

              <div className="relative grid items-center gap-10 sm:grid-cols-[auto_1fr_auto]">
                {/* Avatar/icon */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] shadow-xl shadow-[#1877F2]/30">
                  <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>

                {/* Text + stats */}
                <div className="text-center sm:text-left">
                  <div className="sec-label mb-3">Find Us on Facebook</div>
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                    Follow <span className="text-gold-shimmer">@{SITE.fbHandle}</span>
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted2)]">
                    See our latest UK product drops, customer orders, and shipment updates straight from our Facebook page.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 sm:justify-start">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-white">{SITE.fbPosts}</span>
                      <span className="text-xs text-[var(--muted)]">Posts</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-white">{SITE.fbFollowers}</span>
                      <span className="text-xs text-[var(--muted)]">Followers</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-white">Est. {SITE.established}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <a href={SITE.facebook}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#1877F2] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1877F2]/30 transition hover:bg-[#1464d6]">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Follow on Facebook
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA ══════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 py-28 text-center sm:px-6">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold)]/[.05] blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <div className="sec-label mb-6">Ready to Order?</div>
            <h2 className="mb-5 text-4xl font-black tracking-tight sm:text-5xl">
              Your Favourite UK Brands,<br />
              <span className="text-gold-shimmer">Right Here in Bangladesh.</span>
            </h2>
            <p className="mb-10 text-lg text-[var(--muted2)]">
              Paste a product link and get a full quote in 24 hours.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/order" className="btn-gold text-base px-10 py-4">
                Place Your Order
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a href={`https://wa.me/${SITE.whatsapp.replace("+","")}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-outline text-base">
                <svg className="h-5 w-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
