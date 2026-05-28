"use client";

import {
  use, useEffect, useRef, useState, useCallback, useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "../_lib/AdminAuthContext";
import { Sidebar, SIDEBAR_ICONS } from "@/components/admin/Sidebar";
import { ConvertOrderModal } from "@/components/admin/ConvertOrderModal";
import type { FbConversation, FbMessage, MessageSignals } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListFilter    = "all" | "likelyOrder" | "unread" | "linked";
type ChannelFilter = "all" | "facebook" | "whatsapp";

// ─── Column width defaults & limits ──────────────────────────────────────────

const COL1_DEFAULT = 264;
const COL3_DEFAULT = 248;
const COL_MIN      = 160;
const COL_MAX      = 500;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const sp          = use(searchParams);
  const initialConv = sp.conv ?? null;
  const { adminKey, ready } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !adminKey) router.replace("/admin");
  }, [ready, adminKey, router]);

  if (!ready || !adminKey) return null;
  return <Inbox adminKey={adminKey} initialConvId={initialConv} />;
}

// ─── Main inbox component ─────────────────────────────────────────────────────

function Inbox({ adminKey, initialConvId }: { adminKey: string; initialConvId: string | null }) {
  const router = useRouter();

  // ── Conversation list ─────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<FbConversation[]>([]);
  const [fbConfigured,  setFbConfigured]  = useState(true);
  const [waConfigured,  setWaConfigured]  = useState(false);
  const [listFilter,    setListFilter]    = useState<ListFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [listLoading,   setListLoading]   = useState(true);
  const [escalatedIds,  setEscalatedIds]  = useState<Set<string>>(new Set());
  const [fbMock,        setFbMock]        = useState(false);
  const [waMock,        setWaMock]        = useState(false);

  // ── Thread ────────────────────────────────────────────────────────────────
  const [selectedId,    setSelectedId]    = useState<string | null>(initialConvId);
  const [selectedConv,  setSelectedConv]  = useState<FbConversation | null>(null);
  const [messages,      setMessages]      = useState<FbMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  // ── Reply ─────────────────────────────────────────────────────────────────
  const [replyText,    setReplyText]    = useState("");
  const [sending,      setSending]      = useState(false);
  const [replyFocused, setReplyFocused] = useState(false);

  // ── AI draft ──────────────────────────────────────────────────────────────
  const [aiDraft,   setAiDraft]   = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // ── Convert modal ─────────────────────────────────────────────────────────
  const [showConvert,    setShowConvert]    = useState(false);
  const [convertedOrder, setConvertedOrder] = useState<string | null>(null);

  // ── Resizable columns ─────────────────────────────────────────────────────
  const [col1Width, setCol1Width] = useState(COL1_DEFAULT);
  const [col3Width, setCol3Width] = useState(COL3_DEFAULT);
  const dragging = useRef<"col1" | "col3" | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current) return;
      e.preventDefault();
      if (dragging.current === "col1") {
        setCol1Width((w) => Math.max(COL_MIN, Math.min(COL_MAX, w + e.movementX)));
      } else {
        setCol3Width((w) => Math.max(COL_MIN, Math.min(COL_MAX, w - e.movementX)));
      }
    }
    function onUp() {
      if (dragging.current) {
        dragging.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startDrag(col: "col1" | "col3") {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = col;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    };
  }

  const bottomRef        = useRef<HTMLDivElement>(null);
  const msgsContainerRef = useRef<HTMLDivElement>(null);
  const [atBottom,       setAtBottom]       = useState(true);
  const [showScrollBtn,  setShowScrollBtn]  = useState(false);

  // ── Signals ───────────────────────────────────────────────────────────────
  const allSignals = useMemo<MessageSignals>(() => {
    const s: MessageSignals = {
      urls: [], phones: [], addressHints: [], prices: [], sizes: [],
      isLikelyOrder: false, score: 0,
    };
    for (const m of messages) {
      if (m.fromType !== "customer" || !m.signalsJson) continue;
      const sig = JSON.parse(m.signalsJson) as MessageSignals;
      s.urls.push(...sig.urls);
      s.phones.push(...sig.phones);
      s.addressHints.push(...sig.addressHints);
      s.prices.push(...sig.prices);
      s.sizes.push(...sig.sizes);
      if (sig.isLikelyOrder) s.isLikelyOrder = true;
      s.score = Math.max(s.score, sig.score);
      if (sig.extractedCity && !s.extractedCity) s.extractedCity = sig.extractedCity;
      if (sig.extractedName && !s.extractedName) s.extractedName = sig.extractedName;
    }
    s.urls         = [...new Set(s.urls)];
    s.phones       = [...new Set(s.phones)];
    s.addressHints = [...new Set(s.addressHints)];
    return s;
  }, [messages]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchList = useCallback(async () => {
    const qs = new URLSearchParams();
    if (listFilter === "likelyOrder") qs.set("likelyOrder", "1");
    else if (listFilter === "unread")  qs.set("unreadOnly",  "1");
    else if (listFilter === "linked")  qs.set("linked",      "1");
    if (channelFilter !== "all") qs.set("channel", channelFilter);

    const res = await fetch(`/api/fb/conversations?${qs}`, {
      headers: { "x-admin-key": adminKey },
    });
    if (res.ok) {
      const d = await res.json() as {
        conversations: FbConversation[];
        fbConfigured: boolean;
        waConfigured: boolean;
      };
      setConversations(d.conversations);
      setFbConfigured(d.fbConfigured);
      setWaConfigured(d.waConfigured);
    }
    setListLoading(false);
  }, [adminKey, listFilter, channelFilter]);

  const fetchEscalations = useCallback(async () => {
    const res = await fetch("/api/escalations", { headers: { "x-admin-key": adminKey } });
    if (res.ok) {
      const d = await res.json() as { escalations: Array<{ type: string; id: string }> };
      setEscalatedIds(new Set(
        d.escalations.filter((e) => e.type === "conversation").map((e) => e.id)
      ));
    }
  }, [adminKey]);

  useEffect(() => {
    fetchList();
    fetchEscalations();
    const t = setInterval(() => { fetchList(); fetchEscalations(); }, 15_000);
    return () => clearInterval(t);
  }, [fetchList, fetchEscalations]);

  const fetchThread = useCallback(async (convId: string) => {
    setThreadLoading(true);
    const res = await fetch(`/api/fb/conversations/${convId}`, {
      headers: { "x-admin-key": adminKey },
    });
    if (res.ok) {
      const d = await res.json() as { conversation: FbConversation; messages: FbMessage[] };
      setSelectedConv(d.conversation);
      setMessages(d.messages);
    }
    setThreadLoading(false);
  }, [adminKey]);

  const fetchAiDraft = useCallback(async (convId: string) => {
    setAiDraft(null);
    setAiLoading(true);
    try {
      const res = await fetch(`/api/fb/conversations/${convId}/ai-reply`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) {
        const d = await res.json() as { suggestion?: string };
        setAiDraft(d.suggestion ?? null);
      }
    } catch { /* silent */ }
    setAiLoading(false);
  }, [adminKey]);

  const selectConversation = useCallback(async (convId: string) => {
    setSelectedId(convId);
    setReplyText("");
    setAiDraft(null);
    setConvertedOrder(null);
    setShowConvert(false);

    fetch(`/api/fb/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "markRead" }),
    });

    await fetchThread(convId);
    fetchAiDraft(convId);
    router.replace(`/admin/inbox?conv=${encodeURIComponent(convId)}`, { scroll: false });
  }, [adminKey, fetchThread, fetchAiDraft, router]);

  useEffect(() => {
    if (initialConvId) selectConversation(initialConvId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new messages only when already near bottom
  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, atBottom]);

  // Always reset to bottom when selecting a new conversation
  useEffect(() => {
    setAtBottom(true);
    setShowScrollBtn(false);
  }, [selectedId]);

  function handleMsgsScroll() {
    const el = msgsContainerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = dist < 140;
    setAtBottom(near);
    setShowScrollBtn(!near);
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
    setAtBottom(true);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function sendReply(text: string) {
    if (!selectedId || !text.trim()) return;
    setSending(true);
    const res = await fetch(`/api/fb/conversations/${selectedId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ text: text.trim() }),
    });
    if (res.ok) {
      setReplyText("");
      setAiDraft(null);
      await fetchThread(selectedId);
      fetchList();
    }
    setSending(false);
  }

  async function handleArchive() {
    if (!selectedId) return;
    await fetch(`/api/fb/conversations/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "archive" }),
    });
    setSelectedId(null);
    setSelectedConv(null);
    setMessages([]);
    setAiDraft(null);
    router.replace("/admin/inbox", { scroll: false });
    fetchList();
  }

  const unreadTotal = conversations.filter((c) => c.unreadCount > 0).length;
  const isWa        = selectedConv?.channel === "whatsapp";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* Icon-only sidebar — frees up space for 3 columns */}
      <Sidebar collapsed />

      {/* Three-column workspace */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ marginLeft: SIDEBAR_ICONS }}
      >

        {/* ── Column 1: Conversation list ───────────────────────────── */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            width: col1Width,
            minWidth: COL_MIN,
            maxWidth: COL_MAX,
            flexShrink: 0,
            background: "var(--bg2)",
          }}
        >
          {/* Col-1 header */}
          <div className="shrink-0 px-4 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-white">Inbox</span>
                {unreadTotal > 0 && (
                  <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadTotal}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-0.5">
                {fbConfigured && (
                  <IconBtn
                    title="Sync Facebook"
                    onClick={async () => {
                      await fetch("/api/fb/sync", { method: "POST", headers: { "x-admin-key": adminKey } });
                      fetchList();
                    }}
                  >
                    <SyncIcon />
                  </IconBtn>
                )}
                {process.env.NODE_ENV !== "production" && (
                  <>
                    <TextBtn
                      disabled={fbMock}
                      title="Load FB mock data"
                      color="var(--muted)"
                      onClick={async () => {
                        setFbMock(true);
                        await fetch("/api/fb/mock", { method: "POST", headers: { "x-admin-key": adminKey } });
                        await fetchList();
                        setFbMock(false);
                      }}
                    >
                      {fbMock ? "…" : "FB"}
                    </TextBtn>
                    <TextBtn
                      disabled={waMock}
                      title="Load WA mock data"
                      color="#34D399"
                      onClick={async () => {
                        setWaMock(true);
                        await fetch("/api/wa/mock", { method: "POST", headers: { "x-admin-key": adminKey } });
                        await fetchList();
                        setWaMock(false);
                      }}
                    >
                      {waMock ? "…" : "WA"}
                    </TextBtn>
                  </>
                )}
              </div>
            </div>

            {/* Channel tabs */}
            <div
              className="mb-2 flex gap-0.5 rounded-lg p-0.5"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {(["all", "facebook", "whatsapp"] as ChannelFilter[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setChannelFilter(c)}
                  className="flex-1 rounded-[6px] py-1 text-[11px] font-medium capitalize transition-all"
                  style={channelFilter === c
                    ? { background: "var(--bg3)", color: "var(--text)" }
                    : { color: "var(--muted)" }}
                >
                  {c === "all" ? "All" : (
                    <span className="flex items-center justify-center gap-1">
                      {c === "facebook"
                        ? <FacebookBadgeIcon size={12} />
                        : <WhatsAppBadgeIcon size={12} />}
                      {c === "facebook" ? "FB" : "WA"}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content filters */}
            <div className="flex gap-0.5">
              {([["all","All"],["likelyOrder","Order?"],["unread","Unread"],["linked","Linked"]] as [ListFilter,string][]).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setListFilter(v)}
                  className="rounded-lg px-2 py-1 text-[11px] transition-all"
                  style={listFilter === v
                    ? { background: "rgba(200,146,14,0.15)", color: "#C8920E" }
                    : { color: "var(--muted)" }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Config warnings */}
          {(!fbConfigured || !waConfigured) && (
            <div className="shrink-0 px-3 pt-2 space-y-1">
              {!fbConfigured && (
                <p className="rounded-lg px-2.5 py-1.5 text-[11px]"
                  style={{ background: "rgba(245,158,11,0.08)", color: "#FCD34D" }}>
                  FB not connected
                </p>
              )}
              {!waConfigured && (
                <p className="rounded-lg px-2.5 py-1.5 text-[11px]"
                  style={{ background: "rgba(52,211,153,0.06)", color: "#6EE7B7" }}>
                  WA not connected
                </p>
              )}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="flex h-16 items-center justify-center"><Spinner /></div>
            ) : conversations.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px]" style={{ color: "var(--muted)" }}>
                No conversations
              </p>
            ) : (
              conversations.map((conv) => {
                const isActive    = conv.id === selectedId;
                const isConvWa    = conv.channel === "whatsapp";
                const isEscalated = escalatedIds.has(conv.id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-all"
                    style={{
                      background:  isActive ? "rgba(200,146,14,0.08)" : "transparent",
                      borderLeft:  isActive ? "2px solid #C8920E" : isEscalated ? "2px solid rgba(239,68,68,0.5)" : "2px solid transparent",
                      borderBottom: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                      style={{
                        background: isConvWa ? "rgba(52,211,153,0.15)" : "rgba(96,165,250,0.15)",
                        color:      isConvWa ? "#34D399" : "#60A5FA",
                      }}
                    >
                      {conv.customerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="truncate text-[13px] font-medium"
                            style={{ color: conv.unreadCount > 0 ? "var(--text)" : "var(--muted2)" }}
                          >
                            {conv.customerName}
                          </span>
                          {isConvWa
                            ? <WhatsAppBadgeIcon size={14} />
                            : <FacebookBadgeIcon size={14} />
                          }
                        </div>
                        <span className="shrink-0 text-[10px]" style={{ color: "var(--muted)" }}>
                          {relTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <p className="flex-1 truncate text-[11px]" style={{ color: "var(--muted)" }}>
                          {conv.lastMessageSnippet || "No messages"}
                        </p>
                        {isEscalated && <span className="shrink-0 text-[10px] text-red-400">!</span>}
                        {conv.isLikelyOrder && !conv.linkedOrderNumber && (
                          <span className="shrink-0 rounded-full bg-amber-500/20 px-1 py-0.5 text-[9px] text-amber-300">✦</span>
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-blue-500 px-1 py-0.5 text-[9px] font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Drag handle 1 ─────────────────────────────────────────── */}
        <ResizeHandle onMouseDown={startDrag("col1")} />

        {/* ── Column 2: Thread ──────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden" style={{ minWidth: 280 }}>
          {!selectedConv ? (
            <EmptyThread />
          ) : (
            <>
              {/* Thread header */}
              <div
                className="flex shrink-0 items-center justify-between gap-3 px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{
                      background: isWa ? "rgba(52,211,153,0.15)" : "rgba(96,165,250,0.15)",
                      color:      isWa ? "#34D399" : "#60A5FA",
                    }}
                  >
                    {selectedConv.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14px] font-semibold text-white">
                        {selectedConv.customerName}
                      </p>
                      {isWa
                        ? <WhatsAppBadgeIcon size={16} />
                        : <FacebookBadgeIcon size={16} />
                      }
                    </div>
                    {selectedConv.linkedOrderNumber && (
                      <Link href="/admin/orders" className="text-[11px] text-emerald-400 hover:text-emerald-300">
                        ↳ {selectedConv.linkedOrderNumber}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {convertedOrder && (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                      ✓ {convertedOrder}
                    </span>
                  )}
                  {!selectedConv.linkedOrderNumber && allSignals.isLikelyOrder && (
                    <button onClick={() => setShowConvert(true)} className="btn-gold px-3 py-1.5 text-[12px]">
                      Convert to Order
                    </button>
                  )}
                  <button onClick={handleArchive} className="btn-outline px-3 py-1.5 text-[12px]">
                    Archive
                  </button>
                </div>
              </div>

              {/* Messages scroll area */}
              <div className="relative flex-1 overflow-hidden">
                <div
                  ref={msgsContainerRef}
                  onScroll={handleMsgsScroll}
                  className="h-full overflow-y-auto"
                  style={{
                    padding: "20px 20px 8px",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,255,255,0.08) transparent",
                    // Subtle dot-grid wallpaper — WhatsApp-like background texture
                    backgroundImage:
                      "radial-gradient(circle, rgba(255,255,255,0.018) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                >
                  {threadLoading ? (
                    <div className="flex h-20 items-center justify-center">
                      <Spinner />
                    </div>
                  ) : (
                    <MessageList
                      messages={messages}
                      isWa={isWa}
                      customerName={selectedConv!.customerName}
                    />
                  )}

                  {/* AI Draft bubble */}
                  {(aiLoading || aiDraft) && (
                    <div className="mt-1 flex justify-end">
                      <div style={{ maxWidth: "72%" }}>
                        {aiLoading ? (
                          <div
                            className="flex items-center gap-2.5 px-4 py-3"
                            style={{
                              borderRadius: "18px 18px 4px 18px",
                              background: "rgba(200,146,14,0.07)",
                              border: "1px solid rgba(200,146,14,0.2)",
                            }}
                          >
                            <Spinner size="sm" />
                            <span className="text-[12px]" style={{ color: "var(--muted)" }}>
                              AI is drafting a reply…
                            </span>
                          </div>
                        ) : aiDraft ? (
                          <div
                            className="overflow-hidden"
                            style={{
                              borderRadius: "18px 18px 4px 18px",
                              border: "1px solid rgba(200,146,14,0.4)",
                              background: "rgba(200,146,14,0.06)",
                            }}
                          >
                            <div
                              className="flex items-center gap-2 px-3 py-1.5"
                              style={{
                                borderBottom: "1px solid rgba(200,146,14,0.15)",
                                background: "rgba(200,146,14,0.1)",
                              }}
                            >
                              <SparklesIcon />
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: "#C8920E" }}
                              >
                                AI Draft
                              </span>
                            </div>
                            <p
                              className="whitespace-pre-wrap px-4 py-3 text-[13px] leading-relaxed"
                              style={{ color: "var(--text)" }}
                            >
                              {aiDraft}
                            </p>
                            <div
                              className="flex items-center gap-2 px-3 py-2.5"
                              style={{ borderTop: "1px solid rgba(200,146,14,0.12)" }}
                            >
                              <button
                                onClick={() => sendReply(aiDraft)}
                                disabled={sending}
                                className="btn-gold flex-1 py-1.5 text-[12px] font-semibold disabled:opacity-50"
                              >
                                {sending ? "Sending…" : "↑ Send this reply"}
                              </button>
                              <button
                                onClick={() => { setReplyText(aiDraft); setAiDraft(null); }}
                                className="btn-outline px-3 py-1.5 text-[12px]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setAiDraft(null)}
                                className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                                style={{ color: "var(--muted)" }}
                              >
                                <XIcon />
                              </button>
                            </div>
                          </div>
                        ) : null}
                    </div>
                    </div>
                  )}

                  <div ref={bottomRef} className="h-4" />
                </div>

                {/* Scroll-to-bottom FAB */}
                {showScrollBtn && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-6 right-5 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105"
                    style={{
                      background: "var(--bg2)",
                      border: "1px solid rgba(200,146,14,0.4)",
                      color: "#C8920E",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3v10M4 9l4 4 4-4" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Reply box */}
              <div
                className="shrink-0 px-4 py-3"
                style={{ borderTop: "1px solid var(--border)", background: "var(--bg2)" }}
              >
                {/* Card-style input */}
                <div
                  className="overflow-hidden rounded-xl transition-all"
                  style={{
                    border: replyFocused
                      ? "1px solid rgba(200,146,14,0.55)"
                      : "1px solid var(--border)",
                    background: "rgba(255,255,255,0.03)",
                    boxShadow: replyFocused ? "0 0 0 3px rgba(200,146,14,0.08)" : "none",
                  }}
                  onFocusCapture={() => setReplyFocused(true)}
                  onBlurCapture={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node))
                      setReplyFocused(false);
                  }}
                >
                  {/* Textarea — transparent, no inner border */}
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply(replyText);
                    }}
                    placeholder={`Message via ${isWa ? "WhatsApp" : "Messenger"}…`}
                    rows={3}
                    className="block w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[13px] text-white outline-none placeholder-[var(--muted)]"
                  />

                  {/* Action bar */}
                  <div
                    className="flex items-center justify-between gap-2 px-3 py-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    {/* AI generate button */}
                    <button
                      type="button"
                      onClick={() => selectedId && fetchAiDraft(selectedId)}
                      disabled={aiLoading}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#C8920E]/10 disabled:opacity-40"
                      style={{ color: "#C8920E" }}
                    >
                      {aiLoading
                        ? <Spinner size="sm" />
                        : <SparklesIcon />
                      }
                      <span>
                        {aiLoading ? "Generating…" : aiDraft ? "Regenerate" : "AI reply"}
                      </span>
                    </button>

                    {/* Right: hint + send */}
                    <div className="flex items-center gap-3">
                      <span className="hidden text-[10px] sm:block" style={{ color: "var(--muted)" }}>
                        Ctrl+Enter
                      </span>
                      <button
                        type="button"
                        onClick={() => sendReply(replyText)}
                        disabled={sending || !replyText.trim()}
                        className="btn-gold flex items-center gap-2 px-4 py-2 text-[13px] disabled:opacity-40"
                      >
                        {sending ? <Spinner size="sm" /> : <SendIcon />}
                        <span>{sending ? "Sending" : "Send"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Drag handle 2 ─────────────────────────────────────────── */}
        {selectedConv && <ResizeHandle onMouseDown={startDrag("col3")} />}

        {/* ── Column 3: Customer / signals panel ────────────────────── */}
        {selectedConv && (
          <div
            className="flex flex-col overflow-y-auto"
            style={{
              width: col3Width,
              minWidth: COL_MIN,
              maxWidth: COL_MAX,
              flexShrink: 0,
              background: "var(--bg2)",
            }}
          >
            <CustomerPanel
              conv={selectedConv}
              signals={allSignals}
              aiDraft={aiDraft}
              aiLoading={aiLoading}
              convertedOrder={convertedOrder}
              onConvertClick={() => setShowConvert(true)}
              onSendAiDraft={() => aiDraft && sendReply(aiDraft)}
              onRegenerateAi={() => selectedId && fetchAiDraft(selectedId)}
            />
          </div>
        )}
      </div>

      {/* Convert modal */}
      {showConvert && selectedConv && (
        <ConvertOrderModal
          adminKey={adminKey}
          convId={selectedConv.id}
          customerName={selectedConv.customerName}
          signals={allSignals}
          onSuccess={(orderNumber) => {
            setConvertedOrder(orderNumber);
            setShowConvert(false);
            if (selectedId) fetchThread(selectedId);
            fetchList();
          }}
          onClose={() => setShowConvert(false)}
        />
      )}
    </div>
  );
}

// ─── Drag handle ──────────────────────────────────────────────────────────────

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      title="Drag to resize"
      className="group relative flex w-1.5 shrink-0 cursor-col-resize select-none items-center justify-center transition-colors hover:bg-[#C8920E]/15"
      style={{ background: "var(--border)", zIndex: 20 }}
    >
      {/* Dots on hover */}
      <div className="pointer-events-none absolute flex flex-col gap-[4px] opacity-0 transition-opacity group-hover:opacity-100">
        <div className="h-[4px] w-[4px] rounded-full bg-[#C8920E]" />
        <div className="h-[4px] w-[4px] rounded-full bg-[#C8920E]" />
        <div className="h-[4px] w-[4px] rounded-full bg-[#C8920E]" />
        <div className="h-[4px] w-[4px] rounded-full bg-[#C8920E]" />
      </div>
    </div>
  );
}

// ─── Customer panel ───────────────────────────────────────────────────────────

function CustomerPanel({
  conv, signals, aiDraft, aiLoading, convertedOrder,
  onConvertClick, onSendAiDraft, onRegenerateAi,
}: {
  conv: FbConversation;
  signals: MessageSignals;
  aiDraft: string | null;
  aiLoading: boolean;
  convertedOrder: string | null;
  onConvertClick: () => void;
  onSendAiDraft: () => void;
  onRegenerateAi: () => void;
}) {
  const isWa = conv.channel === "whatsapp";
  const sep  = { borderBottom: "1px solid var(--border)" } as const;

  return (
    <>
      {/* Customer info */}
      <section className="p-4 space-y-3" style={sep}>
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Customer
        </p>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
            style={{ background: isWa ? "rgba(52,211,153,0.15)" : "rgba(96,165,250,0.15)", color: isWa ? "#34D399" : "#60A5FA" }}
          >
            {conv.customerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{conv.customerName}</p>
            <p className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
              {isWa ? <WhatsAppBadgeIcon size={12} /> : <FacebookBadgeIcon size={12} />}
              {isWa ? "WhatsApp" : "Facebook Messenger"}
            </p>
          </div>
        </div>
        {signals.phones.length > 0 && (
          <a
            href={`tel:${signals.phones[0]}`}
            className="flex items-center gap-2 text-[12px] text-emerald-400 hover:text-emerald-300"
          >
            <PhoneIcon /> {signals.phones[0]}
          </a>
        )}
        {(signals.extractedCity || signals.addressHints[0]) && (
          <p className="flex items-start gap-2 text-[12px]" style={{ color: "var(--muted2)" }}>
            <PinIcon />
            <span className="flex-1">{signals.extractedCity || signals.addressHints[0]}</span>
          </p>
        )}
        {conv.linkedOrderNumber ? (
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-emerald-300 hover:text-emerald-200 transition-colors"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            ✓ {conv.linkedOrderNumber}
          </Link>
        ) : convertedOrder ? (
          <span
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-emerald-300"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            ✓ {convertedOrder}
          </span>
        ) : signals.isLikelyOrder ? (
          <button onClick={onConvertClick} className="btn-gold w-full py-2 text-[12px]">
            Convert to Order
          </button>
        ) : null}
      </section>

      {/* Signals */}
      {(signals.urls.length > 0 || signals.sizes.length > 0 || signals.prices.length > 0) && (
        <section className="p-4 space-y-3" style={sep}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Signals
            </p>
            {signals.score > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-12 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${signals.score}%`,
                      background: signals.score >= 70 ? "#10B981" : signals.score >= 40 ? "#C8920E" : "#64748B",
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: signals.score >= 70 ? "#34D399" : signals.score >= 40 ? "#C8920E" : "var(--muted)" }}
                >
                  {signals.score}
                </span>
              </div>
            )}
          </div>

          {signals.urls.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                {signals.urls.length} Product link{signals.urls.length !== 1 ? "s" : ""}
              </p>
              {signals.urls.map((url) => {
                let host = url;
                try { host = new URL(url).hostname.replace("www.", ""); } catch { /* noop */ }
                return (
                  <a
                    key={url} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 truncate rounded-lg px-2.5 py-1.5 text-[11px] transition-colors"
                    style={{ background: "rgba(200,146,14,0.08)", color: "#C8920E", border: "1px solid rgba(200,146,14,0.15)" }}
                  >
                    ↗ {host}
                  </a>
                );
              })}
            </div>
          )}

          {signals.sizes.length > 0 && (
            <div>
              <p className="mb-1 text-[10px]" style={{ color: "var(--muted)" }}>Sizes</p>
              <div className="flex flex-wrap gap-1">
                {signals.sizes.map((sz, i) => (
                  <span key={i} className="rounded-md px-2 py-0.5 text-[11px] font-medium text-amber-300"
                    style={{ background: "rgba(245,158,11,0.1)" }}>{sz}</span>
                ))}
              </div>
            </div>
          )}

          {signals.prices.length > 0 && (
            <div>
              <p className="mb-1 text-[10px]" style={{ color: "var(--muted)" }}>Prices</p>
              <div className="flex flex-wrap gap-1">
                {signals.prices.map((pr, i) => (
                  <span key={i} className="rounded-md px-2 py-0.5 text-[11px] font-medium text-violet-300"
                    style={{ background: "rgba(139,92,246,0.1)" }}>{pr}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* AI reply */}
      <section className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            AI Reply
          </p>
          <button
            onClick={onRegenerateAi}
            disabled={aiLoading}
            className="rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-colors hover:bg-white/5 disabled:opacity-40"
            style={{ color: "#C8920E", border: "1px solid rgba(200,146,14,0.3)" }}
          >
            {aiLoading ? "…" : "↻ Regen"}
          </button>
        </div>

        {aiLoading ? (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "rgba(200,146,14,0.05)", border: "1px solid rgba(200,146,14,0.15)" }}
          >
            <Spinner size="sm" />
            <span className="text-[11px]" style={{ color: "var(--muted)" }}>Generating…</span>
          </div>
        ) : aiDraft ? (
          <div className="space-y-2">
            <p
              className="rounded-lg px-3 py-2.5 text-[12px] leading-relaxed"
              style={{ background: "rgba(200,146,14,0.05)", border: "1px solid rgba(200,146,14,0.15)", color: "var(--text)" }}
            >
              {aiDraft}
            </p>
            <button onClick={onSendAiDraft} className="btn-gold w-full py-1.5 text-[12px] font-semibold">
              ↑ Send this reply
            </button>
          </div>
        ) : (
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>
            Click ↻ or the ✦ button in the reply box.
          </p>
        )}
      </section>
    </>
  );
}

