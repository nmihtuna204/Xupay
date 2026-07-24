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
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
