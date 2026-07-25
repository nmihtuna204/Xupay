"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle, CircleNotch, Info, Warning, XCircle } from "@phosphor-icons/react/dist/ssr"

// XuPay is light-first. Sonner reads the theme from next-themes now that the
// provider is wired, so toasts follow the page instead of being pinned dark.
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "light"}
      className="toaster group"
      icons={{
        success: (
          <CheckCircle weight="light" className="size-4" />
        ),
        info: (
          <Info weight="light" className="size-4" />
        ),
        warning: (
          <Warning weight="light" className="size-4" />
        ),
        error: (
          <XCircle weight="light" className="size-4" />
        ),
        loading: (
          <CircleNotch weight="light" className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
