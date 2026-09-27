"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// three + drei stay out of the server bundle and out of the first paint.
const RingScene = dynamic(() => import("./RingScene"), { ssr: false });

/** Canvas height below the viewport: the stretch the tier card overlaps. */
export const RING_EXTRA_BOTTOM = 352;

const LIVE_QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

function subscribeLive(onChange: () => void) {
  const mql = window.matchMedia(LIVE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Hero glass rings with a static fallback.
 *
 * The fallback image is what the server renders and what the first paint
 * shows, so the hero is never blank and the LCP is an ordinary image. On a
 * desktop that allows motion the WebGL scene is loaded on the client and
 * cross-fades in once it has drawn a frame. Phones and reduced-motion users
 * keep the still image (docs/design/spec.md §5). The scene only renders while
 * the hero is on screen.
 */
export function HeroRings() {
  const live = useSyncExternalStore(
    subscribeLive,
    () => window.matchMedia(LIVE_QUERY).matches,
    () => false
  );
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = wrapper.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "120px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const showScene = live && ready;

  return (
    <div
      ref={wrapper}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-[5] h-[calc(100svh+22rem)]"
    >
      {/*
        Sized with the same rule the scene uses for the top ring (60vw, capped
        at 95% of the viewport height), so the swap does not jump. Phones get
        a bigger crop of the same picture: 120vw, dropped so the top ring crosses
        behind the headline as it does on desktop.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element -- a decorative, preloaded still; next/image adds nothing to a CSS-sized background picture */}
      <img
        src="/ring-fallback.png"
        alt=""
        fetchPriority="high"
        className={cn(
          "absolute left-1/2 top-0 w-[120vw] max-w-none -translate-x-1/2 translate-y-[3%] transition-opacity duration-700 md:w-[min(60vw,95svh)] md:translate-y-[2svh]",
          showScene && "opacity-0"
        )}
      />
      {live && (
        <div className={cn("absolute inset-0 opacity-0 transition-opacity duration-700", showScene && "opacity-100")}>
          <RingScene active={visible} extraBottom={RING_EXTRA_BOTTOM} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}
