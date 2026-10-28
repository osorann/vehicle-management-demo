import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider } from "@/components/session/session-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
