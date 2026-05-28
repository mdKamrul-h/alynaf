import { Sidebar, SIDEBAR_FULL } from "./Sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex flex-1 flex-col" style={{ paddingLeft: SIDEBAR_FULL }}>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
