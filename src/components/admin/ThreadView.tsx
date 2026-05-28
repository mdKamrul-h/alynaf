"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FbConversation, FbMessage, MessageSignals } from "@/lib/types";
import { ConvertOrderModal } from "./ConvertOrderModal";

interface Props { adminKey: string; convId: string }

export function ThreadView({ adminKey, convId }: Props) {
  const [conversation, setConversation] = useState<FbConversation | null>(null);
  const [messages, setMessages]         = useState<FbMessage[]>([]);
  const [replyText, setReplyText]       = useState("");
  const [sending, setSending]           = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const [showConvert, setShowConvert]   = useState(false);
  const [convertedOrder, setConvertedOrder] = useState<string | null>(null);
  const [showSignals, setShowSignals]   = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchThread = useCallback(async () => {
    const [threadRes, fbRes, waRes] = await Promise.all([
      fetch(`/api/fb/conversations/${convId}`, { headers: { "x-admin-key": adminKey } }),
      fetch("/api/fb/status",  { headers: { "x-admin-key": adminKey } }),
      fetch("/api/wa/status",  { headers: { "x-admin-key": adminKey } }),
    ]);
    if (threadRes.ok) {
      const d = await threadRes.json() as { conversation: FbConversation; messages: FbMessage[] };
      setConversation(d.conversation);
      setMessages(d.messages);
    }
    if (fbRes.ok && (await fbRes.json() as { configured: boolean }).configured) setChannelReady(true);
    if (waRes.ok && (await waRes.json() as { configured: boolean }).configured) setChannelReady(true);
  }, [adminKey, convId]);

  useEffect(() => {
    fetchThread();
    fetch(`/api/fb/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "markRead" }),
    });
  }, [adminKey, convId, fetchThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendReply() {
    const text = replyText.trim();
    if (!text) return;
    setSending(true);
    const res = await fetch(`/api/fb/conversations/${convId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ text }),
    });
    if (res.ok) { setReplyText(""); fetchThread(); }
    setSending(false);
  }

  async function handleArchive() {
    await fetch(`/api/fb/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "archive" }),
    });
    router.push("/admin/inbox");
  }

  // Aggregate & deduplicate signals from all customer messages
  const allSignals: MessageSignals = { urls: [], phones: [], addressHints: [], prices: [], sizes: [], isLikelyOrder: false, score: 0 };
  for (const msg of messages) {
    if (msg.fromType !== "customer" || !msg.signalsJson) continue;
    const s = JSON.parse(msg.signalsJson) as MessageSignals;
    allSignals.urls.push(...s.urls);
    allSignals.phones.push(...s.phones);
    allSignals.addressHints.push(...s.addressHints);
    allSignals.prices.push(...s.prices);
    allSignals.sizes.push(...s.sizes);
    if (s.isLikelyOrder) allSignals.isLikelyOrder = true;
    allSignals.score = Math.max(allSignals.score, s.score);
  }
  allSignals.urls          = [...new Set(allSignals.urls)];
  allSignals.phones        = [...new Set(allSignals.phones)];
  allSignals.addressHints  = [...new Set(allSignals.addressHints)];

  const hasSignals = allSignals.urls.length > 0 || allSignals.phones.length > 0 || allSignals.sizes.length > 0;
  const isWa = conversation?.channel === "whatsapp";

  if (!conversation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#C8920E]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col" style={{ color: "var(--text)" }}>

      {/* Thread header */}
      <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/admin/inbox"
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors shrink-0"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            Inbox
          </Link>
          <div className="h-4 w-px" style={{ background: "var(--border)" }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white truncate">{conversation.customerName}</p>
              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ background: isWa ? "rgba(52,211,153,0.15)" : "rgba(96,165,250,0.15)", color: isWa ? "#34D399" : "#60A5FA" }}>
                {isWa ? "WA" : "FB"}
              </span>
            </div>
            {conversation.linkedOrderNumber && (
              <Link href="/admin/orders" className="text-[11px] text-emerald-400 hover:text-emerald-300">
                Linked · {conversation.linkedOrderNumber}
              </Link>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {convertedOrder && (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[12px] font-medium text-emerald-300">
              ✓ {convertedOrder}
            </span>
          )}
          {!conversation.linkedOrderNumber && allSignals.isLikelyOrder && (
            <button onClick={() => setShowConvert(true)}
              className="btn-gold px-3 py-1.5 text-[12px]">
              Convert to Order
            </button>
          )}
          {hasSignals && (
            <button onClick={() => setShowSignals((v) => !v)}
              className="btn-outline px-3 py-1.5 text-[12px]">
              {showSignals ? "Hide" : "Show"} signals
            </button>
          )}
          <button onClick={handleArchive}
            className="btn-outline px-3 py-1.5 text-[12px]">
            Archive
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isWa={isWa} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          <div className="shrink-0 px-6 py-4" style={{ borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
            <div className="flex items-end gap-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply(); }}
                placeholder={channelReady ? `Reply via ${isWa ? "WhatsApp" : "Messenger"}… (Ctrl+Enter)` : "Reply (saved locally — channel not connected)"}
                rows={2}
                className="inp flex-1 resize-none"
              />
              <button onClick={sendReply} disabled={sending || !replyText.trim()}
                className="btn-gold shrink-0 self-end px-4 py-2.5 text-[13px] disabled:opacity-40">
                {sending ? "…" : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Signals panel */}
        {hasSignals && showSignals && (
          <div className="w-64 shrink-0 overflow-y-auto"
            style={{ borderLeft: "1px solid var(--border)", background: "var(--bg2)" }}>
            <div className="p-4 space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Detected Signals
              </p>

              {allSignals.score > 0 && (
                <div>
                  <p className="mb-1 text-[11px]" style={{ color: "var(--muted)" }}>Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${allSignals.score}%`, background: allSignals.score >= 70 ? "#10B981" : allSignals.score >= 40 ? "#C8920E" : "#64748B" }} />
                    </div>
                    <span className="text-[12px] font-semibold text-white">{allSignals.score}</span>
                  </div>
                </div>
              )}

              {allSignals.urls.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
                    {allSignals.urls.length} Product link{allSignals.urls.length !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-1">
                    {allSignals.urls.map((url) => {
                      let host = url;
                      try { host = new URL(url).hostname.replace("www.", ""); } catch { /* noop */ }
                      return (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                          className="block truncate rounded-lg px-2.5 py-1.5 text-[11px] transition-colors"
                          style={{ background: "rgba(200,146,14,0.08)", color: "#C8920E", border: "1px solid rgba(200,146,14,0.15)" }}>
                          ↗ {host}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {allSignals.phones.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px]" style={{ color: "var(--muted)" }}>Phone</p>
                  {allSignals.phones.map((ph) => (
                    <a key={ph} href={`tel:${ph}`}
                      className="block rounded-lg px-2.5 py-1.5 text-[12px] text-emerald-400 transition-colors hover:text-emerald-300"
                      style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                      {ph}
                    </a>
                  ))}
                </div>
              )}

              {allSignals.addressHints.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px]" style={{ color: "var(--muted)" }}>Address</p>
                  <p className="text-[12px] text-white">{allSignals.addressHints[0]}</p>
                </div>
              )}

              {allSignals.sizes.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px]" style={{ color: "var(--muted)" }}>Sizes</p>
                  <div className="flex flex-wrap gap-1">
                    {allSignals.sizes.map((sz, i) => (
                      <span key={i} className="rounded-lg px-2 py-0.5 text-[11px] font-medium text-amber-300"
                        style={{ background: "rgba(245,158,11,0.1)" }}>
                        {sz}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {allSignals.prices.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px]" style={{ color: "var(--muted)" }}>Prices</p>
                  <div className="flex flex-wrap gap-1">
                    {allSignals.prices.map((pr, i) => (
                      <span key={i} className="rounded-lg px-2 py-0.5 text-[11px] font-medium text-violet-300"
                        style={{ background: "rgba(139,92,246,0.1)" }}>
                        {pr}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showConvert && (
        <ConvertOrderModal
          adminKey={adminKey} convId={convId}
          customerName={conversation.customerName} signals={allSignals}
          onSuccess={(orderNumber) => { setConvertedOrder(orderNumber); setShowConvert(false); fetchThread(); }}
          onClose={() => setShowConvert(false)}
        />
      )}
    </div>
  );
}

function MessageBubble({ message, isWa }: { message: FbMessage; isWa: boolean }) {
  const isPage = message.fromType === "page";
  const signals = message.signalsJson ? (JSON.parse(message.signalsJson) as MessageSignals) : null;
  const accent = isWa ? { bg: "rgba(52,211,153,0.12)", time: "rgba(52,211,153,0.5)" } : { bg: "rgba(200,146,14,0.12)", time: "rgba(200,146,14,0.5)" };

  return (
    <div className={`flex ${isPage ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[72%] space-y-1" style={{ minWidth: "120px" }}>
        <div className={`rounded-2xl px-4 py-2.5 text-[13px] ${isPage ? "rounded-br-sm" : "rounded-bl-sm"}`}
          style={isPage
            ? { background: accent.bg, color: "var(--text)" }
            : { background: "rgba(255,255,255,0.06)", color: "var(--text)" }}>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
          {signals && <InlineSignals signals={signals} />}
        </div>
        <p className={`text-[10px] px-1 ${isPage ? "text-right" : "text-left"}`}
          style={{ color: "var(--muted)" }}>
          {new Date(message.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function InlineSignals({ signals }: { signals: MessageSignals }) {
  if (!signals.urls.length && !signals.phones.length && !signals.prices.length) return null;
  return (
    <div className="mt-2 space-y-1 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      {signals.urls.slice(0, 2).map((url) => {
        let label = url;
        try { label = new URL(url).hostname.replace("www.", ""); } catch { /* noop */ }
        return (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer"
            className="block truncate text-[11px] hover:underline" style={{ color: "#C8920E" }}>
            ↗ {label}
          </a>
        );
      })}
      {signals.phones.map((ph) => (
        <a key={ph} href={`tel:${ph}`} className="block text-[11px] text-emerald-400">{ph}</a>
      ))}
    </div>
  );
}
