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

export function createOrder(input: CreateOrderInput): Order {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomBytes(8).toString("hex");
  const orderNumber = generateOrderNumber();

  db.prepare(
    `INSERT INTO orders (
      id, order_number, customer_name, phone, email, address, city,
      items, notes, payment_method, status, source, fb_conversation_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
  ).run(
    id,
    orderNumber,
    input.customerName.trim(),
    input.phone.trim(),
    input.email.trim(),
    input.address.trim(),
    input.city.trim(),
    JSON.stringify(input.items),
    input.notes.trim(),
    input.paymentMethod,
    input.source ?? "web",
    input.fbConversationId ?? null,
    now,
    now
  );

  return getOrderByNumber(orderNumber)!;
}

export function getOrderByNumber(orderNumber: string): Order | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM orders WHERE order_number = ?")
    .get(orderNumber.toUpperCase()) as OrderRow | undefined;
  return row ? rowToOrder(row) : null;
}

export function getOrderByNumberAndPhone(
  orderNumber: string,
  phone: string
): Order | null {
  const order = getOrderByNumber(orderNumber);
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

export function getAllOrders(source?: OrderSource): Order[] {
  const db = getDb();
  const rows = source
    ? (db.prepare("SELECT * FROM orders WHERE source = ? ORDER BY created_at DESC").all(source) as OrderRow[])
    : (db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as OrderRow[]);
  return rows.map(rowToOrder);
}

export function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
  quoteAmount?: number
): Order | null {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = getOrderByNumber(orderNumber);
  if (!existing) return null;

  if (quoteAmount !== undefined) {
    db.prepare(
      "UPDATE orders SET status = ?, quote_amount = ?, updated_at = ? WHERE order_number = ?"
    ).run(status, quoteAmount, now, orderNumber.toUpperCase());
  } else {
    db.prepare(
      "UPDATE orders SET status = ?, updated_at = ? WHERE order_number = ?"
    ).run(status, now, orderNumber.toUpperCase());
  }

  return getOrderByNumber(orderNumber);
}
