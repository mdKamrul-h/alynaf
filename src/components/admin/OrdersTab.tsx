"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, OrderSource, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { computeEscalations } from "@/lib/escalations";
import OrderItemCard from "@/components/OrderItemCard";
import Link from "next/link";

const STATUSES: OrderStatus[] = [
  "pending", "quoted", "confirmed", "purchased", "shipped", "delivered", "cancelled",
];

const SOURCE_FILTERS = [
  { value: "all",      label: "All" },
  { value: "web",      label: "Web" },
  { value: "facebook", label: "Facebook" },
  { value: "manual",   label: "Manual" },
] as const;

type SourceFilter = "all" | OrderSource;

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   "bg-amber-500/15 text-amber-300",
  quoted:    "bg-[#C8920E]/20 text-[#C8920E]",
  confirmed: "bg-blue-500/15 text-blue-300",
  purchased: "bg-violet-500/15 text-violet-300",
  shipped:   "bg-cyan-500/15 text-cyan-300",
  delivered: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-red-500/15 text-red-400",
};

interface Props { adminKey: string }

export function OrdersTab({ adminKey }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = sourceFilter !== "all" ? `?source=${sourceFilter}` : "";
      const res = await fetch(`/api/orders${qs}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) {
        const data = await res.json() as { orders: Order[] };
        setOrders(data.orders);
      }
    } finally {
      setLoading(false);
    }
  }, [adminKey, sourceFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function seedMockOrders() {
    setSeeding(true);
    try {
      await fetch("/api/orders/mock", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      await fetchOrders();
    } finally {
      setSeeding(false);
    }
  }

  async function updateStatus(orderNumber: string, status: OrderStatus, quoteAmount?: string) {
    await fetch("/api/orders/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ orderNumber, status, quoteAmount: quoteAmount ? parseFloat(quoteAmount) : undefined }),
    });
    fetchOrders();
  }

  const escalatedSet = new Set(
    computeEscalations(orders, []).filter((e) => e.type === "order").map((e) => e.id)
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Orders</h1>
            <p className="mt-0.5 text-xs sm:text-sm" style={{ color: "var(--muted)" }}>
              {orders.length} order{orders.length !== 1 ? "s" : ""}
              {sourceFilter !== "all" ? ` · ${sourceFilter}` : ""}
            </p>
          </div>
          {process.env.NODE_ENV !== "production" && (
            <button
              onClick={seedMockOrders}
              disabled={seeding}
              className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--muted2)" }}
            >
              {seeding ? "Seeding…" : "Seed Data"}
            </button>
          )}
        </div>
        {/* Source filter — scrollable row on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl p-1"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          {SOURCE_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setSourceFilter(f.value)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
              style={sourceFilter === f.value
                ? { background: "rgba(200,146,14,0.15)", color: "#C8920E" }
                : { color: "var(--muted2)" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#C8920E]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center gap-3 rounded-xl"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          <p className="text-white">No orders yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Orders from the web form and inbox will appear here</p>
          {process.env.NODE_ENV !== "production" && (
            <button
              onClick={seedMockOrders}
              disabled={seeding}
              className="btn-gold mt-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {seeding ? "Seeding…" : "Load Mock Orders"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isEscalated = escalatedSet.has(order.orderNumber);
            return (
              <div key={order.id} className="card-flat overflow-hidden transition-all"
                style={isEscalated ? { borderColor: "rgba(239,68,68,0.4)", boxShadow: "0 0 0 1px rgba(239,68,68,0.1)" } : {}}>

                {/* Card header */}
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[12px] font-bold sm:text-[13px]" style={{ color: "#C8920E" }}>
                        {order.orderNumber}
                      </span>
                      <SourceBadge source={order.source} convId={order.fbConversationId} />
                      {isEscalated && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">
                          Needs attention
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-white">
                      {order.customerName}
                      <span className="text-[12px]" style={{ color: "var(--muted)" }}> · {order.phone} · {order.city}</span>
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--muted)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Status controls — full-width row on mobile */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.orderNumber, e.target.value as OrderStatus)}
                      className="flex-1 rounded-lg px-2.5 py-1.5 text-[12px] text-white focus:outline-none sm:flex-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)" }}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    {order.status === "pending" && (
                      <button
                        onClick={() => {
                          const amt = prompt("Quote amount (BDT):");
                          if (amt) updateStatus(order.orderNumber, "quoted", amt);
                        }}
                        className="btn-gold px-3 py-1.5 text-[12px]">
                        Send Quote
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="px-5 py-3">
                  <ul className="space-y-2">
                    {order.items.map((item, i) => (
                      <li key={i}><OrderItemCard item={item} /></li>
                    ))}
                  </ul>
                </div>

                {/* Quote footer */}
                {order.quoteAmount !== null && (
                  <div className="px-5 pb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold"
                      style={{ background: "rgba(200,146,14,0.12)", color: "#C8920E" }}>
                      ৳ {order.quoteAmount.toLocaleString()} {order.quoteCurrency !== "BDT" ? order.quoteCurrency : ""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source, convId }: { source: OrderSource; convId: string | null }) {
  if (source === "facebook") {
    return convId ? (
      <Link href={`/admin/inbox/${convId}`}
        className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-400 hover:bg-blue-500/25 transition-colors">
        FB ↗
      </Link>
    ) : (
      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-400">FB</span>
    );
  }
  if (source === "manual") {
    return <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">Manual</span>;
  }
  return <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] font-medium" style={{ color: "var(--muted2)" }}>Web</span>;
}
