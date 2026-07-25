import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {/*
          The app ground is mesh-bg--subtle, not the landing's mesh: roughly a
          third of the saturation. Enough pastel that the product feels like
          one system, light enough that a table of figures on a white panel
          still reads as the brightest thing on screen. Data wins over
          atmosphere on these routes.
        */}
        <main className="mesh-bg--subtle flex-1 overflow-y-auto">
          {/* One gutter and one max-width for every app page, from tokens, so
              no page hand-rolls its own padding and drifts out of alignment. */}
          <div className="mx-auto max-w-[1400px] px-page-x py-page-y">{children}</div>
        </main>
      </div>
    </div>
  );
}
