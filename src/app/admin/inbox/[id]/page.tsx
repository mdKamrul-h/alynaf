"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InboxThreadRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/inbox?conv=${encodeURIComponent(id)}`);
  }, [id, router]);

  return null;
}
