"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAdminAuth } from "./_lib/AdminAuthContext";

export default function AdminPage() {
  const { adminKey, setAdminKey, ready } = useAdminAuth();
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && adminKey) {
      router.replace("/admin/orders");
    }
  }, [ready, adminKey, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        headers: { "x-admin-key": key },
      });
      if (!res.ok) throw new Error("bad key");
      setAdminKey(key);
      router.push("/admin/orders");
    } catch {
      setError("Invalid admin key");
    } finally {
      setLoading(false);
    }
  }

  if (!ready || adminKey) return null;

  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-[#0a0a0a] py-20 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-8"
        >
          <h1 className="text-xl font-bold">Admin Login</h1>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            autoFocus
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm focus:border-[#4a7c9b] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#4a7c9b] py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Checking…" : "Login"}
          </button>
          <p className="text-xs text-slate-500">
            Default key: alynaf-admin (set ADMIN_KEY in production)
          </p>
        </form>
      </main>
      <Footer />
    </>
  );
}
