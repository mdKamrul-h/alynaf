import Anthropic from "@anthropic-ai/sdk";
import type { MessageSignals } from "./types";
import { parseMessageSignals } from "./fb-parse";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an order intake assistant for AlyNaf, a Bangladeshi online shopping service that sources products from UK retailers. Customers message in Bangla, English, or a mix of both.

Your job is to analyze a customer message and extract structured order signals.

Rules:
- BD phone numbers start with 01[3-9] followed by 8 digits (e.g. 01712345678, +8801991198339)
- UK product URLs come from sites like amazon.co.uk, asos.com, harrods.com, johnlewis.com, boots.com, etc.
- Addresses mention BD cities (Dhaka, Chittagong, Sylhet, Khulna, Rajshahi, Uttara, Gulshan, Dhanmondi, Mirpur, Comilla, Narayanganj, etc.) or include house/road/sector/block numbers
- Prices may be in £ (GBP) or BDT/tk/taka
- Sizes may be UK/EU/US numeric or S/M/L/XL
- isLikelyOrder = true if there's a product URL OR (phone + address together) — the customer clearly wants to buy something
- confidence = 0.0–1.0 representing how certain you are this is a purchase intent message
- aiSummary = 1-sentence plain English summary of what the customer wants (max 80 chars)
- extractedName = customer's name if mentioned in the message, otherwise null
- extractedCity = normalized city name if mentioned, otherwise null`;

export async function aiParseMessageSignals(text: string): Promise<MessageSignals> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return parseMessageSignals(text);
  }

  try {
    const response = await Promise.race([
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        tools: [
          {
            name: "extract_order_signals",
            description: "Extract all order-relevant signals from the customer message",
            input_schema: {
              type: "object" as const,
              properties: {
                urls: { type: "array", items: { type: "string" }, description: "All product/retail URLs found" },
                phones: { type: "array", items: { type: "string" }, description: "BD phone numbers found" },
                addressHints: { type: "array", items: { type: "string" }, description: "Address fragments or city names found" },
                prices: { type: "array", items: { type: "string" }, description: "Price mentions (£12.99, BDT 500, 300 tk)" },
                sizes: { type: "array", items: { type: "string" }, description: "Size/variant mentions" },
                isLikelyOrder: { type: "boolean", description: "True if message clearly expresses purchase intent" },
                score: { type: "number", description: "Confidence score 0–100" },
                confidence: { type: "number", description: "Confidence 0.0–1.0 that this is an order message" },
                aiSummary: { type: "string", description: "1-sentence summary of what the customer wants (max 80 chars)" },
                extractedName: { type: "string", description: "Customer name if found in message, or empty string" },
                extractedCity: { type: "string", description: "Normalized BD city name if found, or empty string" },
              },
              required: ["urls", "phones", "addressHints", "prices", "sizes", "isLikelyOrder", "score", "confidence", "aiSummary", "extractedName", "extractedCity"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "extract_order_signals" },
        messages: [{ role: "user", content: text }],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]);

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return parseMessageSignals(text);

    const input = toolUse.input as {
      urls: string[];
      phones: string[];
      addressHints: string[];
      prices: string[];
      sizes: string[];
      isLikelyOrder: boolean;
      score: number;
      confidence: number;
      aiSummary: string;
      extractedName: string;
      extractedCity: string;
    };

    return {
      urls: input.urls ?? [],
      phones: input.phones ?? [],
      addressHints: input.addressHints ?? [],
      prices: input.prices ?? [],
      sizes: input.sizes ?? [],
      isLikelyOrder: input.isLikelyOrder ?? false,
      score: Math.min(100, Math.max(0, input.score ?? 0)),
      confidence: input.confidence,
      aiSummary: input.aiSummary || undefined,
      extractedName: input.extractedName || undefined,
      extractedCity: input.extractedCity || undefined,
    };
  } catch {
    // Fallback to rule-based parser on any error (timeout, API down, quota)
    return parseMessageSignals(text);
  }
}
