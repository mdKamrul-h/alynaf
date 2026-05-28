import { NextRequest, NextResponse } from "next/server";
import { upsertConversation, appendMessage } from "@/lib/conversations";

function requireAdmin(request: NextRequest): boolean {
  return (
    request.headers.get("x-admin-key") ===
    (process.env.ADMIN_KEY ?? "alynaf-admin")
  );
}

const MOCK_DATA = [
  {
    id: "mock_conv_nadia_001",
    customerPsid: "mock_psid_nadia",
    customerName: "Nadia Akter",
    customerAvatar: null,
    messages: [
      {
        fromType: "customer" as const,
        text: "Assalamu alaikum bhai! ASOS theke ei dress ta ki pathate parben? https://www.asos.com/pimki/pimki-ribbed-knit-midi-dress/prd/204567891 Size 10 lagbe. Uttara 7 no sector e deliver korben. Amar number 01712345678",
        at: "2026-05-27T10:15:00.000Z",
      },
      {
        fromType: "page" as const,
        text: "Wa alaikum assalam! Ji, ASOS theke pathano jay. £28.99 + shipping. Quote pathabo ajkei.",
        at: "2026-05-27T10:45:00.000Z",
      },
      {
        fromType: "customer" as const,
        text: "Okay! BDT te koto hobe? Address: House 12, Road 7, Sector 7, Uttara, Dhaka 1230",
        at: "2026-05-27T11:00:00.000Z",
      },
    ],
  },
  {
    id: "mock_conv_rafiq_002",
    customerPsid: "mock_psid_rafiq",
    customerName: "Rafiqul Hasan",
    customerAvatar: null,
    messages: [
      {
        fromType: "customer" as const,
        text: "Bhai Amazon UK theke ei Nike Air Max ta pathaben? https://www.amazon.co.uk/Nike-Air-Max-270/dp/B08XYZ12345 - size 9 UK lagbe. Phone: 01891234567",
        at: "2026-05-27T14:30:00.000Z",
      },
      {
        fromType: "customer" as const,
        text: "Chittagong Agrabad te deliver korben. Koto din lagbe?",
        at: "2026-05-27T14:35:00.000Z",
      },
    ],
  },
  {
    id: "mock_conv_tasmin_003",
    customerPsid: "mock_psid_tasmin",
    customerName: "Tasmin Begum",
    customerAvatar: null,
    messages: [
      {
        fromType: "customer" as const,
        text: "Hello! Harrods theke La Mer cream ta ki available? https://www.harrods.com/en-gb/beauty/skincare/la-mer/the-moisturizing-cream - 60ml size. Price koto hobe total?",
        at: "2026-05-28T08:20:00.000Z",
      },
    ],
  },
  {
    id: "mock_conv_karim_004",
    customerPsid: "mock_psid_karim",
    customerName: "Karim Uddin",
    customerAvatar: null,
    messages: [
      {
        fromType: "customer" as const,
        text: "Bhai amar order er ki update ache? Order number AN-20260520-AB12. Onek din hoyeche.",
        at: "2026-05-28T09:00:00.000Z",
      },
      {
        fromType: "page" as const,
        text: "Apnar order UK theke ship hoyeche, BD customs e ache. 3-5 din er modhye pouchabe inshaAllah.",
        at: "2026-05-28T09:30:00.000Z",
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

  for (const conv of MOCK_DATA) {
    const lastMsg = conv.messages[conv.messages.length - 1];
    await upsertConversation({
      id: conv.id,
      customerPsid: conv.customerPsid,
      customerName: conv.customerName,
      customerAvatar: conv.customerAvatar,
      lastMessageAt: lastMsg.at,
      lastMessageSnippet: lastMsg.text.slice(0, 100),
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

  return NextResponse.json({ loaded: MOCK_DATA.length });
}
