import { createHmac } from "crypto";

export class WaApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "WaApiError";
  }
}

export class WaNotConfiguredError extends Error {
  constructor() {
    super("WhatsApp credentials not configured");
    this.name = "WaNotConfiguredError";
  }
}

export function isWaConfigured(): boolean {
  return !!(process.env.WA_PHONE_NUMBER_ID && process.env.WA_ACCESS_TOKEN);
}

export function getWaVerifyToken(): string | null {
  return process.env.WA_VERIFY_TOKEN ?? null;
}

export function verifyWaWebhookSignature(rawBody: string, headerSig: string): boolean {
  const secret = process.env.WA_APP_SECRET;
  if (!secret) return true; // skip verification if not configured
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === headerSig;
}

export async function sendWaMessage(to: string, text: string): Promise<string> {
  if (!isWaConfigured()) throw new WaNotConfiguredError();

  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID!;
  const accessToken = process.env.WA_ACCESS_TOKEN!;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new WaApiError(err?.error?.message ?? `WA API error ${res.status}`, res.status);
  }

  const data = await res.json() as { messages?: Array<{ id: string }> };
  return data.messages?.[0]?.id ?? "";
}
