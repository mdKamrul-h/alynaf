import { NextRequest, NextResponse } from "next/server";
import { getAllOrders } from "@/lib/orders";
import { getAllConversations } from "@/lib/conversations";
import { computeEscalations } from "@/lib/escalations";
import { isDbConfigured } from "@/lib/db";
import { MOCK_ORDERS, MOCK_CONVERSATIONS } from "@/lib/mock-admin-data";

function requireAdmin(request: NextRequest): boolean {
  return request.headers.get("x-admin-key") === (process.env.ADMIN_KEY ?? "alynaf-admin");
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbConfigured()) {
    const escalations = computeEscalations(MOCK_ORDERS, MOCK_CONVERSATIONS);
    return NextResponse.json({ escalations });
  }

  const [orders, conversations] = await Promise.all([getAllOrders(), getAllConversations()]);
  return NextResponse.json({ escalations: computeEscalations(orders, conversations) });
}
