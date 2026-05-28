import { NextRequest, NextResponse } from "next/server";
import { createOrder, getAllOrders } from "@/lib/orders";
import { isDbConfigured } from "@/lib/db";
import { MOCK_ORDERS } from "@/lib/mock-admin-data";
import type { CreateOrderInput, OrderSource } from "@/lib/types";

function requireAdmin(req: NextRequest) {
  return req.headers.get("x-admin-key") === (process.env.ADMIN_KEY ?? "alynaf-admin");
}

function validateOrderInput(body: unknown): CreateOrderInput | string {
  if (!body || typeof body !== "object") return "Invalid request body";
  const data = body as Record<string, unknown>;

  for (const field of ["customerName", "phone", "email", "address", "city", "paymentMethod"] as const) {
    if (typeof data[field] !== "string" || !data[field].toString().trim()) {
      return `${field} is required`;
    }
  }

  if (!Array.isArray(data.items) || data.items.length === 0) return "At least one item is required";

  for (const item of data.items) {
    if (!item || typeof item !== "object" || typeof item.productUrl !== "string" || !item.productUrl.trim())
      return "Each item must have a valid product URL";
    try { new URL(item.productUrl); } catch { return "Invalid product URL provided"; }
  }

  return {
    customerName: String(data.customerName),
    phone: String(data.phone),
    email: String(data.email),
    address: String(data.address),
    city: String(data.city),
    notes: typeof data.notes === "string" ? data.notes : "",
    paymentMethod: String(data.paymentMethod),
    items: (data.items as Array<Record<string, unknown>>).map((item) => {
      const mapped: Record<string, unknown> = {
        productUrl: String(item.productUrl).trim(),
        productName: item.productName ? String(item.productName).trim() : "",
        quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
        variantNotes: item.variantNotes ? String(item.variantNotes).trim() : "",
      };
      if (item.imageUrl) mapped.imageUrl = String(item.imageUrl);
      if (item.price) mapped.price = String(item.price);
      if (item.currency) mapped.currency = String(item.currency);
      if (item.siteName) mapped.siteName = String(item.siteName);
      return mapped as unknown as import("@/lib/types").OrderItem;
    }),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateOrderInput(body);
    if (typeof validated === "string") return NextResponse.json({ error: validated }, { status: 400 });
    if (!isDbConfigured()) {
      // Return a fake order number so the form flow completes
      return NextResponse.json({
        order: {
          ...validated,
          id: `mock-${Date.now()}`,
          orderNumber: `AN-DEMO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          status: "pending",
          quoteAmount: null,
          quoteCurrency: "BDT",
          source: "web",
          fbConversationId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }, { status: 201 });
    }
    const order = await createOrder(validated);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Order creation failed:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbConfigured()) {
    const source = request.nextUrl.searchParams.get("source") as OrderSource | null;
    const orders = source ? MOCK_ORDERS.filter((o) => o.source === source) : MOCK_ORDERS;
    return NextResponse.json({ orders });
  }

  const source = request.nextUrl.searchParams.get("source") as OrderSource | null;
  const orders = await getAllOrders(source ?? undefined);
  return NextResponse.json({ orders });
}
