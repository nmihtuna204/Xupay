import type { Metadata } from "next";
// Self-hosted Geist fonts (bundled woff2 via next/font/local under the hood).
// Deliberately NOT next/font/google: that fetches from Google Fonts at build
// time, which fails in the offline Docker builder. These need no network.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "XuPay — Digital Wallet & Payments",
  description:
    "Ledger-accurate fintech platform: wallets, transfers, fraud detection, and compliance — built on Next.js 16 and Spring Boot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      // The reveal boot script adds `.reveal-ready` to <html> before hydration
      // (same pattern as theme scripts) — suppress the expected mismatch.
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
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
