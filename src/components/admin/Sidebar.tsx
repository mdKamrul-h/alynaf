"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/admin/_lib/AdminAuthContext";
import { useEffect, useState } from "react";

export const SIDEBAR_FULL  = 224;
export const SIDEBAR_ICONS = 48;

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { adminKey, logout } = useAdminAuth();
  const pathname = usePathname();
  const router   = useRouter();
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

  function handleLogout() { logout(); router.push("/admin"); }

  const links = [
    { href: "/admin/dashboard",    label: "Dashboard",  icon: <IconDashboard /> },
    { href: "/admin/orders",       label: "Orders",     icon: <IconOrders /> },
    { href: "/admin/inbox",        label: "Inbox",      icon: <IconInbox />, badge: unread },
    { href: "/admin/ai-settings",  label: "AI Agent",   icon: <IconAI /> },
  ];

  const w = collapsed ? SIDEBAR_ICONS : SIDEBAR_FULL;

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col"
      style={{ width: w, background: "var(--bg2)", borderRight: "1px solid var(--border)", transition: "width 0.2s ease" }}
    >
      {/* Brand */}
      <div
        className={`flex h-14 shrink-0 items-center ${collapsed ? "justify-center" : "gap-3 px-5"}`}
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "rgba(200,146,14,0.15)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#C8920E" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M7 1V13M1 4L13 10M13 4L1 10" stroke="#C8920E" strokeWidth="1" strokeOpacity="0.4" />
          </svg>
        </div>
        {!collapsed && (
          <span className="whitespace-nowrap text-[13px] font-semibold tracking-wide text-white">
            AlyNaf Admin
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex flex-1 flex-col gap-0.5 py-4 ${collapsed ? "px-2" : "px-3"}`}>
        {links.map(({ href, label, icon, badge }) => {
          const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 ${
                collapsed ? "h-10 w-10 justify-center mx-auto" : "gap-3 px-3 py-2.5 w-full"
              }`}
              style={active ? { background: "rgba(200,146,14,0.12)", color: "#C8920E" } : { color: "var(--muted2)" }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ""; }}
            >
              <span className="shrink-0">{icon}</span>
              {!collapsed && <span className="flex-1">{label}</span>}

              {/* Badge */}
              {(badge ?? 0) > 0 && (
                collapsed ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
                    {(badge ?? 0) > 9 ? "9+" : badge}
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {badge}
                  </span>
                )
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div
        className={`shrink-0 pb-4 pt-0 ${collapsed ? "px-2" : "px-3"}`}
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          className={`mt-4 flex items-center rounded-lg text-[13px] font-medium transition-all ${
            collapsed ? "h-10 w-10 justify-center mx-auto" : "w-full gap-3 px-3 py-2.5"
          }`}
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--muted)"; }}
        >
          <IconLogout />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1.5" opacity="0.7" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1.5" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1.5" opacity="0.7" />
    </svg>
  );
}

function IconOrders() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h12l-1.5 7H3.5L2 4Z" />
      <path d="M2 4L1 1.5H0" />
      <circle cx="5.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8.5V12a1 1 0 01-1 1H3a1 1 0 01-1-1V8.5" />
      <path d="M2 8.5h2.5l1 2h5l1-2H14" />
      <path d="M5 3h6M5 5.5h4" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" />
      <path d="M11 11l3-3-3-3M14 8H6" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.42 1.42M11.36 11.36l1.42 1.42M3.22 12.78l1.42-1.42M11.36 4.64l1.42-1.42" />
    </svg>
  );
}
