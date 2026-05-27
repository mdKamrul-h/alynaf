import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "quoted",
  "confirmed",
  "purchased",
  "shipped",
  "delivered",
  "cancelled",
];

export async function PATCH(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_KEY ?? "alynaf-admin";

  if (adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderNumber, status, quoteAmount } = body;

    if (!orderNumber || !status) {
      return NextResponse.json(
        { error: "orderNumber and status are required" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = updateOrderStatus(
      orderNumber,
      status,
      quoteAmount !== undefined ? Number(quoteAmount) : undefined
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order update failed:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
