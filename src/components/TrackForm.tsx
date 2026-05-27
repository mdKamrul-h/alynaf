"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import OrderItemCard from "@/components/OrderItemCard";

const STATUS_STEPS = [
  "pending",
  "quoted",
  "confirmed",
  "purchased",
  "shipped",
  "delivered",
] as const;

function TrackFormInner() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const prefill = searchParams.get("order");
    if (prefill) setOrderNumber(prefill);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const params = new URLSearchParams({ orderNumber, phone });
      const res = await fetch(`/api/orders/track?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Order not found");
      }

      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const currentStepIndex = order
    ? STATUS_STEPS.indexOf(
        order.status as (typeof STATUS_STEPS)[number]
      )
    : -1;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            Order Number
          </label>
          <input
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="AN-20250527-XXXX"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-sm text-white placeholder:text-slate-600 focus:border-[#4a7c9b] focus:outline-none focus:ring-1 focus:ring-[#4a7c9b]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            Phone Number (used when ordering)
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[#4a7c9b] focus:outline-none focus:ring-1 focus:ring-[#4a7c9b]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#4a7c9b] px-8 py-2.5 text-sm font-medium text-white hover:bg-[#5a8fad] disabled:opacity-60"
        >
          {loading ? "Searching..." : "Track Order"}
        </button>
      </form>

      {order && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Order Number</p>
              <p className="font-mono text-xl font-bold text-white">
                {order.orderNumber}
              </p>
            </div>
            <span className="rounded-full bg-[#4a7c9b]/20 px-4 py-1.5 text-sm font-medium text-[#8bb8d4]">
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {order.status !== "cancelled" && (
            <div className="relative">
              <div className="absolute left-4 top-0 h-full w-0.5 bg-white/10" />
              <div className="space-y-4">
                {STATUS_STEPS.map((step, index) => {
                  const done = currentStepIndex >= index;
                  const active = currentStepIndex === index;
                  return (
                    <div key={step} className="relative flex items-center gap-4 pl-10">
                      <div
                        className={`absolute left-2.5 h-3 w-3 rounded-full border-2 ${
                          done
                            ? "border-[#4a7c9b] bg-[#4a7c9b]"
                            : "border-slate-600 bg-[#0a0a0a]"
                        } ${active ? "ring-4 ring-[#4a7c9b]/30" : ""}`}
                      />
                      <span
                        className={`text-sm ${
                          done ? "text-white" : "text-slate-500"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {order.quoteAmount !== null && (
            <div className="rounded-lg bg-[#4a7c9b]/10 px-4 py-3">
              <p className="text-sm text-slate-400">Quoted Amount</p>
              <p className="text-lg font-semibold text-white">
                {order.quoteCurrency} {order.quoteAmount.toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Items</p>
            <ul className="space-y-2">
              {order.items.map((item, i) => (
                <li key={i}>
                  <OrderItemCard item={item} />
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-500">
            Placed on {new Date(order.createdAt).toLocaleString("en-GB")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function TrackForm() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
      <TrackFormInner />
    </Suspense>
  );
}
