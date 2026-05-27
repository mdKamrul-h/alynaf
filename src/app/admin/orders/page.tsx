"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../_lib/AdminAuthContext";
import { AdminNav } from "@/components/admin/AdminNav";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { StatsTab } from "@/components/admin/StatsTab";
import Footer from "@/components/Footer";

export default function AdminOrdersPage() {
  const { adminKey, ready } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !adminKey) router.replace("/admin");
  }, [ready, adminKey, router]);

  if (!ready || !adminKey) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <AdminNav />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <OrdersTab adminKey={adminKey} />
          <StatsTab adminKey={adminKey} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
