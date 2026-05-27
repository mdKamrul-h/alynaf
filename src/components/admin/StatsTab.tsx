"use client";

import { useEffect, useState } from "react";
import type { Order, FbConversation } from "@/lib/types";

interface Stats {
  ordersToday: number;
  ordersThisWeek: number;
  totalOrders: number;
  pendingOrders: number;
  likelyOrdersPending: number;
  fbConnected: boolean;
  bySource: { web: number; facebook: number; manual: number };
}

interface Props { adminKey: string }

export function StatsTab({ adminKey }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [ordersRes, convRes, statusRes] = await Promise.all([
        fetch("/api/orders", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/fb/conversations", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/fb/status", { headers: { "x-admin-key": adminKey } }),
      ]);

      const ordersData = ordersRes.ok
        ? ((await ordersRes.json()) as { orders: Order[] })
        : { orders: [] };
      const convData = convRes.ok
        ? ((await convRes.json()) as { conversations: FbConversation[]; fbConfigured: boolean })
        : { conversations: [], fbConfigured: false };
      const statusData = statusRes.ok
        ? ((await statusRes.json()) as { configured: boolean })
        : { configured: false };

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(
        now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()
      ).toISOString();

      const orders = ordersData.orders;
      const conversations = convData.conversations;

      setStats({
        ordersToday: orders.filter((o) => o.createdAt >= todayStart).length,
        ordersThisWeek: orders.filter((o) => o.createdAt >= weekStart).length,
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        likelyOrdersPending: conversations.filter(
          (c) => c.isLikelyOrder && !c.linkedOrderNumber
        ).length,
        fbConnected: statusData.configured || convData.fbConfigured,
        bySource: {
          web: orders.filter((o) => o.source === "web").length,
          facebook: orders.filter((o) => o.source === "facebook").length,
          manual: orders.filter((o) => o.source === "manual").length,
        },
      });
    }
    load();
  }, [adminKey]);

  if (!stats) return null;

  return (
    <div className="mt-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Stats</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Orders" value={stats.ordersToday} />
        <StatCard label="This Week" value={stats.ordersThisWeek} />
        <StatCard label="Pending Review" value={stats.pendingOrders} />
        <StatCard
          label="Likely Orders in Inbox"
          value={stats.likelyOrdersPending}
          accent="amber"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-3 text-sm font-medium text-slate-400">Orders by Source</p>
          <div className="space-y-2">
            <SourceBar label="Web" count={stats.bySource.web} total={stats.totalOrders} color="bg-slate-500" />
            <SourceBar label="Facebook" count={stats.bySource.facebook} total={stats.totalOrders} color="bg-blue-500" />
            <SourceBar label="Manual" count={stats.bySource.manual} total={stats.totalOrders} color="bg-amber-500" />
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div
            className={`h-3 w-3 rounded-full ${stats.fbConnected ? "bg-emerald-400" : "bg-amber-400"}`}
          />
          <div>
            <p className="text-sm font-medium text-white">
              Facebook {stats.fbConnected ? "Connected" : "Not Connected"}
            </p>
            {!stats.fbConnected && (
              <p className="mt-0.5 text-xs text-slate-500">
                Set FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN to enable live sync.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-3xl font-bold ${
          accent === "amber" ? "text-amber-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SourceBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-slate-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs text-slate-400">{count}</span>
    </div>
  );
}
