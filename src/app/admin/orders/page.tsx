"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../_lib/AdminAuthContext";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrdersTab } from "@/components/admin/OrdersTab";

export default function AdminOrdersPage() {
  const { adminKey, ready } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !adminKey) router.replace("/admin");
  }, [ready, adminKey, router]);

  if (!ready || !adminKey) return null;

  return (
    <AdminShell>
      <div className="px-8 py-8">
        <OrdersTab adminKey={adminKey} />
      </div>
    </AdminShell>
  );
}
