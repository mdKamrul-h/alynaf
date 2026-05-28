export interface AiAgentSettings {
  agentName: string;
  tone: "friendly" | "professional" | "formal";
  language: "bangla" | "english" | "auto";
  replyLength: "short" | "medium";
  customInstructions: string;
  greetingTemplate: string;
  businessContext: string;
  autoReplyEnabled: boolean;
}

export const DEFAULT_AI_SETTINGS: AiAgentSettings = {
  agentName: "AlyNaf",
  tone: "friendly",
  language: "auto",
  replyLength: "short",
  customInstructions: "",
  greetingTemplate: "",
  businessContext:
    "AlyNaf is a Bangladeshi business sourcing products from UK retailers (Amazon, ASOS, Boots, Harrods, John Lewis, Selfridges, etc.) and delivering to Bangladesh. Typical delivery time is 7–14 days from UK. Price includes product cost + shipping + customs handling.",
  autoReplyEnabled: false,
};
