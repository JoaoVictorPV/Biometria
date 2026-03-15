import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Logado como: {user.email}</p>
        </CardHeader>
        <CardContent>
          <form action="/auth/signout" method="post">
            <Button variant="secondary" className="w-full">
              Sair
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
