import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/data/mode";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (isLocalMode()) {
    return <AppShell>{children}</AppShell>;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return <AppShell>{children}</AppShell>;
}
