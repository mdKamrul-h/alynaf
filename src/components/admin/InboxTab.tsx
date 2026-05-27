"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { FbConversation } from "@/lib/types";

type InboxFilter = "all" | "likelyOrder" | "unread" | "linked";

const FILTERS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "likelyOrder", label: "Likely Order" },
  { value: "unread", label: "Unread" },
  { value: "linked", label: "Linked" },
];

interface Props { adminKey: string }

export function InboxTab({ adminKey }: Props) {
  const [conversations, setConversations] = useState<FbConversation[]>([]);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [fbConfigured, setFbConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mockLoading, setMockLoading] = useState(false);
  const router = useRouter();

  const fetchConversations = useCallback(async () => {
    const qs = new URLSearchParams();
    if (filter === "likelyOrder") qs.set("likelyOrder", "1");
    else if (filter === "unread") qs.set("unreadOnly", "1");
    else if (filter === "linked") qs.set("linked", "1");

    const res = await fetch(`/api/fb/conversations?${qs}`, {
      headers: { "x-admin-key": adminKey },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        conversations: FbConversation[];
        fbConfigured: boolean;
      };
      setConversations(data.conversations);
      setFbConfigured(data.fbConfigured);
    }
    setLoading(false);
  }, [adminKey, filter]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15_000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  async function loadMockData() {
    setMockLoading(true);
    await fetch("/api/fb/mock", {
      method: "POST",
      headers: { "x-admin-key": adminKey },
    });
    await fetchConversations();
    setMockLoading(false);
  }

  async function syncFb() {
    await fetch("/api/fb/sync", {
      method: "POST",
      headers: { "x-admin-key": adminKey },
    });
    await fetchConversations();
  }

  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Inbox</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {fbConfigured && (
            <button
              onClick={syncFb}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:text-white"
            >
              Sync FB
            </button>
          )}
          {process.env.NODE_ENV !== "production" && (
            <button
              onClick={loadMockData}
              disabled={mockLoading}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:text-white disabled:opacity-50"
            >
              {mockLoading ? "Loading…" : "Load Mock Data"}
            </button>
          )}
        </div>
      </div>

      {!fbConfigured && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Facebook not connected. Set <code>FB_PAGE_ID</code> and{" "}
          <code>FB_PAGE_ACCESS_TOKEN</code> to enable live sync. Use{" "}
          <strong>Load Mock Data</strong> to explore the UI.
        </div>
      )}

      <div className="mb-4 flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              filter === f.value
                ? "bg-white/15 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-slate-500">Loading…</p>
      ) : conversations.length === 0 ? (
        <p className="text-center text-slate-500">No conversations.</p>
      ) : (
        <div className="divide-y divide-white/5 rounded-xl border border-white/10">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => router.push(`/admin/inbox/${conv.id}`)}
              className="flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-white/[0.03]"
            >
              <Avatar name={conv.customerName} src={conv.customerAvatar} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${conv.unreadCount > 0 ? "text-white" : "text-slate-300"}`}>
                      {conv.customerName}
                    </span>
                    {conv.isLikelyOrder && !conv.linkedOrderNumber && (
                      <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">
                        Order?
                      </span>
                    )}
                    {conv.linkedOrderNumber && (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-300">
                        Linked
                      </span>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {relativeTime(conv.lastMessageAt)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {conv.lastMessageSnippet || "No messages"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const initial = name.charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4a7c9b]/30 text-sm font-bold text-[#4a7c9b]">
      {initial}
    </div>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
