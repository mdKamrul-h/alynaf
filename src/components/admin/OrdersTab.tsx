"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, OrderSource, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import OrderItemCard from "@/components/OrderItemCard";
import Link from "next/link";

const STATUSES: OrderStatus[] = [
  "pending", "quoted", "confirmed", "purchased", "shipped", "delivered", "cancelled",
];

const SOURCE_FILTERS = [
  { value: "all", label: "All" },
  { value: "web", label: "Web" },
  { value: "facebook", label: "Facebook" },
  { value: "manual", label: "Manual" },
] as const;

type SourceFilter = "all" | OrderSource;

interface Props { adminKey: string }

export function OrdersTab({ adminKey }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = sourceFilter !== "all" ? `?source=${sourceFilter}` : "";
      const res = await fetch(`/api/orders${qs}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) {
        const data = (await res.json()) as { orders: Order[] };
        setOrders(data.orders);
      }
    } finally {
      setLoading(false);
    }
  }, [adminKey, sourceFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function updateStatus(
    orderNumber: string,
    status: OrderStatus,
    quoteAmount?: string
  ) {
    await fetch("/api/orders/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        orderNumber,
        status,
        quoteAmount: quoteAmount ? parseFloat(quoteAmount) : undefined,
      }),
    });
    fetchOrders();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <div className="flex items-center gap-2">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                sourceFilter === f.value
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-500">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-center text-slate-500">No orders.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-white">{order.orderNumber}</p>
                    <SourceBadge source={order.source} convId={order.fbConversationId} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">
                    {order.customerName} · {order.phone} · {order.city}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus(order.orderNumber, e.target.value as OrderStatus)
                    }
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  {order.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => {
                        const amount = prompt("Quote amount (BDT):");
                        if (amount) updateStatus(order.orderNumber, "quoted", amount);
                      }}
                      className="rounded-lg bg-[#4a7c9b] px-3 py-1.5 text-xs text-white"
                    >
                      Send Quote
                    </button>
                  )}
                </div>
              </div>

              <ul className="space-y-2">
                {order.items.map((item, i) => (
                  <li key={i}>
                    <OrderItemCard item={item} />
                  </li>
                ))}
              </ul>

              {order.quoteAmount !== null && (
                <p className="mt-3 text-sm text-emerald-400">
                  Quote: {order.quoteCurrency} {order.quoteAmount.toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source, convId }: { source: OrderSource; convId: string | null }) {
  if (source === "facebook") {
    return convId ? (
      <Link
        href={`/admin/inbox/${convId}`}
        className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300 hover:bg-blue-500/30"
      >
        FB
      </Link>
    ) : (
      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">FB</span>
    );
  }
  if (source === "manual") {
    return (
      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">Manual</span>
    );
  }
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">Web</span>
  );
}
