import { NextRequest, NextResponse } from "next/server";
import { getConversation, appendMessage } from "@/lib/conversations";
import { sendMessage, isFbConfigured, FbApiError } from "@/lib/fb";

function requireAdmin(request: NextRequest): boolean {
  return (
    request.headers.get("x-admin-key") ===
    (process.env.ADMIN_KEY ?? "alynaf-admin")
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conv = getConversation(id);
  if (!conv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  let fbSent = false;
  if (isFbConfigured()) {
    try {
      await sendMessage(conv.customerPsid, text);
      fbSent = true;
    } catch (err) {
      if (err instanceof FbApiError) {
        console.error("FB send error:", err.message);
      }
      // Fall through — still store as local draft
    }
  }

  // Store the reply locally regardless
  const message = appendMessage(id, "page", text);

  return NextResponse.json({ message, fbSent });
}
