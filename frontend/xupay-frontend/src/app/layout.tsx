import type { Metadata } from "next";
// Self-hosted Geist fonts (bundled woff2 via next/font/local under the hood).
// Deliberately NOT next/font/google: that fetches from Google Fonts at build
// time, which fails in the offline Docker builder. These need no network.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

/*
 * The dong sign (U+20AB), drawn in Geist's own strokes. Neither Geist face has
 * it, so without these every VND amount borrowed the sign from Arial or
 * Consolas. Each file holds that one glyph (built by
 * scripts/build-dong-font.py), and unicode-range keeps it out of the way: the
 * face is only fetched where a dong sign appears, and it never becomes the
 * "first available font" that line-height and ch units are measured from.
 * No fallback adjustment - there is nothing for it to stand in for.
 * (Two literal calls on purpose: next/font only accepts object literals.)
 */
const dongSans = localFont({
  src: "../fonts/dong-sans.woff",
  variable: "--font-dong-sans",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+20AB" }],
});
const dongMono = localFont({
  src: "../fonts/dong-mono.woff",
  variable: "--font-dong-mono",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+20AB" }],
});

export const metadata: Metadata = {
  title: "XuPay · Digital Wallet & Payments",
  description:
    "Ledger-accurate fintech platform: wallets, transfers, fraud detection, and compliance. Built on Next.js 16 and Spring Boot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${dongSans.variable} ${dongMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      // Two pre-hydration writers touch <html>: the reveal boot script adds
      // `.reveal-ready`, and next-themes adds the theme class. Both are the
      // standard pattern, and both need the mismatch suppressed.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {/*
          Reveal boot script — runs before content paints (adds `.reveal-ready`
          so the hidden state applies with no flash) and drives its own
          IntersectionObserver in plain JS. This means scroll reveals work even
          if React hydration fails; and if JS is disabled entirely, the class is
          never added so content stays fully visible. Idempotent with <Reveal>.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var r=document.documentElement;r.classList.add('reveal-ready');" +
              "function rv(e){e.classList.add('is-revealed')}" +
              "function init(){var els=document.querySelectorAll('.reveal');" +
              "if(!('IntersectionObserver' in window)){for(var i=0;i<els.length;i++)rv(els[i]);return;}" +
              "var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){rv(e.target);io.unobserve(e.target)}})},{threshold:0.15,rootMargin:'0px 0px -8% 0px'});" +
              "for(var i=0;i<els.length;i++)io.observe(els[i]);}" +
              "if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);})();",
          }}
        />
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
