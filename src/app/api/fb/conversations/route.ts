import { NextRequest, NextResponse } from "next/server";
import { getAllConversations } from "@/lib/conversations";
import { isFbConfigured } from "@/lib/fb";
import { isWaConfigured } from "@/lib/wa";
import type { InboxChannel } from "@/lib/types";

function requireAdmin(request: NextRequest): boolean {
  return (
    request.headers.get("x-admin-key") ===
    (process.env.ADMIN_KEY ?? "alynaf-admin")
  );
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const channelParam = searchParams.get("channel") as InboxChannel | "all" | null;

  const conversations = await getAllConversations({
    likelyOrder: searchParams.get("likelyOrder") === "1",
    unreadOnly: searchParams.get("unreadOnly") === "1",
    linked: searchParams.get("linked") === "1",
    channel: channelParam && channelParam !== "all" ? channelParam : undefined,
  });

  return NextResponse.json({
    conversations,
    fbConfigured: isFbConfigured(),
    waConfigured: isWaConfigured(),
  });
}
