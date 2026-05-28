import { NextRequest, NextResponse } from "next/server";
import { getWaVerifyToken, verifyWaWebhookSignature } from "@/lib/wa";
import { upsertConversation, appendMessage } from "@/lib/conversations";

// GET — WhatsApp hub verification handshake
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expected = getWaVerifyToken() ?? process.env.WA_VERIFY_TOKEN;
  if (mode === "subscribe" && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

interface WaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WaWebhookBody {
  object?: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value?: {
        messaging_product?: string;
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: WaMessage[];
      };
    }>;
  }>;
}

// POST — receive messages from WhatsApp Cloud API
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("x-hub-signature-256") ?? "";

  if (process.env.WA_APP_SECRET && !verifyWaWebhookSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: WaWebhookBody;
  try {
    body = JSON.parse(rawBody) as WaWebhookBody;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (body.object !== "whatsapp_business_account") {
    return NextResponse.json({ status: "ignored" });
  }

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;

      const contactsMap = new Map(
        (value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? c.wa_id ?? "Unknown"])
      );

      for (const msg of value.messages) {
        if (msg.type !== "text" || !msg.text?.body) continue;

        const phone = msg.from;
        const convId = `wa_${phone}`;
        const customerName = contactsMap.get(phone) ?? phone;
        const text = msg.text.body;
        const ts = new Date(parseInt(msg.timestamp) * 1000).toISOString();
        const snippet = text.slice(0, 100);

        await upsertConversation({
          id: convId,
          customerPsid: phone,
          customerName,
          lastMessageAt: ts,
          lastMessageSnippet: snippet,
          channel: "whatsapp",
        });

        await appendMessage(convId, "customer", text, null, msg.id);
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
