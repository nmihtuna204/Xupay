import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "@/mocks/server";

// --- MSW lifecycle ---------------------------------------------------------
// The showcase-domain handlers are always registered (src/mocks/server.ts);
// individual tests add real-API-domain handlers via server.use(...).
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// --- jsdom polyfills --------------------------------------------------------
// Recharts' ResponsiveContainer relies on ResizeObserver, absent in jsdom.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

// matchMedia is read by theme/media-query code paths.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom has no layout, so Recharts' ResponsiveContainer measures 0×0 and
// renders nothing. Give it a fixed size so charts mount and their SVG exists.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      createElement("div", { style: { width: 800, height: 400 } }, children),
  };
});
