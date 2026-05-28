import { NextRequest, NextResponse } from "next/server";
import { getAllConversations } from "@/lib/conversations";
import { isFbConfigured } from "@/lib/fb";
import { isWaConfigured } from "@/lib/wa";
import { isDbConfigured } from "@/lib/db";
import { MOCK_CONVERSATIONS } from "@/lib/mock-admin-data";
import type { InboxChannel } from "@/lib/types";

function requireAdmin(request: NextRequest): boolean {
  return request.headers.get("x-admin-key") === (process.env.ADMIN_KEY ?? "alynaf-admin");
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbConfigured()) {
    const { searchParams } = request.nextUrl;
    const channel = searchParams.get("channel") as InboxChannel | "all" | null;
    const likelyOrder = searchParams.get("likelyOrder") === "1";
    const unreadOnly = searchParams.get("unreadOnly") === "1";
    const linked = searchParams.get("linked") === "1";

    let conversations = [...MOCK_CONVERSATIONS];
    if (channel && channel !== "all") conversations = conversations.filter((c) => c.channel === channel);
    if (likelyOrder) conversations = conversations.filter((c) => c.isLikelyOrder);
    if (unreadOnly) conversations = conversations.filter((c) => c.unreadCount > 0);
    if (linked) conversations = conversations.filter((c) => c.linkedOrderNumber !== null);

    return NextResponse.json({ conversations, fbConfigured: false, waConfigured: false });
  }

  const { searchParams } = request.nextUrl;
  const channelParam = searchParams.get("channel") as InboxChannel | "all" | null;
  const conversations = await getAllConversations({
    likelyOrder: searchParams.get("likelyOrder") === "1",
    unreadOnly: searchParams.get("unreadOnly") === "1",
    linked: searchParams.get("linked") === "1",
    channel: channelParam && channelParam !== "all" ? channelParam : undefined,
  });

  return NextResponse.json({ conversations, fbConfigured: isFbConfigured(), waConfigured: isWaConfigured() });
}
