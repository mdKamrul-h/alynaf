"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../_lib/AdminAuthContext";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatsTab } from "@/components/admin/StatsTab";

export default function DashboardPage() {
  const { adminKey, ready } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !adminKey) router.replace("/admin");
  }, [ready, adminKey, router]);

  if (!ready || !adminKey) return null;

  return (
    <AdminShell>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Overview of your orders and conversations
          </p>
        </div>
        <StatsTab adminKey={adminKey} />
      </div>
    </AdminShell>
  );
}
