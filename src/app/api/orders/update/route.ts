import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/orders";
import { isDbConfigured } from "@/lib/db";
import { MOCK_ORDERS } from "@/lib/mock-admin-data";
import type { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending", "quoted", "confirmed", "purchased", "shipped", "delivered", "cancelled",
];

export async function PATCH(request: NextRequest) {
  if (request.headers.get("x-admin-key") !== (process.env.ADMIN_KEY ?? "alynaf-admin"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { orderNumber?: string; status?: string; quoteAmount?: unknown };
  const { orderNumber, status, quoteAmount } = body;

  if (!orderNumber || !status) return NextResponse.json({ error: "orderNumber and status are required" }, { status: 400 });
  if (!VALID_STATUSES.includes(status as OrderStatus)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  if (!isDbConfigured()) {
    // Mutate the in-memory mock order so the UI reflects the change within the session
    const order = MOCK_ORDERS.find((o) => o.orderNumber === orderNumber);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    order.status = status as OrderStatus;
    if (quoteAmount !== undefined) order.quoteAmount = Number(quoteAmount);
    order.updatedAt = new Date().toISOString();
    return NextResponse.json({ order });
  }

  try {
    const order = await updateOrderStatus(orderNumber, status as OrderStatus, quoteAmount !== undefined ? Number(quoteAmount) : undefined);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    console.error("Order update failed:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
