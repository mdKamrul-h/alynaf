"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FbConversation, Order } from "@/lib/types";
import type { Escalation } from "@/lib/escalations";
import { computeEscalations } from "@/lib/escalations";

interface Props { adminKey: string }

const REVENUE_STATUSES = new Set(["quoted", "confirmed", "purchased", "shipped", "delivered"]);
const PIPELINE = ["pending", "quoted", "confirmed", "purchased", "shipped", "delivered"] as const;

const PIPELINE_COLORS = [
  { bg: "rgba(245,158,11,0.15)", text: "#F59E0B", bar: "#F59E0B" },
  { bg: "rgba(200,146,14,0.15)", text: "#C8920E", bar: "#C8920E" },
  { bg: "rgba(59,130,246,0.15)", text: "#60A5FA", bar: "#3B82F6" },
  { bg: "rgba(139,92,246,0.15)", text: "#A78BFA", bar: "#8B5CF6" },
  { bg: "rgba(6,182,212,0.15)",  text: "#22D3EE", bar: "#06B6D4" },
  { bg: "rgba(16,185,129,0.15)", text: "#34D399", bar: "#10B981" },
];

const PIPELINE_LABELS: Record<string, string> = {
  pending: "Pending", quoted: "Quoted", confirmed: "Confirmed",
  purchased: "Purchased", shipped: "Shipped", delivered: "Delivered",
};

