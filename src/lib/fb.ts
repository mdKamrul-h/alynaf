import { createHmac } from "crypto";

export class FbApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "FbApiError";
  }
}

export class FbNotConfiguredError extends Error {
  constructor() {
    super("Facebook credentials not configured");
    this.name = "FbNotConfiguredError";
  }
}

function getConfig() {
  return {
    pageId: process.env.FB_PAGE_ID,
    accessToken: process.env.FB_PAGE_ACCESS_TOKEN,
    appSecret: process.env.FB_APP_SECRET,
    verifyToken: process.env.FB_VERIFY_TOKEN,
  };
}

export function isFbConfigured(): boolean {
  const { pageId, accessToken } = getConfig();
  return Boolean(pageId && accessToken);
}

function requireConfig() {
  const cfg = getConfig();
  if (!cfg.pageId || !cfg.accessToken) throw new FbNotConfiguredError();
  return cfg as {
    pageId: string;
    accessToken: string;
    appSecret: string | undefined;
    verifyToken: string | undefined;
  };
}

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

async function graphFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${GRAPH_BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new FbApiError(err.error?.message ?? `Graph API error ${res.status}`, res.status);
  }
  return res.json();
}

export interface FbAttachment {
  type: string;
  payload?: { url?: string; sticker_id?: number };
}

export interface FbRawMessage {
  id: string;
  from: { id: string; name: string };
  message?: string;
  created_time: string;
  attachments?: { data: FbAttachment[] };
}

export interface FbConvSnippet {
  id: string;
  updated_time: string;
  snippet?: string;
  participants?: { data: Array<{ id: string; name: string; pic?: string }> };
  messages?: { data: FbRawMessage[] };
}

export async function fetchRecentConversations(limit = 20): Promise<FbConvSnippet[]> {
  const { pageId, accessToken } = requireConfig();
  const fields =
    "id,updated_time,snippet,participants,messages.limit(20){id,from,message,created_time,attachments}";
  const data = await graphFetch(
    `/${pageId}/conversations?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${accessToken}`
  );
  return (data.data ?? []) as FbConvSnippet[];
}

export async function fetchConversationMessages(convId: string): Promise<FbRawMessage[]> {
  const { accessToken } = requireConfig();
  const fields = "id,from,message,created_time,attachments";
  const data = await graphFetch(
    `/${convId}/messages?fields=${encodeURIComponent(fields)}&limit=50&access_token=${accessToken}`
  );
  return (data.data ?? []) as FbRawMessage[];
}

export async function sendMessage(psid: string, text: string): Promise<string> {
  const { pageId, accessToken } = requireConfig();
  const data = await graphFetch(`/${pageId}/messages?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: psid },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });
  return data.message_id as string;
}

export function verifyWebhookSignature(rawBody: string, headerSig: string): boolean {
  const { appSecret } = getConfig();
  if (!appSecret) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  if (expected.length !== headerSig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ headerSig.charCodeAt(i);
  }
  return diff === 0;
}

export function getFbVerifyToken(): string | undefined {
  return getConfig().verifyToken;
}
