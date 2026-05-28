import { NextRequest, NextResponse } from "next/server";
import { createOrder, getAllOrders } from "@/lib/orders";
import type { CreateOrderInput, OrderSource } from "@/lib/types";

function validateOrderInput(body: unknown): CreateOrderInput | string {
  if (!body || typeof body !== "object") return "Invalid request body";

  const data = body as Record<string, unknown>;

  const required = [
    "customerName",
    "phone",
    "email",
    "address",
    "city",
    "paymentMethod",
  ] as const;

  for (const field of required) {
    if (typeof data[field] !== "string" || !data[field].toString().trim()) {
      return `${field} is required`;
    }
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    return "At least one item is required";
  }

  for (const item of data.items) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.productUrl !== "string" ||
      !item.productUrl.trim()
    ) {
      return "Each item must have a valid product URL";
    }

    try {
      new URL(item.productUrl);
    } catch {
      return "Invalid product URL provided";
    }
  }

  return {
    customerName: String(data.customerName),
    phone: String(data.phone),
    email: String(data.email),
    address: String(data.address),
    city: String(data.city),
    notes: typeof data.notes === "string" ? data.notes : "",
    paymentMethod: String(data.paymentMethod),
    items: data.items.map(
      (item: {
        productUrl: string;
        productName?: string;
        quantity?: number;
        variantNotes?: string;
        imageUrl?: string;
        price?: string;
        currency?: string;
        siteName?: string;
      }) => ({
        productUrl: item.productUrl.trim(),
        productName: item.productName?.trim() ?? "",
        quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
        variantNotes: item.variantNotes?.trim() ?? "",
        ...(item.imageUrl && { imageUrl: item.imageUrl }),
        ...(item.price && { price: item.price }),
        ...(item.currency && { currency: item.currency }),
        ...(item.siteName && { siteName: item.siteName }),
      })
    ),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateOrderInput(body);

    if (typeof validated === "string") {
      return NextResponse.json({ error: validated }, { status: 400 });
    }

    const order = await createOrder(validated);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_KEY ?? "alynaf-admin";

  if (adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const source = request.nextUrl.searchParams.get("source") as OrderSource | null;
  const orders = await getAllOrders(source ?? undefined);
  return NextResponse.json({ orders });
}
