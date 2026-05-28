import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getConversation, getConversationMessages } from "@/lib/conversations";
import { getAiSettings, buildSystemPrompt } from "@/lib/ai-settings";
import { isDbConfigured } from "@/lib/db";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "@/lib/mock-admin-data";
import type { FbConversation, FbMessage, MessageSignals } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function requireAdmin(req: NextRequest) {
  return req.headers.get("x-admin-key") === (process.env.ADMIN_KEY ?? "alynaf-admin");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // ── Resolve conversation + messages (DB or mock) ──────────────────────────
  let conv: FbConversation | null;
  let messages: FbMessage[];

  if (!isDbConfigured()) {
    conv     = MOCK_CONVERSATIONS.find((c) => c.id === id) ?? null;
    messages = MOCK_MESSAGES[id] ?? [];
  } else {
    [conv, messages] = await Promise.all([
      getConversation(id),
      getConversationMessages(id),
    ]);
  }

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Aggregate signals from customer messages ──────────────────────────────
  const sig: MessageSignals = {
    urls: [], phones: [], addressHints: [], prices: [], sizes: [],
    isLikelyOrder: false, score: 0,
  };
  for (const m of messages) {
    if (m.fromType !== "customer" || !m.signalsJson) continue;
    const s = JSON.parse(m.signalsJson) as MessageSignals;
    sig.urls.push(...s.urls);
    sig.phones.push(...s.phones);
    sig.addressHints.push(...s.addressHints);
    sig.prices.push(...s.prices);
    sig.sizes.push(...s.sizes);
    if (s.isLikelyOrder) sig.isLikelyOrder = true;
    sig.score = Math.max(sig.score, s.score);
  }
  sig.urls         = [...new Set(sig.urls)];
  sig.phones       = [...new Set(sig.phones)];
  sig.addressHints = [...new Set(sig.addressHints)];

  // ── Demo mode (no Anthropic key) — works in both dev & production ─────────
  if (!process.env.ANTHROPIC_API_KEY) {
    const suggestion = buildDemoReply(conv.customerName, sig);
    return NextResponse.json({ suggestion, demo: true });
  }

  // ── Live mode — call Claude ───────────────────────────────────────────────
  const aiSettings = getAiSettings();
  const systemPrompt = buildSystemPrompt(aiSettings, conv.channel ?? "facebook");

  const history = messages
    .slice(-12)
    .map((m) => `${m.fromType === "page" ? "AlyNaf (you)" : conv!.customerName}: ${m.text}`)
    .join("\n");

  const context = [
    sig.urls.length         ? `Product links: ${sig.urls.slice(0, 3).join(", ")}` : "",
    sig.phones.length       ? `Phone: ${sig.phones[0]}` : "",
    sig.addressHints.length ? `Address hint: ${sig.addressHints[0]}` : "",
    sig.sizes.length        ? `Sizes: ${sig.sizes.join(", ")}` : "",
    sig.prices.length       ? `Prices mentioned: ${sig.prices.join(", ")}` : "",
  ].filter(Boolean).join(" · ");

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 180,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `Conversation:\n${history}\n\n${context ? `Context: ${context}\n\n` : ""}Write the ideal next reply.`,
      }],
    });

    const text = res.content[0]?.type === "text" ? res.content[0].text.trim() : null;
    if (!text) return NextResponse.json({ error: "No reply generated" }, { status: 500 });
    return NextResponse.json({ suggestion: text });
  } catch (err) {
    console.error("AI reply error:", err);
    return NextResponse.json({ error: "AI unavailable" }, { status: 500 });
  }
}

// ─── Demo reply builder — no API key needed ───────────────────────────────────
function buildDemoReply(customerName: string, sig: MessageSignals): string {
  const firstName = customerName.split(" ")[0];

  let store = "";
  if (sig.urls.length > 0) {
    try {
      store = new URL(sig.urls[0]).hostname
        .replace(/^www\./, "")
        .replace(/\.com.*|\.co\.uk.*/, "");
      store = store.charAt(0).toUpperCase() + store.slice(1);
    } catch { /* noop */ }
  }

  const size  = sig.sizes[0]  ?? "";
  const price = sig.prices[0] ?? "";
  const city  = sig.addressHints[0] ?? "";

  if (sig.urls.length > 0 && !sig.addressHints.length) {
    return `Ji ${firstName} apa/bhai, ${store ? store + " theke " : ""}pathano jabe inshaAllah 🙂${size ? ` Size ${size} available ache.` : ""} Delivery address ta complete dile quote pathabo — approximate ৳${price || "4,000–6,000"} + shipping hobe.`;
  }
  if (sig.urls.length > 0 && sig.addressHints.length > 0) {
    return `Ji, ${store ? store + " theke " : ""}order confirm kora jabe inshaAllah.${size ? ` Size ${size} niye nitesi.` : ""} ${city ? city + " te" : "Bangladesh e"} deliver hobe 7–10 din er modhye. Quote pathacchi ajkei 🙏`;
  }
  if (sig.phones.length > 0 && !sig.urls.length) {
    return `Received! Apnar number note kore niyechi. Konno product link share korle price er quote pathano jabe inshaAllah.`;
  }
  return `Ji ${firstName} apa/bhai, bolen — ki lagbe? Product link share korle UK theke price check kore quote pathabo inshaAllah 🙂`;
}