// ─── Message grouping + rendering ────────────────────────────────────────────

interface MsgGroup {
  fromType: "customer" | "page";
  messages: FbMessage[];
}

function groupMessages(messages: FbMessage[]): MsgGroup[] {
  const groups: MsgGroup[] = [];
  const GAP = 5 * 60 * 1000; // 5 min gap = new group
  for (const msg of messages) {
    const last    = groups[groups.length - 1];
    const lastMsg = last?.messages[last.messages.length - 1];
    const gap     = lastMsg
      ? new Date(msg.createdAt).getTime() - new Date(lastMsg.createdAt).getTime()
      : Infinity;
    if (last && last.fromType === msg.fromType && gap < GAP) {
      last.messages.push(msg);
    } else {
      groups.push({ fromType: msg.fromType as MsgGroup["fromType"], messages: [msg] });
    }
  }
  return groups;
}

function msgDate(iso: string) { return iso.slice(0, 10); }

function formatDaySeparator(iso: string): string {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)  return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: diff > 365 ? "numeric" : undefined });
}

function MessageList({
  messages,
  isWa,
  customerName,
}: {
  messages: FbMessage[];
  isWa: boolean;
  customerName: string;
}) {
  if (messages.length === 0) {
    return (
      <p className="py-8 text-center text-[12px]" style={{ color: "var(--muted)" }}>
        No messages yet
      </p>
    );
  }

  const groups  = groupMessages(messages);
  let lastDate  = "";

  return (
    <>
      {groups.map((group, gi) => {
        const groupFirstDate = msgDate(group.messages[0].createdAt);
        const showDay        = groupFirstDate !== lastDate;
        if (showDay) lastDate = groupFirstDate;

        return (
          <div key={gi}>
            {showDay && <DaySeparator iso={group.messages[0].createdAt} />}

            {/* Spacing between groups from different senders */}
            <div style={{ marginTop: gi > 0 && !showDay ? 10 : 0 }}>
              {group.messages.map((msg, mi) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isWa={isWa}
                  isFirst={mi === 0}
                  isLast={mi === group.messages.length - 1}
                  customerName={customerName}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function DaySeparator({ iso }: { iso: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      <span
        className="rounded-full px-3 py-0.5 text-[11px] font-medium"
        style={{
          background: "rgba(255,255,255,0.06)",
          color: "var(--muted2)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {formatDaySeparator(iso)}
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isWa,
  isFirst,
  isLast,
  customerName,
}: {
  message: FbMessage;
  isWa: boolean;
  isFirst: boolean;
  isLast: boolean;
  customerName: string;
}) {
  const isPage  = message.fromType === "page";
  const signals = message.signalsJson
    ? (JSON.parse(message.signalsJson) as MessageSignals)
    : null;

  // ── Bubble colors (channel-aware) ────────────────────────────────────────
  // Sent (page → customer):
  //   WA  → emerald tint, matches WhatsApp sent bubble in dark mode
  //   FB  → gold brand tint
  // Received (customer → page):
  //   Both channels → same neutral dark glass bubble
  const sentBg     = isWa ? "rgba(0,110,88,0.45)"   : "rgba(200,146,14,0.17)";
  const sentBorder = isWa ? "rgba(0,168,130,0.3)"    : "rgba(200,146,14,0.3)";
  const recvBg     = "rgba(255,255,255,0.075)";
  const recvBorder = "rgba(255,255,255,0.07)";

  // ── Corner radii — messenger "tail" style ────────────────────────────────
  // All messages: large radius.
  // Last message in a group: the corner nearest the bottom-center gets a tight
  // radius to create a subtle directional pointer (WhatsApp-style).
  //   CSS order: top-left  top-right  bottom-right  bottom-left
  const R = "18px", S = "5px";
  const radius = !isLast
    ? `${R} ${R} ${R} ${R}`                        // mid-group: pill
    : isPage
      ? `${R} ${R} ${S} ${R}`                      // sent last: bottom-right tight
      : `${R} ${R} ${R} ${S}`;                     // recv last: bottom-left tight

  // Tight vertical spacing within a group
  const marginTop = isFirst ? 0 : 2;

  return (
    <div
      className={`flex items-end gap-2 ${isPage ? "justify-end" : "justify-start"}`}
      style={{ marginTop }}
    >
      {/* Customer avatar — shown only at the end of a received group */}
      {!isPage && (
        <div className="w-7 shrink-0 self-end">
          {isLast ? (
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{
                background: isWa ? "rgba(52,211,153,0.2)" : "rgba(96,165,250,0.2)",
                color:      isWa ? "#34D399"               : "#60A5FA",
              }}
            >
              {customerName.charAt(0).toUpperCase()}
            </div>
          ) : null}
        </div>
      )}

      {/* Bubble + timestamp */}
      <div style={{ maxWidth: "72%" }}>
        <div
          className="px-3.5 py-2.5 text-[13.5px] leading-[1.55]"
          style={{
            borderRadius: radius,
            background:   isPage ? sentBg   : recvBg,
            border:       `1px solid ${isPage ? sentBorder : recvBorder}`,
            color: "var(--text)",
          }}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>

          {/* Inline signals (links / phones) */}
          {signals && (signals.urls.length > 0 || signals.phones.length > 0) && (
            <div
              className="mt-2 space-y-1 pt-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              {signals.urls.slice(0, 3).map((url) => {
                let host = url;
                try { host = new URL(url).hostname.replace("www.", ""); } catch { /* noop */ }
                return (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-[11px] hover:underline"
                    style={{ color: "#C8920E" }}
                  >
                    ↗ {host}
                  </a>
                );
              })}
              {signals.phones.map((ph) => (
                <a key={ph} href={`tel:${ph}`} className="block text-[11px] text-emerald-400">
                  {ph}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp — only on last bubble in group */}
        {isLast && (
          <p
            className={`mt-1 text-[10px] ${isPage ? "text-right pr-1" : "text-left pl-1"}`}
            style={{ color: "var(--muted)" }}
          >
            {new Date(message.createdAt).toLocaleTimeString("en-GB", {
              hour:   "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyThread() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3" style={{ color: "var(--muted)" }}>
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "rgba(200,146,14,0.08)", border: "1px solid rgba(200,146,14,0.2)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C8920E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <p className="text-[14px] font-medium text-white">Select a conversation</p>
      <p className="text-[12px]">Choose from the list on the left</p>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div className={`${size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"} animate-spin rounded-full border-2 border-white/10 border-t-[#C8920E]`} />
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick} title={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
      style={{ color: "var(--muted)" }}
    >
      {children}
    </button>
  );
}

function TextBtn({
  children, onClick, disabled, title, color,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title: string; color: string }) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      className="rounded-lg px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
      style={{ color }}
    >
      {children}
    </button>
  );
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      {/* Main 4-pointed star */}
      <path d="M7 3.5L8.3 6.7L11.5 8L8.3 9.3L7 12.5L5.7 9.3L2.5 8L5.7 6.7Z" />
      {/* Small top-right sparkle */}
      <path d="M12.5 1L13.2 2.8L15 3.5L13.2 4.2L12.5 6L11.8 4.2L10 3.5L11.8 2.8Z" opacity="0.8" />
      {/* Tiny dot bottom-left */}
      <circle cx="3" cy="13.5" r="1.1" opacity="0.55" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 1.5L7 9" />
      <path d="M14.5 1.5L10 14.5L7 9L1.5 6L14.5 1.5Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8A6 6 0 102 8" />
      <path d="M14 8l-2-2M14 8l2-2" />
    </svg>
  );
}

function FacebookBadgeIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#1877F2" />
      {/* Facebook "f" lettermark */}
      <path
        fill="white"
        d="M12.8 10.3h-2V17H8.4v-6.7H7V8.4h1.4V7.1C8.4 5.4 9.3 4 11.2 4H13v2.3h-1.1c-.5 0-.7.3-.7.8v1.3H13l-.2 1.9z"
      />
    </svg>
  );
}

function WhatsAppBadgeIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="5" fill="#25D366" />
      {/* WhatsApp speech-bubble + phone silhouette */}
      <path
        fill="white"
        d="M10 3C6.14 3 3 6.14 3 10c0 1.22.33 2.37.9 3.36L3 17l3.64-.9A7 7 0 1010 3zm3.82 9.67c-.14.4-.84.77-1.16.82-.55.1-1.24 0-2.27-.58l-.18-.1c-.91-.57-1.6-1.42-1.79-1.76-.2-.34-.05-.53.06-.68l.28-.38c.05-.06.08-.14.04-.22L8.07 8.8c-.04-.09-.13-.12-.22-.1-.1.02-.41.04-.65.32-.24.28-.9.88-.9 2.15 0 1.26.93 2.49 1.06 2.65.13.17 1.83 2.8 4.43 3.83.62.24 1.1.38 1.47.49.62.18 1.18.15 1.63.09.5-.07 1.52-.62 1.74-1.22.21-.6.21-1.11.15-1.22-.06-.1-.22-.16-.46-.28l-1.5-.75z"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h3l1.5 4L5.5 7.5c1 2 3 4 5 5L12 10.5l4 1.5v3c0 .5-.5 1-1 1C6 16 0 10 0 3c0-.5.5-1 1-1h2z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <circle cx="8" cy="6" r="3" />
      <path d="M8 9v7" />
    </svg>
  );
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60_000);
  if (m < 1)  return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
