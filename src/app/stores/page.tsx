import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StoreLogoImg from "@/components/StoreLogoImg";
import { ChatButtons } from "@/components/ChatButtons";
import Link from "next/link";
import { STORES } from "@/lib/constants";

const CATEGORY_GROUPS = [
  "Everything",
  "Department Store",
  "Luxury",
  "Luxury Fashion",
  "Fashion",
  "Sports & Fashion",
  "Beauty & Health",
  "Home & Electronics",
  "Fashion & Food",
] as const;

export default function StoresPage() {
  const grouped = CATEGORY_GROUPS.map((cat) => ({
    label: cat,
    stores: STORES.filter((s) => s.category === cat),
  })).filter((g) => g.stores.length > 0);

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
            <div className="sec-label mb-4">100+ UK Retailers</div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Shop From Any UK Store</h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted2)] sm:text-lg">
              These are our most popular — but if you can find it in the UK, we can source it. Just paste any product link.
            </p>
          </div>
        </section>

        {/* All stores grid */}
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl">

            {grouped.map((group) => (
              <div key={group.label} className="mb-12">
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">{group.label}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {group.stores.map((store) => (
                    <Link key={store.domain} href="/order"
                      className="card group flex flex-col items-center gap-3 p-5 text-center transition-all hover:border-[var(--gold)]/30">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white">
                        <StoreLogoImg
                          domain={store.domain}
                          logoDomain={store.logoDomain}
                          name={store.name}
                          size={48}
                          className="h-12 w-12 rounded-xl object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-[var(--gold)] transition">{store.name}</p>
                        <p className="mt-0.5 text-[11px] text-[var(--muted)]">{store.description}</p>
                      </div>
                      <span className="rounded-full border border-[var(--border)] bg-white/[.03] px-2.5 py-0.5 text-[10px] text-[var(--muted)]">
                        Order via AlyNaf
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Any store card */}
            <div className="mt-2 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/[.03]">
                <svg className="h-6 w-6 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">Don&apos;t see your store?</p>
              <p className="mt-1 text-sm text-[var(--muted2)]">We support virtually any UK retailer. Paste the product link on our order form and we&apos;ll confirm it within 24 hours.</p>
              <Link href="/order" className="btn-gold mt-5 inline-flex px-6 py-2.5 text-sm">
                Place an Order
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--bg2)] px-4 py-14 text-center sm:px-6">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Ready to Shop?</h2>
            <p className="mt-3 text-sm text-[var(--muted2)]">
              Copy any product URL from any UK store and paste it into our order form. We handle everything else.
            </p>
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
