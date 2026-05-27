import { NextRequest, NextResponse } from "next/server";
import {
  fetchRecentConversations,
  isFbConfigured,
  FbNotConfiguredError,
} from "@/lib/fb";
import { upsertConversation, appendMessage, getConversationMessages } from "@/lib/conversations";
import { parseMessageSignals } from "@/lib/fb-parse";

function requireAdmin(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  return key === (process.env.ADMIN_KEY ?? "alynaf-admin");
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFbConfigured()) {
    return NextResponse.json(
      { error: "Facebook credentials not configured" },
      { status: 503 }
    );
  }

  try {
    const snippets = await fetchRecentConversations(50);
    let synced = 0;

    for (const conv of snippets) {
      const messages = conv.messages?.data ?? [];
      if (messages.length === 0) continue;

      // Identify the customer (non-page participant)
      const pageId = process.env.FB_PAGE_ID!;
      const customer = conv.participants?.data.find((p) => p.id !== pageId);
      if (!customer) continue;

      const convId = conv.id;
      const lastMsg = messages[0];
      const lastMsgText = lastMsg.message ?? "";
      const allSignals = messages
        .filter((m) => m.from.id !== pageId)
        .map((m) => parseMessageSignals(m.message ?? ""));
      const isLikelyOrder = allSignals.some((s) => s.isLikelyOrder);

      upsertConversation({
        id: convId,
        customerPsid: customer.id,
        customerName: customer.name,
        customerAvatar: customer.pic ?? null,
        lastMessageAt: lastMsg.created_time,
        lastMessageSnippet: lastMsgText.slice(0, 100),
        isLikelyOrder,
      });

      // Append messages that aren't stored yet
      const existing = getConversationMessages(convId);
      const existingIds = new Set(existing.map((m) => m.id));

      for (const msg of [...messages].reverse()) {
        if (existingIds.has(msg.id)) continue;
        const fromType = msg.from.id === pageId ? "page" : "customer";
        appendMessage(
          convId,
          fromType,
          msg.message ?? "",
          msg.attachments ? JSON.stringify(msg.attachments.data) : null,
          msg.id
        );
      }

      synced++;
    }

    return NextResponse.json({ synced });
  } catch (err) {
    if (err instanceof FbNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("FB sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 502 });
  }
}
