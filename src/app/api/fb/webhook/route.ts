import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, getFbVerifyToken } from "@/lib/fb";
import { upsertConversation, appendMessage } from "@/lib/conversations";
import { parseMessageSignals } from "@/lib/fb-parse";

// GET — Facebook hub verification handshake
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expected = getFbVerifyToken() ?? process.env.FB_VERIFY_TOKEN;
  if (mode === "subscribe" && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

interface FbWebhookEntry {
  id: string;
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: Array<{ type: string; payload?: { url?: string } }>;
    };
  }>;
}

interface FbWebhookBody {
  object?: string;
  entry?: FbWebhookEntry[];
}

// POST — receive messages from Facebook
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("x-hub-signature-256") ?? "";

  // Only verify if APP_SECRET is configured
  if (process.env.FB_APP_SECRET && !verifyWebhookSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: FbWebhookBody;
  try {
    body = JSON.parse(rawBody) as FbWebhookBody;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (body.object !== "page") {
    return NextResponse.json({ status: "ignored" });
  }

  // Process each messaging event — do it synchronously within this request
  // (Next.js serverless; no background workers)
  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      if (!event.message) continue;

      const psid = event.sender.id;
      const pageId = process.env.FB_PAGE_ID ?? entry.id;
      const isFromPage = event.sender.id === pageId;
      const fromType = isFromPage ? "page" : "customer";
      const text = event.message.text ?? "";
      const convId = `conv_${psid}`;
      const attachmentsJson = event.message.attachments
        ? JSON.stringify(event.message.attachments)
        : null;

      const signals = fromType === "customer" ? parseMessageSignals(text) : null;
      const ts = new Date(event.timestamp).toISOString();
      const snippet = text.slice(0, 100);

      await upsertConversation({
        id: convId,
        customerPsid: psid,
        customerName: psid, // PSID only — name not in webhook payload, sync fills it
        lastMessageAt: ts,
        lastMessageSnippet: snippet,
        isLikelyOrder: signals?.isLikelyOrder ?? false,
      });

      await appendMessage(convId, fromType, text, attachmentsJson, event.message.mid);
    }
  }

  return NextResponse.json({ status: "ok" });
}
