"use client";

import { useEffect, useRef } from "react";

/**
 * Reveal-on-scroll wrapper. Renders a `[data-reveal]` element and, via an
 * IntersectionObserver, flips it to `[data-reveal="in"]` the first time it
 * enters the viewport — the fade+rise transition itself lives in globals.css
 * and is disabled under prefers-reduced-motion.
 *
 * The observer toggles the DOM attribute directly (no React state), so there
 * is no re-render and nothing for the React Compiler to memoize.
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
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-reveal", "in");
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
      data-reveal=""
      className={className}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
