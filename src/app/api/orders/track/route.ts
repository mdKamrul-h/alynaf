import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumberAndPhone } from "@/lib/orders";

export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get("orderNumber");
  const phone = request.nextUrl.searchParams.get("phone");

  if (!orderNumber || !phone) {
    return NextResponse.json(
      { error: "Order number and phone are required" },
      { status: 400 }
    );
  }

  const order = getOrderByNumberAndPhone(orderNumber, phone);

  if (!order) {
    return NextResponse.json(
      { error: "Order not found. Check your order number and phone." },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}
