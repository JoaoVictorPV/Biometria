import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthCard } from "./ui/auth-card";
import { hasSupabaseEnv } from "@/lib/env";
import { NoSupabaseCard } from "./ui/no-supabase-card";

export default async function AuthPage() {
  if (!hasSupabaseEnv()) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md">
          <NoSupabaseCard />
        </div>
      </AppShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <AuthCard />
      </div>
    </AppShell>
  );
}
