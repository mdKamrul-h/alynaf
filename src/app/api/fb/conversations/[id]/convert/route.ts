import { NextRequest, NextResponse } from "next/server";
import { getConversation, linkOrderToConversation } from "@/lib/conversations";
import { createOrder } from "@/lib/orders";
import type { CreateOrderInput, OrderItem } from "@/lib/types";

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
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    customerName?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    items?: OrderItem[];
    notes?: string;
    paymentMethod?: string;
  };

  const required: Array<keyof typeof body> = [
    "customerName", "phone", "address", "city", "paymentMethod",
  ];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }

  const input: CreateOrderInput = {
    customerName: String(body.customerName).trim(),
    phone: String(body.phone).trim(),
    email: body.email?.trim() ?? "",
    address: String(body.address).trim(),
    city: String(body.city).trim(),
    items: body.items,
    notes: body.notes?.trim() ?? "",
    paymentMethod: String(body.paymentMethod),
    source: "facebook",
    fbConversationId: id,
  };

  const order = await createOrder(input);
  await linkOrderToConversation(id, order.orderNumber);

  return NextResponse.json({ order }, { status: 201 });
}
