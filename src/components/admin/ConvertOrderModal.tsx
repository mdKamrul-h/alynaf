"use client";

import { useState } from "react";
import type { MessageSignals, OrderItem } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/constants";

interface Props {
  adminKey: string;
  convId: string;
  customerName: string;
  signals: MessageSignals;
  onSuccess: (orderNumber: string) => void;
  onClose: () => void;
}

export function ConvertOrderModal({
  adminKey,
  convId,
  customerName,
  signals,
  onSuccess,
  onClose,
}: Props) {
  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(signals.phones[0] ?? "");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState(signals.addressHints[0] ?? "");
  const [city, setCity] = useState("Dhaka");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>(
    signals.urls.length > 0
      ? signals.urls.map((url) => ({
          productUrl: url,
          productName: "",
          quantity: 1,
          variantNotes: signals.sizes[0] ?? "",
        }))
      : [{ productUrl: "", productName: "", quantity: 1, variantNotes: "" }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateItem(i: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { productUrl: "", productName: "", quantity: 1, variantNotes: "" },
    ]);
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
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          customerName: name,
          phone,
          email,
          address,
          city,
          paymentMethod,
          notes,
          items: items.filter((it) => it.productUrl.trim()),
        }),
      });
      const data = (await res.json()) as { order?: { orderNumber: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onSuccess(data.order!.orderNumber);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111] p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Convert to Order</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer Name">
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} />
            </Field>
            <Field label="Email (optional)">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputCls} />
            </Field>
            <Field label="City">
              <input value={city} onChange={(e) => setCity(e.target.value)} required className={inputCls} />
            </Field>
          </div>

          <Field label="Delivery Address">
            <input value={address} onChange={(e) => setAddress(e.target.value)} required className={inputCls} />
          </Field>

          <Field label="Payment Method">
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Items</label>
              <button type="button" onClick={addItem} className="text-xs text-[#4a7c9b] hover:text-white">
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item.productUrl}
                    onChange={(e) => updateItem(i, "productUrl", e.target.value)}
                    placeholder="Product URL"
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    value={item.variantNotes}
                    onChange={(e) => updateItem(i, "variantNotes", e.target.value)}
                    placeholder="Size / Variant"
                    className={`${inputCls} w-28`}
                  />
                  <input
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", Math.max(1, Number(e.target.value)))}
                    type="number"
                    min={1}
                    className={`${inputCls} w-16`}
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-slate-500 hover:text-red-400">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputCls}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#4a7c9b] px-5 py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-[#4a7c9b] focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  );
}
