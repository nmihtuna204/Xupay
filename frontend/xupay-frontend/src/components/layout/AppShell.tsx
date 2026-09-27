import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {/*
          The app ground is the landing's black with a single quiet indigo
          light at the top: enough to feel like the same product, never enough
          to compete with the opaque .panel surfaces the data sits on.
        */}
        <main className="app-ground flex-1 overflow-y-auto">
          {/* One gutter and one max-width for every app page, from tokens, so
              no page hand-rolls its own padding and drifts out of alignment. */}
          <div className="mx-auto max-w-[1400px] px-page-x py-page-y">{children}</div>
        </main>
      </div>
    </div>
  );
}
