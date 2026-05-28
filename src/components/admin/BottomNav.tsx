"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/admin/_lib/AdminAuthContext";
import { useEffect, useState } from "react";

const NAV = [
  {
    href: "/admin/dashboard",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1.5" y="1.5" width="5" height="5" rx="1.5" opacity="0.7" />
        <rect x="9.5" y="1.5" width="5" height="5" rx="1.5" />
        <rect x="1.5" y="9.5" width="5" height="5" rx="1.5" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" opacity="0.7" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h12l-1.5 7H3.5L2 4Z" />
        <path d="M2 4L1 1.5H0" />
        <circle cx="5.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="10.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/admin/inbox",
    label: "Inbox",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 8.5V12a1 1 0 01-1 1H3a1 1 0 01-1-1V8.5" />
        <path d="M2 8.5h2.5l1 2h5l1-2H14" />
        <path d="M5 3h6M5 5.5h4" />
      </svg>
    ),
    badge: true,
  },
  {
    href: "/admin/ai-settings",
    label: "AI",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.42 1.42M11.36 11.36l1.42 1.42M3.22 12.78l1.42-1.42M11.36 4.64l1.42-1.42" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const { adminKey, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!adminKey) return;
    async function poll() {
      const res = await fetch("/api/fb/conversations", { headers: { "x-admin-key": adminKey } });
      if (res.ok) {
        const d = await res.json() as { conversations: Array<{ unreadCount: number }> };
        setUnread(d.conversations?.filter((c) => c.unreadCount > 0).length ?? 0);
      }
    }
    poll();
    const t = setInterval(poll, 30_000);
    return () => clearInterval(t);
  }, [adminKey]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch md:hidden"
      style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.map(({ href, label, icon, badge }) => {
        const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
            style={{ color: active ? "#C8920E" : "var(--muted2)" }}
          >
            {badge && unread > 0 && (
              <span className="absolute right-[calc(50%-14px)] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[8px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
            {icon}
            {label}
          </Link>
        );
      })}

      {/* Logout */}
      <button
        onClick={() => { logout(); router.push("/admin"); }}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors"
        style={{ color: "var(--muted)" }}
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" />
          <path d="M11 11l3-3-3-3M14 8H6" />
        </svg>
        Logout
      </button>
    </nav>
  );
}
