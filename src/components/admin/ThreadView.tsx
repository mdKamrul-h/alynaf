"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FbConversation, FbMessage, MessageSignals } from "@/lib/types";
import { ConvertOrderModal } from "./ConvertOrderModal";

interface Props {
  adminKey: string;
  convId: string;
}

export function ThreadView({ adminKey, convId }: Props) {
  const [conversation, setConversation] = useState<FbConversation | null>(null);
  const [messages, setMessages] = useState<FbMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [fbConfigured, setFbConfigured] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [convertedOrder, setConvertedOrder] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchThread = useCallback(async () => {
    const [threadRes, statusRes] = await Promise.all([
      fetch(`/api/fb/conversations/${convId}`, {
        headers: { "x-admin-key": adminKey },
      }),
      fetch("/api/fb/status", { headers: { "x-admin-key": adminKey } }),
    ]);
    if (threadRes.ok) {
      const data = (await threadRes.json()) as {
        conversation: FbConversation;
        messages: FbMessage[];
      };
      setConversation(data.conversation);
      setMessages(data.messages);
    }
    if (statusRes.ok) {
      const s = (await statusRes.json()) as { configured: boolean };
      setFbConfigured(s.configured);
    }
  }, [adminKey, convId]);

  useEffect(() => {
    fetchThread();
    // Mark as read
    fetch(`/api/fb/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ action: "markRead" }),
    });
  }, [adminKey, convId, fetchThread]);

  // Scroll to bottom when messages change
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
    if (res.ok) {
      setReplyText("");
      fetchThread();
    }
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

  // Aggregate signals from all customer messages
  const allSignals: MessageSignals = {
    urls: [],
    phones: [],
    addressHints: [],
    prices: [],
    sizes: [],
    isLikelyOrder: false,
    score: 0,
  };
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
  // Deduplicate
  allSignals.urls = [...new Set(allSignals.urls)];
  allSignals.phones = [...new Set(allSignals.phones)];
  allSignals.addressHints = [...new Set(allSignals.addressHints)];

  if (!conversation) {
    return <p className="py-20 text-center text-slate-500">Loading…</p>;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Thread header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/inbox" className="text-slate-400 hover:text-white">
            ← Back
          </Link>
          <div>
            <p className="font-medium text-white">{conversation.customerName}</p>
            {conversation.linkedOrderNumber && (
              <p className="text-xs text-emerald-400">
                Linked to{" "}
                <Link href="/admin/orders" className="underline">
                  {conversation.linkedOrderNumber}
                </Link>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!conversation.linkedOrderNumber && allSignals.isLikelyOrder && (
            <button
              onClick={() => setShowConvert(true)}
              className="rounded-lg bg-[#4a7c9b] px-3 py-1.5 text-sm text-white"
            >
              Convert to Order
            </button>
          )}
          {conversation.linkedOrderNumber && convertedOrder && (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-300">
              Order created: {convertedOrder}
            </span>
          )}
          <button
            onClick={handleArchive}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-400 hover:text-white"
          >
            Archive
          </button>
        </div>
      </div>

      {/* Signals panel */}
      {(allSignals.urls.length > 0 || allSignals.phones.length > 0) && (
        <SignalsPanel signals={allSignals} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex gap-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply();
            }}
            placeholder={
              fbConfigured
                ? "Reply… (Ctrl+Enter to send)"
                : "Reply (will be saved locally — FB not connected)"
            }
            rows={2}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#4a7c9b] focus:outline-none"
          />
          <button
            onClick={sendReply}
            disabled={sending || !replyText.trim()}
            className="self-end rounded-full bg-[#4a7c9b] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>

      {showConvert && (
        <ConvertOrderModal
          adminKey={adminKey}
          convId={convId}
          customerName={conversation.customerName}
          signals={allSignals}
          onSuccess={(orderNumber) => {
            setConvertedOrder(orderNumber);
            setShowConvert(false);
            fetchThread();
          }}
          onClose={() => setShowConvert(false)}
        />
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: FbMessage }) {
  const isPage = message.fromType === "page";
  const signals = message.signalsJson
    ? (JSON.parse(message.signalsJson) as MessageSignals)
    : null;

  return (
    <div className={`flex ${isPage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] space-y-1.5 rounded-2xl px-4 py-2.5 text-sm ${
          isPage
            ? "rounded-br-sm bg-[#4a7c9b]/30 text-white"
            : "rounded-bl-sm bg-white/[0.06] text-slate-200"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        {signals && (
          <InlineSignals signals={signals} />
        )}
        <p className={`text-xs ${isPage ? "text-[#4a7c9b]/70" : "text-slate-500"}`}>
          {new Date(message.createdAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function InlineSignals({ signals }: { signals: MessageSignals }) {
  if (
    signals.urls.length === 0 &&
    signals.phones.length === 0 &&
    signals.prices.length === 0
  ) {
    return null;
  }

  return (
    <div className="mt-1.5 space-y-1 border-t border-white/10 pt-1.5">
      {signals.urls.map((url) => {
        let label = url;
        try { label = new URL(url).hostname.replace("www.", ""); } catch { /* noop */ }
        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-xs text-[#4a7c9b] hover:underline"
          >
            {label}
          </a>
        );
      })}
      {signals.phones.map((ph) => (
        <a key={ph} href={`tel:${ph}`} className="block text-xs text-emerald-400">
          {ph}
        </a>
      ))}
      {signals.prices.map((pr, i) => (
        <span key={i} className="inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">
          {pr}
        </span>
      ))}
    </div>
  );
}

function SignalsPanel({ signals }: { signals: MessageSignals }) {
  return (
    <div className="border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
        {signals.urls.length > 0 && (
          <span className="text-slate-400">
            {signals.urls.length} product link{signals.urls.length !== 1 ? "s" : ""}
          </span>
        )}
        {signals.phones.length > 0 && (
          <span className="text-emerald-400">{signals.phones.join(", ")}</span>
        )}
        {signals.addressHints.length > 0 && (
          <span className="text-slate-400">{signals.addressHints[0]}</span>
        )}
        {signals.sizes.length > 0 && (
          <span className="text-amber-300">{signals.sizes.join(", ")}</span>
        )}
      </div>
    </div>
  );
}
