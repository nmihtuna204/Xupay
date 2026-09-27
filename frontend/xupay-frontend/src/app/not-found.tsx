import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-4 overflow-hidden bg-background px-4 text-center">
      <div aria-hidden className="aperture-glow absolute inset-0 -z-20" />
      <div aria-hidden className="grid-ground absolute inset-0 -z-10" />
      <p className="display-hero text-[clamp(5rem,14vw,9rem)] text-foreground">404</p>
      <h1 className="text-xl font-medium tracking-[-0.02em]">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Button asChild className="mt-2">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
