import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { AiAgentSettings } from "./ai-settings-types";
import { DEFAULT_AI_SETTINGS } from "./ai-settings-types";

export type { AiAgentSettings } from "./ai-settings-types";
export { DEFAULT_AI_SETTINGS } from "./ai-settings-types";

const SETTINGS_PATH = join(process.cwd(), "data", "ai-settings.json");

export function getAiSettings(): AiAgentSettings {
  try {
    const raw = readFileSync(SETTINGS_PATH, "utf-8");
    return { ...DEFAULT_AI_SETTINGS, ...(JSON.parse(raw) as Partial<AiAgentSettings>) };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAiSettings(settings: Partial<AiAgentSettings>): AiAgentSettings {
  const merged: AiAgentSettings = { ...DEFAULT_AI_SETTINGS, ...settings };
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}

export function buildSystemPrompt(
  settings: AiAgentSettings,
  channel: string
): string {
  const channelName = channel === "whatsapp" ? "WhatsApp" : "Facebook Messenger";

  const toneMap = {
    friendly: "Be warm, approachable, and conversational. Use 'inshaAllah' naturally where appropriate.",
    professional: "Be polite but business-focused. Keep it crisp and clear.",
    formal: "Maintain formal language. Use proper honorifics and a respectful tone.",
  };

  const languageMap = {
    auto: "Mirror the customer's language — they write Bangla, English, or mixed 'Banglish'. Match their style exactly.",
    bangla: "Reply in Bangla (Romanized Bangla / Banglish). Use familiar Bangladeshi expressions.",
    english: "Reply in English. Keep it clear and simple.",
  };

  const lengthMap = {
    short: "Keep replies SHORT: 1–3 sentences maximum.",
    medium: "Keep replies to 2–4 sentences. Be informative but concise.",
  };

  const parts = [
    `You are the admin of ${settings.agentName}, replying to customers on ${channelName}.`,
    "",
    `Business context: ${settings.businessContext}`,
    "",
    `Tone: ${toneMap[settings.tone]}`,
    `Language: ${languageMap[settings.language]}`,
    `Length: ${lengthMap[settings.replyLength]}`,
    "",
    "Rules:",
    "- For new orders: confirm you can source it, give an approximate BDT price if you can, ask for delivery address if missing.",
    "- For status queries: typical timeline is 7–14 days from UK.",
    "- No greetings/sign-offs — reply mid-conversation style.",
    "- Output ONLY the reply text. No labels, no quotes.",
  ];

  if (settings.greetingTemplate) {
    parts.push(`- Greeting template: ${settings.greetingTemplate}`);
  }

  if (settings.customInstructions) {
    parts.push("", "Additional instructions:", settings.customInstructions);
  }

  return parts.join("\n");
}
