import { Sidebar, SIDEBAR_FULL } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content — full-width on mobile, shifted right on desktop */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-[224px]">
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom navigation — hidden on desktop */}
      <BottomNav />
    </div>
  );
}
