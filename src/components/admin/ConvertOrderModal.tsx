"use client";

import { useState, useEffect } from "react";
import type { MessageSignals, OrderItem } from "@/lib/types";
import type { ProductPreview } from "@/lib/product-preview";
import { PAYMENT_METHODS } from "@/lib/constants";

interface Props {
  adminKey: string;
  convId: string;
  customerName: string;
  signals: MessageSignals;
  onSuccess: (orderNumber: string) => void;
  onClose: () => void;
}

export function ConvertOrderModal({ adminKey, convId, customerName, signals, onSuccess, onClose }: Props) {
  const [name,          setName]          = useState(customerName);
  const [phone,         setPhone]         = useState(signals.phones[0] ?? "");
  const [email,         setEmail]         = useState("");
  const [address,       setAddress]       = useState(signals.addressHints[0] ?? "");
  const [city,          setCity]          = useState(signals.extractedCity ?? "Dhaka");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes,         setNotes]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  // Each item tracks its own loading state separately
  const [items, setItems] = useState<OrderItem[]>(() =>
    signals.urls.length > 0
      ? signals.urls.map((url, i) => ({
          productUrl:   url,
          productName:  "",
          quantity:     1,
          variantNotes: signals.sizes[i] ?? signals.sizes[0] ?? "",
        }))
      : [{ productUrl: "", productName: "", quantity: 1, variantNotes: "" }]
  );
  const [fetchingIdx, setFetchingIdx] = useState<Set<number>>(new Set());

  // ── Auto-fetch product preview for every URL on open ──────────────────────
  useEffect(() => {
    if (signals.urls.length === 0) return;

    const toFetch = signals.urls
      .map((url, i) => ({ i, url }))
      .filter(({ url }) => {
        try { new URL(url); return true; } catch { return false; }
      });

    if (toFetch.length === 0) return;
    setFetchingIdx(new Set(toFetch.map(({ i }) => i)));

    toFetch.forEach(({ i, url }) => {
      fetch(`/api/product-preview?url=${encodeURIComponent(url)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { preview?: ProductPreview } | null) => {
          if (!data?.preview) return;
          const p = data.preview;
          setItems((prev) =>
            prev.map((item, idx) => {
              if (idx !== i) return item;
              return {
                ...item,
                productName: item.productName || p.title  || "",
                imageUrl:    (!p.imageIsGeneric && p.image) ? p.image : item.imageUrl,
                price:       p.price    ?? item.price,
                currency:    p.currency ?? item.currency,
                siteName:    p.siteName ?? item.siteName,
              };
            })
          );
        })
        .catch(() => { /* silent — still shows URL */ })
        .finally(() => {
          setFetchingIdx((prev) => { const s = new Set(prev); s.delete(i); return s; });
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  function updateItem(i: number, f: keyof OrderItem, v: string | number) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [f]: v } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { productUrl: "", productName: "", quantity: 1, variantNotes: "" }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fb/conversations/${convId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          customerName: name, phone, email, address, city, paymentMethod, notes,
          items: items.filter((it) => it.productUrl.trim()),
        }),
      });
      const d = await res.json() as { order?: { orderNumber: string }; error?: string };
      if (!res.ok) throw new Error(d.error ?? "Failed to create order");
      onSuccess(d.order!.orderNumber);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-t-2xl sm:rounded-2xl"
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          color: "var(--text)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-[15px] font-bold text-white">Convert to Order</h2>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>
              Create an order from this conversation
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-white/5"
            style={{ color: "var(--muted)" }}
          >
            <XIcon />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto px-6 py-5 space-y-6">
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-[13px] text-red-400"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </div>
            )}

            {/* ── Customer ────────────────────────────────────────────── */}
            <section>
              <SectionLabel>Customer</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input value={name} onChange={(e) => setName(e.target.value)} required className="inp w-full" />
                </Field>
                <Field label="Phone">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="inp w-full" />
                </Field>
                <Field label="Email (optional)">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="inp w-full" />
                </Field>
                <Field label="City">
                  <input value={city} onChange={(e) => setCity(e.target.value)} required className="inp w-full" />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Delivery Address">
                  <input value={address} onChange={(e) => setAddress(e.target.value)} required className="inp w-full" />
                </Field>
              </div>
            </section>

            {/* ── Items ───────────────────────────────────────────────── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <SectionLabel>Items ({items.length})</SectionLabel>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-[12px] font-semibold transition-colors hover:opacity-80"
                  style={{ color: "#C8920E" }}
                >
                  + Add item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, i) => (
                  <ItemCard
                    key={i}
                    item={item}
                    index={i}
                    isLoading={fetchingIdx.has(i)}
                    canRemove={items.length > 1}
                    onUpdate={(f, v) => updateItem(i, f, v)}
                    onRemove={() => removeItem(i)}
                  />
                ))}
              </div>
            </section>

            {/* ── Payment + Notes ─────────────────────────────────────── */}
            <section>
              <SectionLabel>Payment & Notes</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Payment Method">
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="inp w-full">
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Notes (optional)">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="inp w-full resize-none" />
                </Field>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div
            className="flex shrink-0 items-center justify-end gap-3 px-6 py-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button type="button" onClick={onClose} className="btn-outline px-4 py-2 text-[13px]">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-gold px-5 py-2 text-[13px] disabled:opacity-50">
              {loading ? "Creating…" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Item card ────────────────────────────────────────────────────────────────

interface ItemCardProps {
  item: OrderItem;
  index: number;
  isLoading: boolean;
  canRemove: boolean;
  onUpdate: (field: keyof OrderItem, value: string | number) => void;
  onRemove: () => void;
}

function ItemCard({ item, isLoading, canRemove, onUpdate, onRemove }: ItemCardProps) {
  const hasImage  = !!item.imageUrl;
  const hasName   = !!item.productName;
  const hasMeta   = !!(item.siteName || item.price);

  return (
    <div
      className="overflow-hidden rounded-xl transition-colors"
      style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}
    >
      {/* Product preview row */}
      <div className="flex items-start gap-3 p-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
        {/* Thumbnail */}
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#C8920E]" />
          ) : hasImage ? (
            <img
              src={item.imageUrl}
              alt={item.productName || "Product"}
              className="h-full w-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)" }}>
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a4 4 0 00-8 0v2" />
            </svg>
          )}
        </div>

        {/* Product info */}
        <div className="min-w-0 flex-1">
          {/* Product name — editable input styled as text */}
          <input
            value={item.productName}
            onChange={(e) => onUpdate("productName", e.target.value)}
            placeholder={isLoading ? "Fetching product name…" : "Enter product name"}
            className="w-full bg-transparent text-[13px] font-medium text-white placeholder-[var(--muted)] outline-none focus:text-white"
          />

          {/* Meta row: store + price */}
          {(hasMeta || item.productUrl) && (
            <div className="mt-0.5 flex items-center gap-2">
              {item.siteName && (
                <span className="text-[11px]" style={{ color: "var(--muted2)" }}>{item.siteName}</span>
              )}
              {item.price && (
                <span className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300"
                  style={{ background: "rgba(16,185,129,0.1)" }}>
                  {item.price} {item.currency && item.currency !== "GBP" ? item.currency : ""}
                </span>
              )}
              {!hasMeta && item.productUrl && (
                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[11px] hover:underline"
                  style={{ color: "#C8920E", maxWidth: "240px", display: "block" }}
                >
                  ↗ {(() => { try { return new URL(item.productUrl).hostname.replace("www.", ""); } catch { return item.productUrl; } })()}
                </a>
              )}
            </div>
          )}

          {/* URL (shown when we have a name — collapsed to link) */}
          {hasName && item.productUrl && (
            <a
              href={item.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate text-[10px] hover:underline"
              style={{ color: "var(--muted)", maxWidth: "340px" }}
            >
              ↗ {item.productUrl}
            </a>
          )}
        </div>

        {/* Remove */}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1 transition-colors hover:bg-red-500/10 hover:text-red-400"
            style={{ color: "var(--muted)", flexShrink: 0 }}
          >
            <XIcon size={13} />
          </button>
        )}
      </div>

      {/* URL + Size + Qty row */}
      <div className="flex items-center gap-2 p-3">
        {/* URL input — shown when no product name yet */}
        {!hasName && (
          <input
            value={item.productUrl}
            onChange={(e) => onUpdate("productUrl", e.target.value)}
            placeholder="Product URL"
            className="inp flex-1 text-[12px]"
          />
        )}

        {/* Size / Variant */}
        <div className="relative" style={hasName ? { flex: 1 } : {}}>
          <input
            value={item.variantNotes}
            onChange={(e) => onUpdate("variantNotes", e.target.value)}
            placeholder="Size / Variant"
            className={`inp text-[12px] ${hasName ? "w-full" : "w-32"}`}
          />
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdate("quantity", Math.max(1, item.quantity - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--border)", color: "var(--muted2)" }}
          >
            −
          </button>
          <span className="w-6 text-center text-[13px] font-semibold text-white">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onUpdate("quantity", item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold transition-colors hover:bg-white/5"
            style={{ border: "1px solid var(--border)", color: "var(--muted2)" }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
      {children}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium" style={{ color: "var(--muted2)" }}>{label}</label>
      {children}
    </div>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}
