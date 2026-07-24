"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { VisuallyHidden } from "radix-ui";

/**
 * Mobile navigation drawer. On < md screens the fixed Sidebar is hidden, so
 * this button opens the same nav in a slide-in Sheet. Closing is handled by a
 * click listener on the nav region: any tap that lands on a nav link bubbles
 * up and closes the drawer, so navigation feels natural without a
 * setState-in-effect on route change.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <VisuallyHidden.Root>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Main application navigation</SheetDescription>
        </VisuallyHidden.Root>
        {/* A tap on any nav link bubbles here and dismisses the drawer. */}
        <div
          className="contents"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <Sidebar className="w-full border-r-0" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