function fmt(n: number) {
  if (n >= 100000) return `৳${(n / 1000).toFixed(0)}k`;
  return `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

export function StatsTab({ adminKey }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<FbConversation[]>([]);
  const [fbConnected, setFbConnected] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [escOpen, setEscOpen] = useState(true);

  useEffect(() => {
    async function load() {
      const [oRes, cRes, fbRes, waRes] = await Promise.all([
        fetch("/api/orders", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/fb/conversations", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/fb/status", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/wa/status", { headers: { "x-admin-key": adminKey } }),
      ]);
      if (oRes.ok) setOrders((await oRes.json() as { orders: Order[] }).orders);
      if (cRes.ok) {
        const d = await cRes.json() as { conversations: FbConversation[]; fbConfigured: boolean; waConfigured: boolean };
        setConversations(d.conversations);
        setFbConnected(d.fbConfigured);
        setWaConnected(d.waConfigured);
      }
      if (fbRes.ok && (await fbRes.json() as { configured: boolean }).configured) setFbConnected(true);
      if (waRes.ok && (await waRes.json() as { configured: boolean }).configured) setWaConnected(true);
    }
    load();
  }, [adminKey]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();

  const revenueOrders = orders.filter((o) => REVENUE_STATUSES.has(o.status) && o.quoteAmount != null);
  const totalRev   = revenueOrders.reduce((s, o) => s + (o.quoteAmount ?? 0), 0);
  const weekRev    = revenueOrders.filter((o) => o.createdAt >= weekStart).reduce((s, o) => s + (o.quoteAmount ?? 0), 0);
  const pendingRev = orders.filter((o) => o.status === "quoted" && o.quoteAmount != null).reduce((s, o) => s + (o.quoteAmount ?? 0), 0);
  const avgRev     = revenueOrders.length > 0 ? totalRev / revenueOrders.length : 0;

  const escalations: Escalation[] = computeEscalations(orders, conversations);
  const highEsc = escalations.filter((e) => e.urgency === "high").length;

  const pipeline = PIPELINE.map((status, i) => {
    const stageOrders = orders.filter((o) => o.status === status);
    const value = stageOrders.filter((o) => o.quoteAmount != null).reduce((s, o) => s + (o.quoteAmount ?? 0), 0);
    return { status, count: stageOrders.length, value, color: PIPELINE_COLORS[i] };
  });
  const maxPipelineCount = Math.max(...pipeline.map((p) => p.count), 1);

  const bySource = {
    web:      orders.filter((o) => o.source === "web").length,
    facebook: orders.filter((o) => o.source === "facebook").length,
    manual:   orders.filter((o) => o.source === "manual").length,
  };

  return (
    <div className="space-y-6">

      {/* Escalations */}
      {escalations.length > 0 && (
        <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.05)" }}>
          <button onClick={() => setEscOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                {escalations.length}
              </span>
              <span className="text-[13px] font-semibold text-red-300">
                {highEsc > 0 ? `${highEsc} urgent` : `${escalations.length} items`} need attention
              </span>
            </div>
            <span className="text-[11px]" style={{ color: "var(--muted)" }}>{escOpen ? "▲" : "▼"}</span>
          </button>
          {escOpen && (
            <div style={{ borderTop: "1px solid rgba(239,68,68,0.15)" }}>
              {escalations.map((esc, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: i < escalations.length - 1 ? "1px solid rgba(239,68,68,0.08)" : "none" }}>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-white">{esc.label}</p>
                    <p className="text-[11px]" style={{ color: "var(--muted)" }}>{esc.reason}</p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <span className={`text-[11px] font-medium ${esc.urgency === "high" ? "text-red-400" : "text-amber-400"}`}>
                      {Math.round(esc.ageHours)}h
                    </span>
                    {esc.type === "order" ? (
                      <Link href="/admin/orders" className="btn-outline px-2.5 py-1 text-[11px]" onClick={(e) => e.stopPropagation()}>
                        View
                      </Link>
                    ) : (
                      <Link href={`/admin/inbox/${esc.id}`} className="btn-outline px-2.5 py-1 text-[11px]" onClick={(e) => e.stopPropagation()}>
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Orders" value={orders.filter((o) => o.createdAt >= todayStart).length} />
        <StatCard label="This Week" value={orders.filter((o) => o.createdAt >= weekStart).length} />
        <StatCard label="Pending Review" value={orders.filter((o) => o.status === "pending").length} accent="amber" />
        <StatCard label="Inbox Likely Orders" value={conversations.filter((c) => c.isLikelyOrder && !c.linkedOrderNumber).length} accent="amber" />
      </div>

      {/* Revenue row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={fmt(totalRev)} accent="gold" />
        <StatCard label="This Week Revenue" value={fmt(weekRev)} />
        <StatCard label="Pending Quote Value" value={fmt(pendingRev)} accent="amber" />
        <StatCard label="Avg Order Value" value={fmt(avgRev)} />
      </div>

      {/* Pipeline */}
      <div className="card-flat p-5">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Order Pipeline</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {pipeline.map((stage) => (
            <div key={stage.status} className="rounded-xl p-3 text-center"
              style={{ background: stage.color.bg }}>
              <p className="text-[11px] font-medium" style={{ color: stage.color.text }}>
                {PIPELINE_LABELS[stage.status]}
              </p>
              <p className="mt-1.5 text-2xl font-bold text-white">{stage.count}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(stage.count / maxPipelineCount) * 100}%`, background: stage.color.bar }} />
              </div>
              {stage.value > 0 && (
                <p className="mt-1.5 text-[10px]" style={{ color: stage.color.text, opacity: 0.8 }}>
                  {fmt(stage.value)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row: charts + connections */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Orders by source */}
        <div className="card-flat p-5">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Orders by Source</p>
          <div className="space-y-3">
            <SourceBar label="Web" count={bySource.web} total={orders.length} color="#64748B" />
            <SourceBar label="Facebook" count={bySource.facebook} total={orders.length} color="#60A5FA" />
            <SourceBar label="Manual" count={bySource.manual} total={orders.length} color="#C8920E" />
          </div>
        </div>

        {/* Connections */}
        <div className="card-flat p-5 lg:col-span-2">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Channel Status</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ConnCard label="Facebook Messenger" connected={fbConnected}
              hint="Set FB_PAGE_ID + FB_PAGE_ACCESS_TOKEN" icon="f" />
            <ConnCard label="WhatsApp Business" connected={waConnected}
              hint="Set WA_PHONE_NUMBER_ID + WA_ACCESS_TOKEN" icon="w" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: "amber" | "gold" }) {
  const color = accent === "gold" ? "#C8920E" : accent === "amber" ? "#F59E0B" : "#F1F5F9";
  return (
    <div className="card-flat p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function SourceBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-[12px]" style={{ color: "var(--muted2)" }}>{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-5 text-right text-[12px]" style={{ color: "var(--muted2)" }}>{count}</span>
    </div>
  );
}

function ConnCard({ label, connected, hint, icon }: { label: string; connected: boolean; hint: string; icon: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-3.5"
      style={{ background: connected ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${connected ? "rgba(16,185,129,0.2)" : "var(--border)"}` }}>
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold"
        style={{ background: icon === "f" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)", color: icon === "f" ? "#60A5FA" : "#34D399" }}>
        {icon.toUpperCase()}
      </div>
      <div>
        <p className="text-[13px] font-medium text-white">{label}</p>
        <p className={`mt-0.5 text-[11px] ${connected ? "text-emerald-400" : ""}`}
          style={{ color: connected ? undefined : "var(--muted)" }}>
          {connected ? "Connected" : hint}
        </p>
      </div>
    </div>
  );
}
