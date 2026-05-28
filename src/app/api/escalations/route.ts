import { NextRequest, NextResponse } from "next/server";
import { getAllOrders } from "@/lib/orders";
import { getAllConversations } from "@/lib/conversations";
import { computeEscalations } from "@/lib/escalations";

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

  const [orders, conversations] = await Promise.all([
    getAllOrders(),
    getAllConversations(),
  ]);

  const escalations = computeEscalations(orders, conversations);
  return NextResponse.json({ escalations });
}
