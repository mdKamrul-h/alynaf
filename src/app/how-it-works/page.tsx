import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { ChatButtons } from "@/components/ChatButtons";
import { BkashLogo, NagadLogo, RocketLogo, BankTransferLogo } from "@/components/PaymentLogo";

const STEPS = [
  {
    n: "01",
    title: "Find Your Product",
    description:
      "Browse any UK online store — Amazon, Harrods, ASOS, Nike, Boots, John Lewis, and thousands more. Find exactly what you want and copy the product link from your browser.",
    detail: "Supports any publicly accessible UK product page. If you're unsure whether we can source it, just send us the link and we'll confirm.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Submit Your Order",
    description:
      "Paste the product link on our order form. Add your size, colour, and quantity. Fill in your delivery address in Bangladesh and choose your payment method.",
    detail: "We auto-detect the store and product name. You can add multiple items from different UK stores in a single order.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Get a Quote & Pay",
    description:
      "Within 24 hours we send you a full price breakdown — product cost, service fee, UK-to-BD shipping, and customs handling. No hidden charges.",
    detail: "Pay via bKash, Nagad, Rocket, or bank transfer once you're happy with the quote. We don't charge until you confirm.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "Receive at Your Door",
    description:
      "We purchase from the UK store, pack securely, ship internationally, handle customs, and deliver to your doorstep anywhere in Bangladesh.",
    detail: "Typical delivery: 2–4 weeks from UK purchase. We keep you updated via WhatsApp at every step — purchased, shipped, cleared customs, out for delivery.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
] as const;

const TIMELINE = [
  { label: "Day 1",    event: "You submit your order" },
  { label: "Day 1–2",  event: "We send you a full price quote" },
  { label: "Day 2–3",  event: "You confirm & pay" },
  { label: "Day 3–7",  event: "We purchase from the UK store" },
  { label: "Day 7–18", event: "International shipping to BD" },
  { label: "Day 18–28",event: "Customs clearance & local delivery" },
];

export default function HowItWorksPage() {
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
            <div className="sec-label mb-4">Simple Process</div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">How It Works</h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted2)] sm:text-lg">
              From product link to your doorstep in Bangladesh — 4 easy steps with full support at every stage.
            </p>
          </div>
        </section>

        {/* 4 Steps */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl space-y-5">
            {STEPS.map((step, i) => (
              <div key={step.n} className="card overflow-hidden">
                <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
                  {/* Step number + connector */}
                  <div className="flex shrink-0 flex-row items-center gap-4 sm:flex-col sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--gold-dim)] text-[var(--gold)]">
                      {step.icon}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="hidden h-8 w-px bg-[var(--border)] sm:block" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-mono text-[11px] font-bold tracking-widest text-[var(--gold)]">STEP {step.n}</span>
                      <h2 className="text-xl font-bold text-white">{step.title}</h2>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted2)]">{step.description}</p>
                    <p className="mt-3 rounded-xl px-4 py-3 text-[13px] leading-relaxed text-[var(--muted)]"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="border-t border-[var(--border)] bg-[var(--bg2)] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center">
              <div className="sec-label mb-3">Typical Timeline</div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">What to Expect, Day by Day</h2>
            </div>

            <div className="relative">
              <div className="absolute left-[22px] top-5 bottom-5 w-px bg-[var(--border)] sm:left-1/2 sm:-translate-x-px" />
              <div className="space-y-4">
                {TIMELINE.map((item, i) => (
                  <div key={i} className={`flex items-start gap-4 sm:gap-0 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                    <div className={`hidden sm:flex sm:w-1/2 ${i % 2 === 0 ? "justify-end pr-8" : "justify-start pl-8"}`}>
                      <div className="card-flat rounded-xl px-4 py-3 text-sm">
                        <p className="font-semibold text-white">{item.event}</p>
                        <p className="mt-0.5 text-xs text-[var(--gold)]">{item.label}</p>
                      </div>
                    </div>
                    {/* Dot */}
                    <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                      <div className="h-3 w-3 rounded-full bg-[var(--gold)] ring-4 ring-[var(--bg2)]" />
                    </div>
                    {/* Mobile card */}
                    <div className="flex-1 sm:hidden">
                      <p className="text-xs text-[var(--gold)]">{item.label}</p>
                      <p className="text-sm font-medium text-white">{item.event}</p>
                    </div>
                    <div className="hidden sm:block sm:w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Payments */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <div className="sec-label mb-3">Payment Methods</div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Pay the Way You Prefer</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { name: "bKash",         Logo: BkashLogo },
                { name: "Nagad",         Logo: NagadLogo },
                { name: "Rocket",        Logo: RocketLogo },
                { name: "Bank Transfer", Logo: BankTransferLogo },
              ].map(({ name, Logo }) => (
                <div key={name} className="card flex flex-col items-center gap-3 p-5 text-center">
                  <Logo size={48} />
                  <p className="text-sm font-semibold text-white">{name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--bg2)] px-4 py-14 text-center sm:px-6">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Ready to Place Your First Order?</h2>
            <p className="mt-3 text-sm text-[var(--muted2)]">Paste a product link and get a quote in under 24 hours. No commitment until you confirm.</p>
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
