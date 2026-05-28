import { randomBytes } from "crypto";
import { getDb } from "./db";
import type { CreateOrderInput, Order, OrderItem, OrderSource, OrderStatus } from "./types";

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  items: string;
  notes: string;
  payment_method: string;
  status: string;
  quote_amount: number | null;
  quote_currency: string;
  source: string | null;
  fb_conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    items: JSON.parse(row.items) as OrderItem[],
    notes: row.notes,
    paymentMethod: row.payment_method,
    status: row.status as OrderStatus,
    quoteAmount: row.quote_amount,
    quoteCurrency: row.quote_currency,
    source: (row.source ?? "web") as OrderSource,
    fbConversationId: row.fb_conversation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function generateOrderNumber(): string {
  const date = new Date();
  const ymd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `AN-${ymd}-${suffix}`;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomBytes(8).toString("hex");
  const orderNumber = generateOrderNumber();

  const { data, error } = await db
    .from("orders")
    .insert({
      id,
      order_number: orderNumber,
      customer_name: input.customerName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      items: JSON.stringify(input.items),
      notes: input.notes.trim(),
      payment_method: input.paymentMethod,
      status: "pending",
      source: input.source ?? "web",
      fb_conversation_id: input.fbConversationId ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToOrder(data as OrderRow);
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const db = getDb();
  const { data } = await db
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();
  return data ? rowToOrder(data as OrderRow) : null;
}

export async function getOrderByNumberAndPhone(
  orderNumber: string,
  phone: string
): Promise<Order | null> {
  const order = await getOrderByNumber(orderNumber);
  if (!order) return null;
  const normalizedInput = phone.replace(/\D/g, "");
  const normalizedStored = order.phone.replace(/\D/g, "");
  if (
    normalizedInput.length >= 6 &&
    (normalizedStored.endsWith(normalizedInput) ||
      normalizedInput.endsWith(normalizedStored))
  ) {
    return order;
  }
  return null;
}

export async function getAllOrders(source?: OrderSource): Promise<Order[]> {
  const db = getDb();
  let query = db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (source) query = query.eq("source", source);
  const { data } = await query;
  return (data ?? []).map((row) => rowToOrder(row as OrderRow));
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
  quoteAmount?: number
): Promise<Order | null> {
  const db = getDb();
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { status, updated_at: now };
  if (quoteAmount !== undefined) updateData.quote_amount = quoteAmount;

  const { data } = await db
    .from("orders")
    .update(updateData)
    .eq("order_number", orderNumber.toUpperCase())
    .select()
    .maybeSingle();

  return data ? rowToOrder(data as OrderRow) : null;
}
