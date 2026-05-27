"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/admin/_lib/AdminAuthContext";

export function AdminNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const { logout } = useAdminAuth();
  const path = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/admin");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <span className="font-semibold text-white">AlyNaf Admin</span>
        <nav className="flex items-center gap-1">
          <NavLink href="/admin/orders" active={path.startsWith("/admin/orders")}>
            Orders
          </NavLink>
          <NavLink href="/admin/inbox" active={path.startsWith("/admin/inbox")}>
            <span className="flex items-center gap-1.5">
              Inbox
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-xs leading-none">
                  {unreadCount}
                </span>
              )}
            </span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="ml-3 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-white"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
