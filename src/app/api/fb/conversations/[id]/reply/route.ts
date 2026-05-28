import { NextRequest, NextResponse } from "next/server";
import { getConversation, appendMessage } from "@/lib/conversations";
import { sendMessage, isFbConfigured, FbApiError } from "@/lib/fb";
import { sendWaMessage, isWaConfigured, WaApiError } from "@/lib/wa";

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
  const conv = await getConversation(id);
  if (!conv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  let sent = false;

  if (conv.channel === "whatsapp") {
    if (isWaConfigured()) {
      try {
        await sendWaMessage(conv.customerPsid, text);
        sent = true;
      } catch (err) {
        if (err instanceof WaApiError) {
          console.error("WA send error:", err.message);
        }
      }
    }
  } else {
    if (isFbConfigured()) {
      try {
        await sendMessage(conv.customerPsid, text);
        sent = true;
      } catch (err) {
        if (err instanceof FbApiError) {
          console.error("FB send error:", err.message);
        }
      }
    }
  }

  // Store the reply locally regardless
  const message = await appendMessage(id, "page", text);

  return NextResponse.json({ message, sent });
}
