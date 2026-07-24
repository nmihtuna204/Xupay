"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal-on-scroll wrapper. Renders a `.reveal` element and, via an
 * IntersectionObserver, adds `.is-revealed` the first time it enters view —
 * the fade+rise transition lives in globals.css and is gated behind
 * `.reveal-ready` (set by the boot script in the root layout).
 *
 * Because the hidden state only applies once `.reveal-ready` is present AND a
 * plain boot script also reveals on scroll, content is never left invisible
 * if JS is off or React hydration fails. The observer here is the primary
 * path (and handles client-side navigation); it only ADDS a class, so it
 * can't conflict with the boot script or with hydration.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      node.classList.add("is-revealed");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      // The boot script may add `.is-revealed` before hydration; let React
      // keep it rather than resetting the class.
      suppressHydrationWarning
    >
      {children}
    </Tag>
  );
}
