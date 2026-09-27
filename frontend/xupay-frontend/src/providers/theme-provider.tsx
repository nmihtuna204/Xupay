"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme wiring.
 *
 * The product is dark-only (docs/design/spec.md), and the tokens live in
 * :root, so no class is needed to get the palette. next-themes still owns
 * <html>: forcing "dark" puts the .dark class there, which is what the shadcn
 * primitives' dark: variants and the sonner toaster key off, and it sets
 * color-scheme so native controls (date pickers, scrollbars) render dark too.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="dark"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
