import { AppShell } from "@/components/layout/AppShell";
import { MockProvider } from "@/providers/mock-provider";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <MockProvider>
      <AppShell>{children}</AppShell>
    </MockProvider>
  );
}
