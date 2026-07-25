import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {/* One gutter and one max-width for every app page, from tokens, so
              no page hand-rolls its own padding and drifts out of alignment. */}
          <div className="mx-auto max-w-[1400px] px-page-x py-page-y">{children}</div>
        </main>
      </div>
    </div>
  );
}
