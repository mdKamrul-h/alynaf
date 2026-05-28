"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/admin/_lib/AdminAuthContext";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AiAgentSettings } from "@/lib/ai-settings-types";
import { DEFAULT_AI_SETTINGS } from "@/lib/ai-settings-types";

export default function AiSettingsPage() {
  const { adminKey, ready } = useAdminAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<AiAgentSettings>({ ...DEFAULT_AI_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !adminKey) router.push("/admin");
  }, [ready, adminKey, router]);

  useEffect(() => {
    if (!adminKey) return;
    fetch("/api/admin/ai-settings", { headers: { "x-admin-key": adminKey } })
      .then((r) => r.json())
      .then((d: { settings?: AiAgentSettings }) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {/* use defaults */})
      .finally(() => setLoading(false));
  }, [adminKey]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!adminKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(settings),
      });
      const data = await res.json() as { settings?: AiAgentSettings; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      if (data.settings) setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof AiAgentSettings, value: string | boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (!ready || loading) {
    return (
      <AdminShell>
        <div className="px-8 py-8 flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#C8920E]" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="px-8 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">AI Agent Settings</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Configure how the AI agent drafts replies to customer messages.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity */}
          <Section title="Agent Identity">
            <Field label="Agent Name" hint="Shown in replies and used in the agent's self-reference">
              <input
                type="text"
                value={settings.agentName}
                onChange={(e) => field("agentName", e.target.value)}
                className="input-base w-full"
                placeholder="AlyNaf"
              />
            </Field>
          </Section>

          {/* Tone & Language */}
          <Section title="Tone & Language">
            <Field label="Tone">
              <RadioGroup
                name="tone"
                value={settings.tone}
                onChange={(v) => field("tone", v)}
                options={[
                  { value: "friendly", label: "Friendly", desc: "Warm and casual, use inshaAllah naturally" },
                  { value: "professional", label: "Professional", desc: "Polite and business-focused" },
                  { value: "formal", label: "Formal", desc: "Formal honorifics and respectful phrasing" },
                ]}
              />
            </Field>

            <Field label="Language" hint="What language the agent writes in">
              <RadioGroup
                name="language"
                value={settings.language}
                onChange={(v) => field("language", v)}
                options={[
                  { value: "auto", label: "Auto (mirror customer)", desc: "Matches Bangla, English, or Banglish" },
                  { value: "bangla", label: "Bangla / Banglish", desc: "Romanized Bangla with Bangladeshi expressions" },
                  { value: "english", label: "English", desc: "English only, clear and simple" },
                ]}
              />
            </Field>

            <Field label="Reply Length">
              <RadioGroup
                name="replyLength"
                value={settings.replyLength}
                onChange={(v) => field("replyLength", v)}
                options={[
                  { value: "short", label: "Short", desc: "1–3 sentences — best for quick acknowledgements" },
                  { value: "medium", label: "Medium", desc: "2–4 sentences — good for detailed order queries" },
                ]}
              />
            </Field>
          </Section>

          {/* Business Context */}
          <Section title="Business Context">
            <Field label="Business Description" hint="The AI uses this to understand what your business offers">
              <textarea
                value={settings.businessContext}
                onChange={(e) => field("businessContext", e.target.value)}
                rows={4}
                className="input-base w-full resize-none"
                placeholder="Describe your business, the stores you source from, and your delivery process…"
              />
            </Field>

            <Field label="Greeting Template" hint="Optional — how to open a first reply to a new customer">
              <input
                type="text"
                value={settings.greetingTemplate}
                onChange={(e) => field("greetingTemplate", e.target.value)}
                className="input-base w-full"
                placeholder="e.g. Assalamu alaikum! AlyNaf er pokkhe bolchi…"
              />
            </Field>
          </Section>

          {/* Custom Instructions */}
          <Section title="Custom Instructions">
            <Field
              label="Additional Rules"
              hint="Any extra instructions the AI should follow — e.g. pricing rules, what not to promise, escalation triggers"
            >
              <textarea
                value={settings.customInstructions}
                onChange={(e) => field("customInstructions", e.target.value)}
                rows={5}
                className="input-base w-full resize-none"
                placeholder={`e.g.\n- Never quote a price without adding "approximate"\n- If customer mentions customs issue, escalate to owner immediately\n- Always ask for bKash number before confirming payment`}
              />
            </Field>
          </Section>

          {/* Auto-reply (future) */}
          <Section title="Auto-Reply">
            <div className="flex items-start gap-3">
              <div className="relative mt-0.5 h-5 w-9 flex-shrink-0">
                <input
                  id="autoReply"
                  type="checkbox"
                  checked={settings.autoReplyEnabled}
                  onChange={(e) => field("autoReplyEnabled", e.target.checked)}
                  className="peer sr-only"
                />
                <label
                  htmlFor="autoReply"
                  className="block h-5 w-9 cursor-pointer rounded-full transition-colors"
                  style={{
                    background: settings.autoReplyEnabled ? "#C8920E" : "rgba(255,255,255,0.12)",
                  }}
                />
                <span
                  className="pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: settings.autoReplyEnabled ? "translateX(16px)" : "translateX(0)" }}
                />
              </div>
              <div>
                <label htmlFor="autoReply" className="cursor-pointer text-sm font-medium text-white">
                  Auto-reply on new messages
                </label>
                <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                  When enabled, the AI will automatically send a reply when a new customer message arrives.
                  {" "}
                  <span style={{ color: "rgba(200,146,14,0.8)" }}>Coming soon — saved but not yet active.</span>
                </p>
              </div>
            </div>
          </Section>

          {/* Feedback & Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-gold px-5 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Settings"}
            </button>
            {saved && (
              <span className="text-sm font-medium text-emerald-400">Saved successfully</span>
            )}
            {error && (
              <span className="text-sm text-red-400">{error}</span>
            )}
          </div>
        </form>
      </div>
      </div>
    </AdminShell>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 space-y-5" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
      <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted2)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-white">{label}</label>
      {hint && <p className="text-xs" style={{ color: "var(--muted)" }}>{hint}</p>}
      {children}
    </div>
  );
}

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string; desc: string }>;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-all"
          style={
            value === opt.value
              ? { background: "rgba(200,146,14,0.08)", border: "1px solid rgba(200,146,14,0.25)" }
              : { background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }
          }
        >
          <div className="relative mt-0.5 h-4 w-4 flex-shrink-0">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              className="block h-4 w-4 rounded-full border-2"
              style={{
                borderColor: value === opt.value ? "#C8920E" : "rgba(255,255,255,0.2)",
                background: value === opt.value ? "rgba(200,146,14,0.2)" : "transparent",
              }}
            />
            {value === opt.value && (
              <span className="absolute inset-0 m-auto h-1.5 w-1.5 rounded-full bg-[#C8920E]" />
            )}
          </div>
          <div>
            <span className="text-[13px] font-medium text-white">{opt.label}</span>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{opt.desc}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
