import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AppActionsProvider } from "@/components/app-actions-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/data/mode";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (isLocalMode()) {
    return (
      <AppActionsProvider>
        <AppShell>{children}</AppShell>
      </AppActionsProvider>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <AppActionsProvider>
      <AppShell>{children}</AppShell>
    </AppActionsProvider>
  );
}
