import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumberAndPhone } from "@/lib/orders";
import { isDbConfigured } from "@/lib/db";
import { MOCK_ORDERS } from "@/lib/mock-admin-data";

export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get("orderNumber");
  const phone       = request.nextUrl.searchParams.get("phone");

  if (!orderNumber || !phone)
    return NextResponse.json({ error: "Order number and phone are required" }, { status: 400 });

  if (!isDbConfigured()) {
    const order = MOCK_ORDERS.find((o) => {
      if (o.orderNumber.toUpperCase() !== orderNumber.toUpperCase()) return false;
      const inputDigits  = phone.replace(/\D/g, "");
      const storedDigits = o.phone.replace(/\D/g, "");
      return inputDigits.length >= 6 &&
        (storedDigits.endsWith(inputDigits) || inputDigits.endsWith(storedDigits));
    });
    if (!order) return NextResponse.json({ error: "Order not found. Check your order number and phone." }, { status: 404 });
    return NextResponse.json({ order });
  }

  const order = await getOrderByNumberAndPhone(orderNumber, phone);
  if (!order) return NextResponse.json({ error: "Order not found. Check your order number and phone." }, { status: 404 });
  return NextResponse.json({ order });
}
