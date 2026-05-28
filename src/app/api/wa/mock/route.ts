import { NextRequest, NextResponse } from "next/server";
import { upsertConversation, appendMessage } from "@/lib/conversations";

function requireAdmin(request: NextRequest): boolean {
  return (
    request.headers.get("x-admin-key") ===
    (process.env.ADMIN_KEY ?? "alynaf-admin")
  );
}

const MOCK_WA_DATA = [
  {
    id: "wa_01712345678",
    customerPsid: "01712345678",
    customerName: "Sharmin Akter",
    messages: [
      {
        fromType: "customer" as const,
        text: "Assalamualaikum! Amar jonno ei Nike shoes ta ki pathate parben? https://www.nike.com/gb/t/air-max-270-shoes/AH8050-002 Size 7 UK lagbe. Dhaka Mirpur 10 te deliver korben please. Phone: 01712345678",
        at: "2026-05-27T09:00:00.000Z",
      },
      {
        fromType: "page" as const,
        text: "Wa alaikum assalam! Ji pathano jabe. Price confirm kore janabo.",
        at: "2026-05-27T09:30:00.000Z",
      },
    ],
  },
  {
    id: "wa_01891234567",
    customerPsid: "01891234567",
    customerName: "Monirul Islam",
    messages: [
      {
        fromType: "customer" as const,
        text: "Bhai ASOS theke ei suit ta paben? https://www.asos.com/asos-design/asos-design-slim-fit-suit/prd/12345 Size 38R. Sylhet Zindabazar e pathaben. 01891234567",
        at: "2026-05-27T14:00:00.000Z",
      },
    ],
  },
  {
    id: "wa_01611112222",
    customerPsid: "01611112222",
    customerName: "Roksana Begum",
    messages: [
      {
        fromType: "customer" as const,
        text: "Hello! Boots theke ei The Ordinary serum ta paben? https://www.boots.com/the-ordinary-niacinamide-10-zinc-1-30ml-10271754 Chittagong GEC More te deliver lagbe. Quantity 2 ta. 01611112222",
        at: "2026-05-28T07:00:00.000Z",
      },
    ],
  },
];

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  for (const conv of MOCK_WA_DATA) {
    const lastMsg = conv.messages[conv.messages.length - 1];
    await upsertConversation({
      id: conv.id,
      customerPsid: conv.customerPsid,
      customerName: conv.customerName,
      customerAvatar: null,
      lastMessageAt: lastMsg.at,
      lastMessageSnippet: lastMsg.text.slice(0, 100),
      channel: "whatsapp",
    });

    for (const msg of conv.messages) {
      await appendMessage(
        conv.id,
        msg.fromType,
        msg.text,
        null,
        `${conv.id}_${msg.at}`
      );
    }
  }

  return NextResponse.json({ loaded: MOCK_WA_DATA.length });
}
