"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { OrderItem } from "@/lib/types";
import type { ProductPreview } from "@/lib/product-preview";
import { PAYMENT_METHODS } from "@/lib/constants";
import ProductPreviewCard from "./ProductPreviewCard";
import VariantSelector, { serializeVariants } from "./VariantSelector";

const emptyItem = (): OrderItem => ({
  productUrl: "",
  productName: "",
  quantity: 1,
  variantNotes: "",
});

interface ItemPreviewState {
  loading: boolean;
  error: string | null;
  preview: ProductPreview | null;
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const INPUT_CLS = "inp";

export default function OrderForm({ prefillUrl }: { prefillUrl?: string }) {
  const [items, setItems] = useState<OrderItem[]>(() => [
    prefillUrl ? { ...emptyItem(), productUrl: prefillUrl } : emptyItem(),
  ]);
  const [previews, setPreviews] = useState<Record<number, ItemPreviewState>>({});
  // selected variants per item: Record<itemIndex, Record<groupName, chosenValue>>
  const [variantSelections, setVariantSelections] = useState<Record<number, Record<string, string>>>({});
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ orderNumber: string } | null>(null);
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const fetchPreview = useCallback(async (index: number, url: string) => {
    setPreviews((prev) => ({
      ...prev,
      [index]: { loading: true, error: null, preview: prev[index]?.preview ?? null },
    }));

    try {
      const res = await fetch(`/api/product-preview?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load product");

      const preview = data.preview as ProductPreview;

      setPreviews((prev) => ({
        ...prev,
        [index]: { loading: false, error: null, preview },
      }));

      // Auto-fill product name from preview title; reset variant selections
      setItems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          const keepManualImage =
            item.imageUrl &&
            preview.imageIsGeneric &&
            !item.imageUrl.includes("google.com/s2/favicons");
          return {
            ...item,
            productName: item.productName || preview.title || "",
            imageUrl: keepManualImage
              ? item.imageUrl
              : preview.imageIsGeneric
                ? undefined
                : (preview.image ?? undefined),
            price: preview.price ?? undefined,
            currency: preview.currency ?? undefined,
            siteName: preview.siteName ?? undefined,
          };
        })
      );

      // Reset variant choices when a new URL is loaded
      setVariantSelections((prev) => ({ ...prev, [index]: {} }));
    } catch (err) {
      setPreviews((prev) => ({
        ...prev,
        [index]: {
          loading: false,
          error: err instanceof Error ? err.message : "Could not load product",
          preview: null,
        },
      }));
    }
  }, []);

  function schedulePreviewFetch(index: number, url: string) {
    if (debounceTimers.current[index]) clearTimeout(debounceTimers.current[index]);

    if (!isValidUrl(url)) {
      setPreviews((prev) => { const n = { ...prev }; delete n[index]; return n; });
      return;
    }

    debounceTimers.current[index] = setTimeout(() => fetchPreview(index, url), 600);
  }

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  // Auto-fetch preview for pre-filled URL from hero
  useEffect(() => {
    if (prefillUrl && isValidUrl(prefillUrl)) {
      fetchPreview(0, prefillUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "productUrl" && typeof value === "string") {
          updated.imageUrl = undefined;
          updated.productName = "";
        }
        return updated;
      })
    );
    if (field === "productUrl" && typeof value === "string") {
      schedulePreviewFetch(index, value.trim());
    }
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const next: Record<number, ItemPreviewState> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        if (i < index) next[i] = v;
        else if (i > index) next[i - 1] = v;
      });
      return next;
    });
    setVariantSelections((prev) => {
      const next: Record<number, Record<string, string>> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        if (i < index) next[i] = v;
        else if (i > index) next[i - 1] = v;
      });
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Serialize variant selections into variantNotes before submitting
    const finalItems = items.map((item, index) => ({
      ...item,
      variantNotes: serializeVariants(variantSelections[index] ?? {}),
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName, phone, email, address, city,
          items: finalItems, notes, paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit order");
      setSuccess({ orderNumber: data.order.orderNumber });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">✓</div>
        <h2 className="mb-2 text-2xl font-black text-white">Order Submitted!</h2>
        <p className="mb-4 text-[var(--muted2)]">
          Your order number is{" "}
          <span className="font-mono font-bold text-[var(--gold)]">{success.orderNumber}</span>
        </p>
        <p className="mb-6 text-sm text-[var(--muted)]">
          We&apos;ll review your request and send you a full quote via WhatsApp or email within 24 hours.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={`/track?order=${success.orderNumber}`} className="btn-gold">
            Track Order
          </a>
          <button type="button"
            onClick={() => {
              setSuccess(null); setItems([emptyItem()]); setPreviews({});
              setVariantSelections({});
              setCustomerName(""); setPhone(""); setEmail("");
              setAddress(""); setCity(""); setNotes("");
            }}
            className="btn-outline">
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ── Product Items ─────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white">Product Details</h2>

        {items.map((item, index) => {
          const previewState = previews[index];
          const preview = previewState?.preview ?? null;
          const variantGroups = preview?.variants ?? [];
          const selectedVariants = variantSelections[index] ?? {};

          return (
            <div key={index} className="card-flat space-y-5 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--muted2)]">Item {index + 1}</span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)}
                    className="text-xs text-red-400 hover:text-red-300 transition">
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[var(--muted2)]">
                  Product URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={item.productUrl}
                  onChange={(e) => updateItem(index, "productUrl", e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text").trim();
                    if (pasted) setTimeout(() => schedulePreviewFetch(index, pasted), 50);
                  }}
                  placeholder="https://www.amazon.co.uk/..."
                  className={INPUT_CLS}
                />
                <p className="mt-1.5 text-xs text-[var(--muted)]">
                  Paste any UK store link — product name &amp; variants are fetched automatically
                </p>
              </div>

              {(previewState?.loading || preview || previewState?.error) && (
                <ProductPreviewCard
                  loading={previewState?.loading}
                  error={previewState?.error}
                  preview={preview}
                  url={item.productUrl}
                  manualImageUrl={item.imageUrl}
                  onManualImageChange={(imageUrl) => updateItem(index, "imageUrl", imageUrl)}
                />
              )}

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm text-[var(--muted2)]">
                  Product Name
                  {previewState?.loading && <span className="text-xs text-[var(--muted)]">Fetching…</span>}
                  {item.productName && !previewState?.loading && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Auto-filled</span>
                  )}
                </label>
                <input type="text" value={item.productName}
                  onChange={(e) => updateItem(index, "productName", e.target.value)}
                  placeholder="Auto-filled from link, or type manually"
                  className={INPUT_CLS} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-[var(--muted2)]">Quantity</label>
                <input type="number" min={1} max={99} value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                  className={`${INPUT_CLS} w-28`} />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-[var(--muted2)]">
                  {variantGroups.length > 0 ? "Select Options" : "Size / Color / Options"}
                  {variantGroups.length > 0 && (
                    <span className="ml-2 rounded-full bg-[var(--gold-dim)] px-2 py-0.5 text-[10px] font-normal text-[var(--gold)]">
                      From product page
                    </span>
                  )}
                </label>
                <VariantSelector
                  groups={variantGroups}
                  productTitle={item.productName}
                  productUrl={item.productUrl}
                  selected={selectedVariants}
                  onChange={(updated) =>
                    setVariantSelections((prev) => ({ ...prev, [index]: updated }))
                  }
                />
              </div>
            </div>
          );
        })}

        <button type="button" onClick={addItem}
          className="text-sm text-[var(--gold)] hover:text-[var(--gold-lt)] transition">
          + Add another item
        </button>
      </section>

      {/* ── Delivery Details ──────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white">Delivery Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted2)]">Full Name <span className="text-red-400">*</span></label>
            <input type="text" required value={customerName}
              onChange={(e) => setCustomerName(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted2)]">Phone <span className="text-red-400">*</span></label>
            <input type="tel" required value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX" className={INPUT_CLS} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-[var(--muted2)]">Email <span className="text-red-400">*</span></label>
          <input type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} className={INPUT_CLS} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-[var(--muted2)]">Delivery Address <span className="text-red-400">*</span></label>
          <textarea required rows={3} value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House/Flat, Road, Area" className={INPUT_CLS} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-[var(--muted2)]">City <span className="text-red-400">*</span></label>
          <input type="text" required value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Dhaka, Chittagong, Sylhet…" className={INPUT_CLS} />
        </div>
      </section>

      {/* ── Payment & Notes ───────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white">Payment &amp; Notes</h2>
        <div>
          <label className="mb-1.5 block text-sm text-[var(--muted2)]">Preferred Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
            className={INPUT_CLS}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-[var(--muted2)]">Additional Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions…" className={INPUT_CLS} />
        </div>
      </section>

      <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-4 sm:w-auto sm:px-14">
        {loading ? "Submitting…" : "Submit Order Request"}
      </button>
    </form>
  );
}
