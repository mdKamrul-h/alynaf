import { randomBytes } from "crypto";
import { getDb } from "./db";
import type { FbConversation, FbConversationStatus, FbMessage } from "./types";
import { parseMessageSignals } from "./fb-parse";

interface ConversationRow {
  id: string;
  customer_psid: string;
  customer_name: string;
  customer_avatar: string | null;
  last_message_at: string;
  last_message_snippet: string;
  unread_count: number;
  status: string;
  is_likely_order: number;
  linked_order_number: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  from_type: string;
  text: string;
  attachments_json: string | null;
  signals_json: string | null;
  created_at: string;
}

function rowToConversation(row: ConversationRow): FbConversation {
  return {
    id: row.id,
    customerPsid: row.customer_psid,
    customerName: row.customer_name,
    customerAvatar: row.customer_avatar,
    lastMessageAt: row.last_message_at,
    lastMessageSnippet: row.last_message_snippet,
    unreadCount: row.unread_count,
    status: row.status as FbConversationStatus,
    isLikelyOrder: row.is_likely_order === 1,
    linkedOrderNumber: row.linked_order_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMessage(row: MessageRow): FbMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    fromType: row.from_type as "customer" | "page",
    text: row.text,
    attachmentsJson: row.attachments_json,
    signalsJson: row.signals_json,
    createdAt: row.created_at,
  };
}

export function upsertConversation(data: {
  id: string;
  customerPsid: string;
  customerName: string;
  customerAvatar?: string | null;
  lastMessageAt: string;
  lastMessageSnippet: string;
  unreadCount?: number;
  status?: FbConversationStatus;
  isLikelyOrder?: boolean;
}): FbConversation {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO fb_conversations (
      id, customer_psid, customer_name, customer_avatar,
      last_message_at, last_message_snippet, unread_count,
      status, is_likely_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      customer_name     = excluded.customer_name,
      customer_avatar   = COALESCE(excluded.customer_avatar, customer_avatar),
      last_message_at   = excluded.last_message_at,
      last_message_snippet = excluded.last_message_snippet,
      unread_count      = excluded.unread_count,
      is_likely_order   = excluded.is_likely_order,
      updated_at        = excluded.updated_at
  `).run(
    data.id,
    data.customerPsid,
    data.customerName,
    data.customerAvatar ?? null,
    data.lastMessageAt,
    data.lastMessageSnippet,
    data.unreadCount ?? 0,
    data.status ?? "open",
    data.isLikelyOrder ? 1 : 0,
    now,
    now
  );
  return getConversation(data.id)!;
}

export function appendMessage(
  convId: string,
  fromType: "customer" | "page",
  text: string,
  attachmentsJson?: string | null,
  fbMessageId?: string
): FbMessage {
  const db = getDb();
  const now = new Date().toISOString();
  const id = fbMessageId ?? randomBytes(8).toString("hex");
  const signals = fromType === "customer" ? parseMessageSignals(text) : null;
  const signalsJson = signals ? JSON.stringify(signals) : null;
  const snippet = text.slice(0, 100);

  db.prepare(`
    INSERT OR IGNORE INTO fb_messages
      (id, conversation_id, from_type, text, attachments_json, signals_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, convId, fromType, text, attachmentsJson ?? null, signalsJson, now);

  const isLikelyOrder = signals?.isLikelyOrder ?? false;
  db.prepare(`
    UPDATE fb_conversations SET
      last_message_at      = ?,
      last_message_snippet = ?,
      unread_count = CASE WHEN ? = 'customer' THEN unread_count + 1 ELSE unread_count END,
      is_likely_order = CASE WHEN ? = 1 THEN 1 ELSE is_likely_order END,
      updated_at = ?
    WHERE id = ?
  `).run(now, snippet, fromType, isLikelyOrder ? 1 : 0, now, convId);

  return rowToMessage(
    db.prepare("SELECT * FROM fb_messages WHERE id = ?").get(id) as MessageRow
  );
}

export interface ConversationFilter {
  likelyOrder?: boolean;
  unreadOnly?: boolean;
  linked?: boolean;
}

export function getAllConversations(filter?: ConversationFilter): FbConversation[] {
  const db = getDb();
  let query = "SELECT * FROM fb_conversations WHERE status = 'open'";

  if (filter?.likelyOrder) query += " AND is_likely_order = 1";
  if (filter?.unreadOnly)   query += " AND unread_count > 0";
  if (filter?.linked)       query += " AND linked_order_number IS NOT NULL";

  query += " ORDER BY last_message_at DESC";

  const rows = db.prepare(query).all() as ConversationRow[];
  return rows.map(rowToConversation);
}

export function getConversation(id: string): FbConversation | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM fb_conversations WHERE id = ?")
    .get(id) as ConversationRow | undefined;
  return row ? rowToConversation(row) : null;
}

export function getConversationMessages(convId: string): FbMessage[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM fb_messages WHERE conversation_id = ? ORDER BY created_at ASC")
    .all(convId) as MessageRow[];
  return rows.map(rowToMessage);
}

export function markConversationRead(convId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE fb_conversations SET unread_count = 0, updated_at = ? WHERE id = ?"
  ).run(now, convId);
}

export function linkOrderToConversation(convId: string, orderNumber: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE fb_conversations SET linked_order_number = ?, updated_at = ? WHERE id = ?"
  ).run(orderNumber, now, convId);
}

export function archiveConversation(convId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE fb_conversations SET status = 'archived', updated_at = ? WHERE id = ?"
  ).run(now, convId);
}
