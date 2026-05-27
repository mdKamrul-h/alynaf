"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../_lib/AdminAuthContext";
import { AdminNav } from "@/components/admin/AdminNav";
import { ThreadView } from "@/components/admin/ThreadView";

export default function InboxThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { adminKey, ready } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !adminKey) router.replace("/admin");
  }, [ready, adminKey, router]);

  if (!ready || !adminKey) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <AdminNav />
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ThreadView adminKey={adminKey} convId={id} />
        </div>
      </main>
    </div>
  );
}
