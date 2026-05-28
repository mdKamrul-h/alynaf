"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "./_lib/AdminAuthContext";

export default function AdminLoginPage() {
  const { adminKey, setAdminKey, ready } = useAdminAuth();
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && adminKey) router.replace("/admin/dashboard");
  }, [ready, adminKey, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", { headers: { "x-admin-key": key } });
      if (!res.ok) throw new Error();
      setAdminKey(key);
      router.push("/admin/dashboard");
    } catch {
      setError("Invalid admin key. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready || adminKey) return null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--bg)" }}>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-96 w-96 rounded-full opacity-10 blur-[120px]"
          style={{ background: "radial-gradient(circle, #C8920E 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgba(200,146,14,0.15)", border: "1px solid rgba(200,146,14,0.3)" }}>
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C8920E" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M7 1V13M1 4L13 10M13 4L1 10" stroke="#C8920E" strokeWidth="1" strokeOpacity="0.5" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-[15px] font-semibold text-white">AlyNaf Admin</h1>
            <p className="mt-0.5 text-[13px]" style={{ color: "var(--muted)" }}>
              Sign in to manage your orders
            </p>
          </div>
        </div>

        {/* Card */}
        <form onSubmit={handleLogin}
          className="rounded-2xl p-6"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium" style={{ color: "var(--muted2)" }}>
                Admin key
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter your admin key"
                autoFocus
                autoComplete="current-password"
                className="inp w-full"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !key}
              className="btn-gold w-full py-2.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Continue"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-[11px]" style={{ color: "var(--muted)" }}>
          Set <code className="rounded bg-white/5 px-1 py-0.5">ADMIN_KEY</code> env var in production
        </p>
      </div>
    </div>
  );
}
