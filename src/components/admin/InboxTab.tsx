"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { FbConversation, InboxChannel } from "@/lib/types";

type InboxFilter  = "all" | "likelyOrder" | "unread" | "linked";
type ChannelFilter = "all" | InboxChannel;

const FILTERS: { value: InboxFilter; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "likelyOrder", label: "Likely Order" },
  { value: "unread",      label: "Unread" },
  { value: "linked",      label: "Linked" },
];

const CHANNELS: { value: ChannelFilter; label: string; color: string }[] = [
  { value: "all",       label: "All",       color: "var(--muted2)" },
  { value: "facebook",  label: "Facebook",  color: "#60A5FA" },
  { value: "whatsapp",  label: "WhatsApp",  color: "#34D399" },
];

interface Props { adminKey: string }

export function InboxTab({ adminKey }: Props) {
  const [conversations, setConversations] = useState<FbConversation[]>([]);
  const [filter, setFilter]               = useState<InboxFilter>("all");
  const [channel, setChannel]             = useState<ChannelFilter>("all");
  const [fbConfigured, setFbConfigured]   = useState(true);
  const [waConfigured, setWaConfigured]   = useState(false);
  const [loading, setLoading]             = useState(true);
  const [mockLoading, setMockLoading]     = useState(false);
  const [waMockLoading, setWaMockLoading] = useState(false);
  const [escalatedIds, setEscalatedIds]   = useState<Set<string>>(new Set());
  const router = useRouter();

  const fetchConversations = useCallback(async () => {
    const qs = new URLSearchParams();
    if (filter === "likelyOrder") qs.set("likelyOrder", "1");
    else if (filter === "unread")  qs.set("unreadOnly", "1");
    else if (filter === "linked")  qs.set("linked", "1");
    if (channel !== "all") qs.set("channel", channel);

    const res = await fetch(`/api/fb/conversations?${qs}`, {
      headers: { "x-admin-key": adminKey },
    });
    if (res.ok) {
      const d = await res.json() as { conversations: FbConversation[]; fbConfigured: boolean; waConfigured: boolean };
      setConversations(d.conversations);
      setFbConfigured(d.fbConfigured);
      setWaConfigured(d.waConfigured);
    }
    setLoading(false);
  }, [adminKey, filter, channel]);

  const fetchEscalations = useCallback(async () => {
    const res = await fetch("/api/escalations", { headers: { "x-admin-key": adminKey } });
    if (res.ok) {
      const d = await res.json() as { escalations: Array<{ type: string; id: string }> };
      setEscalatedIds(new Set(d.escalations.filter((e) => e.type === "conversation").map((e) => e.id)));
    }
  }, [adminKey]);

  useEffect(() => {
    fetchConversations();
    fetchEscalations();
    const t = setInterval(() => { fetchConversations(); fetchEscalations(); }, 15_000);
    return () => clearInterval(t);
  }, [fetchConversations, fetchEscalations]);

  const unreadTotal = conversations.filter((c) => c.unreadCount > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Inbox</h1>
            {unreadTotal > 0 && (
              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                {unreadTotal} unread
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
            Customer messages across all channels
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {fbConfigured && (
            <button onClick={async () => { await fetch("/api/fb/sync", { method: "POST", headers: { "x-admin-key": adminKey } }); fetchConversations(); }}
              className="btn-outline px-3 py-1.5 text-[13px]">
              Sync FB
            </button>
          )}
          {process.env.NODE_ENV !== "production" && (
            <>
              <button onClick={async () => { setMockLoading(true); await fetch("/api/fb/mock", { method: "POST", headers: { "x-admin-key": adminKey } }); await fetchConversations(); setMockLoading(false); }}
                disabled={mockLoading}
                className="btn-outline px-3 py-1.5 text-[13px] disabled:opacity-50">
                {mockLoading ? "…" : "FB Mock"}
              </button>
              <button onClick={async () => { setWaMockLoading(true); await fetch("/api/wa/mock", { method: "POST", headers: { "x-admin-key": adminKey } }); await fetchConversations(); setWaMockLoading(false); }}
                disabled={waMockLoading}
                className="px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{ border: "1px solid rgba(52,211,153,0.3)", color: "#34D399" }}>
                {waMockLoading ? "…" : "WA Mock"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Config warnings */}
      {!fbConfigured && (
        <div className="mb-3 rounded-xl px-4 py-3 text-[13px]"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#FCD34D" }}>
          Facebook not connected — set <code className="rounded bg-white/10 px-1">FB_PAGE_ID</code> and{" "}
          <code className="rounded bg-white/10 px-1">FB_PAGE_ACCESS_TOKEN</code>.
        </div>
      )}
      {!waConfigured && (
        <div className="mb-3 rounded-xl px-4 py-3 text-[13px]"
          style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)", color: "#6EE7B7" }}>
          WhatsApp not connected — set <code className="rounded bg-white/10 px-1">WA_PHONE_NUMBER_ID</code> and{" "}
          <code className="rounded bg-white/10 px-1">WA_ACCESS_TOKEN</code>.
        </div>
      )}

      {/* Channel tabs */}
      <div className="mb-1 flex gap-1">
        {CHANNELS.map((c) => (
          <button key={c.value} onClick={() => setChannel(c.value)}
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all"
            style={channel === c.value
              ? { background: "rgba(255,255,255,0.08)", color: c.color }
              : { color: "var(--muted)" }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Content filters */}
      <div className="mb-5 flex gap-1">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className="rounded-lg px-3 py-1.5 text-[13px] transition-all"
            style={filter === f.value
              ? { background: "rgba(200,146,14,0.12)", color: "#C8920E" }
              : { color: "var(--muted2)" }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#C8920E]" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2">
          <p className="text-white">No conversations</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Load mock data to preview the inbox
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
          {conversations.map((conv, i) => {
            const isEscalated = escalatedIds.has(conv.id);
            const isWa = conv.channel === "whatsapp";
            return (
              <button key={conv.id} onClick={() => router.push(`/admin/inbox/${conv.id}`)}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors"
                style={{
                  borderBottom: i < conversations.length - 1 ? "1px solid var(--border)" : "none",
                  borderLeft: isEscalated ? "3px solid rgba(239,68,68,0.6)" : "3px solid transparent",
                  background: "transparent",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>

                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: isWa ? "rgba(52,211,153,0.15)" : "rgba(96,165,250,0.15)",
                    color: isWa ? "#34D399" : "#60A5FA",
                    outline: `2px solid ${isWa ? "rgba(52,211,153,0.2)" : "rgba(96,165,250,0.2)"}`,
                    outlineOffset: "2px",
                  }}>
                  {conv.customerName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className={`text-[13px] font-semibold ${conv.unreadCount > 0 ? "text-white" : ""}`}
                        style={{ color: conv.unreadCount > 0 ? undefined : "var(--muted2)" }}>
                        {conv.customerName}
                      </span>
                      {/* Channel badge */}
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: isWa ? "rgba(52,211,153,0.15)" : "rgba(96,165,250,0.15)", color: isWa ? "#34D399" : "#60A5FA" }}>
                        {isWa ? "WA" : "FB"}
                      </span>
                      {isEscalated && (
                        <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">!</span>
                      )}
                      {conv.isLikelyOrder && !conv.linkedOrderNumber && (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">Order?</span>
                      )}
                      {conv.linkedOrderNumber && (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">Linked</span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px]" style={{ color: "var(--muted)" }}>
                      {relTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12px]" style={{ color: "var(--muted)" }}>
                    {conv.lastMessageSnippet || "No messages"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
