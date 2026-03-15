import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listEntries } from "@/lib/db/biometrics.repo";
import { AppPageClient } from "./ui/app-page-client";
import { isLocalMode } from "@/lib/data/mode";
import { listLocalEntries } from "@/lib/localdb/entries";

export default async function AppPage() {
  if (isLocalMode()) {
    const localRows = await listLocalEntries();
    return <AppPageClient userId="local" initialRows={localRows} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ProtectedLayout já garante, mas mantemos por robustez.
  if (!user) return null;

  const { data, error } = await listEntries(supabase);
  if (error) throw error;

  return <AppPageClient userId={user.id} initialRows={data ?? []} />;
}
