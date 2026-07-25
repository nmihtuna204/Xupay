"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme wiring.
 *
 * The app previously hardcoded class="dark" on <html>. It is now light-first:
 * next-themes owns the class, defaults to light, and does not follow the system
 * preference, because the dark token set is parked rather than shipped (see the
 * header of globals.css) and silently handing a system-dark visitor an
 * unaudited theme would be worse than giving everyone the light one.
 *
 * Flip enableSystem back on once the dark pass is done.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
