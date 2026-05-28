import { NextRequest, NextResponse } from "next/server";
import {
  getConversation,
  getConversationMessages,
  markConversationRead,
  archiveConversation,
} from "@/lib/conversations";
import { isDbConfigured } from "@/lib/db";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "@/lib/mock-admin-data";

function requireAdmin(request: NextRequest): boolean {
  return request.headers.get("x-admin-key") === (process.env.ADMIN_KEY ?? "alynaf-admin");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!isDbConfigured()) {
    const conversation = MOCK_CONVERSATIONS.find((c) => c.id === id);
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const messages = MOCK_MESSAGES[id] ?? [];
    return NextResponse.json({ conversation, messages });
  }

  const conversation = await getConversation(id);
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messages = await getConversationMessages(id);
  return NextResponse.json({ conversation, messages });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as { action?: string };

  if (!isDbConfigured()) {
    // In mock mode, mutate the in-memory conversation list so the UI updates
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === id);
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (body.action === "markRead") conv.unreadCount = 0;
    else if (body.action === "archive") conv.status = "archived";
    return NextResponse.json({ ok: true });
  }

  if (!(await getConversation(id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "markRead") await markConversationRead(id);
  else if (body.action === "archive") await archiveConversation(id);
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  return NextResponse.json({ ok: true });
}
