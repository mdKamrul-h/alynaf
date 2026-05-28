import { randomBytes } from "crypto";
import { getDb } from "./db";
import type { FbConversation, FbConversationStatus, FbMessage, InboxChannel } from "./types";
import { aiParseMessageSignals } from "./ai-parse";

interface ConversationRow {
  id: string;
  customer_psid: string;
  customer_name: string;
  customer_avatar: string | null;
  last_message_at: string;
  last_message_snippet: string;
  unread_count: number;
  status: string;
  is_likely_order: boolean;
  linked_order_number: string | null;
  channel: string;
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
  channel: string;
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
    isLikelyOrder: row.is_likely_order === true,
    linkedOrderNumber: row.linked_order_number,
    channel: (row.channel ?? "facebook") as InboxChannel,
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
    channel: (row.channel ?? "facebook") as InboxChannel,
    createdAt: row.created_at,
  };
}

export async function upsertConversation(data: {
  id: string;
  customerPsid: string;
  customerName: string;
  customerAvatar?: string | null;
  lastMessageAt: string;
  lastMessageSnippet: string;
  unreadCount?: number;
  status?: FbConversationStatus;
  isLikelyOrder?: boolean;
  channel?: InboxChannel;
}): Promise<FbConversation> {
  const db = getDb();
  const now = new Date().toISOString();

  // Resolve avatar: prefer incoming value, fall back to existing stored value
  const { data: existing } = await db
    .from("fb_conversations")
    .select("customer_avatar")
    .eq("id", data.id)
    .maybeSingle();

  const avatar = data.customerAvatar ?? existing?.customer_avatar ?? null;

  const { data: row, error } = await db
    .from("fb_conversations")
    .upsert(
      {
        id: data.id,
        customer_psid: data.customerPsid,
        customer_name: data.customerName,
        customer_avatar: avatar,
        last_message_at: data.lastMessageAt,
        last_message_snippet: data.lastMessageSnippet,
        unread_count: data.unreadCount ?? 0,
        status: data.status ?? "open",
        is_likely_order: data.isLikelyOrder ?? false,
        channel: data.channel ?? "facebook",
        created_at: now,
        updated_at: now,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) throw error;
  return rowToConversation(row as ConversationRow);
}

export async function appendMessage(
  convId: string,
  fromType: "customer" | "page",
  text: string,
  attachmentsJson?: string | null,
  fbMessageId?: string
): Promise<FbMessage> {
  const db = getDb();
  const now = new Date().toISOString();
  const id = fbMessageId ?? randomBytes(8).toString("hex");
  const signals = fromType === "customer" ? await aiParseMessageSignals(text) : null;
  const signalsJson = signals ? JSON.stringify(signals) : null;
  const snippet = text.slice(0, 100);
  const isLikelyOrder = signals?.isLikelyOrder ?? false;

  // Determine channel from conversation
  const { data: convMeta } = await db
    .from("fb_conversations")
    .select("channel")
    .eq("id", convId)
    .maybeSingle();
  const channel = (convMeta?.channel ?? "facebook") as string;

  // Insert message, ignoring duplicates (idempotent for webhook replays)
  await db.from("fb_messages").upsert(
    {
      id,
      conversation_id: convId,
      from_type: fromType,
      text,
      attachments_json: attachmentsJson ?? null,
      signals_json: signalsJson,
      channel,
      created_at: now,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // Update conversation counters — fetch current values first for atomic-safe increment
  const { data: conv } = await db
    .from("fb_conversations")
    .select("unread_count, is_likely_order")
    .eq("id", convId)
    .single();

  if (conv) {
    await db.from("fb_conversations").update({
      last_message_at: now,
      last_message_snippet: snippet,
      unread_count: fromType === "customer" ? conv.unread_count + 1 : conv.unread_count,
      is_likely_order: isLikelyOrder || conv.is_likely_order,
      updated_at: now,
    }).eq("id", convId);
  }

  const { data: msgRow } = await db
    .from("fb_messages")
    .select("*")
    .eq("id", id)
    .single();

  return rowToMessage(msgRow as MessageRow);
}

export interface ConversationFilter {
  likelyOrder?: boolean;
  unreadOnly?: boolean;
  linked?: boolean;
  channel?: InboxChannel;
}

export async function getAllConversations(filter?: ConversationFilter): Promise<FbConversation[]> {
  const db = getDb();
  let query = db
    .from("fb_conversations")
    .select("*")
    .eq("status", "open")
    .order("last_message_at", { ascending: false });

  if (filter?.likelyOrder) query = query.eq("is_likely_order", true);
  if (filter?.unreadOnly) query = query.gt("unread_count", 0);
  if (filter?.linked) query = query.not("linked_order_number", "is", null);
  if (filter?.channel) query = query.eq("channel", filter.channel);

  const { data } = await query;
  return (data ?? []).map((row) => rowToConversation(row as ConversationRow));
}

export async function getConversation(id: string): Promise<FbConversation | null> {
  const db = getDb();
  const { data } = await db
    .from("fb_conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? rowToConversation(data as ConversationRow) : null;
}

export async function getConversationMessages(convId: string): Promise<FbMessage[]> {
  const db = getDb();
  const { data } = await db
    .from("fb_messages")
    .select("*")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => rowToMessage(row as MessageRow));
}

export async function markConversationRead(convId: string): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .from("fb_conversations")
    .update({ unread_count: 0, updated_at: now })
    .eq("id", convId);
}

export async function linkOrderToConversation(convId: string, orderNumber: string): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .from("fb_conversations")
    .update({ linked_order_number: orderNumber, updated_at: now })
    .eq("id", convId);
}

export async function archiveConversation(convId: string): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .from("fb_conversations")
    .update({ status: "archived", updated_at: now })
    .eq("id", convId);
}
