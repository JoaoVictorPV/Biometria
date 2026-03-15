import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NoSupabaseCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração necessária</CardTitle>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Para usar login por link mágico e sincronização, configure o Supabase.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          Crie um arquivo <b>.env.local</b> na raiz (use <b>.env.example</b> como modelo) com:
        </p>
        <pre className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/40">
          NEXT_PUBLIC_SUPABASE_URL=...{"\n"}
          NEXT_PUBLIC_SUPABASE_ANON_KEY=...{"\n"}
          NEXT_PUBLIC_DATA_MODE=local (opcional)
        </pre>
        <p className="text-xs text-zinc-500">
          Sem isso, o app entra automaticamente no modo <b>LOCAL</b> (dados ficam só no seu PC).
        </p>
      </CardContent>
    </Card>
  );
}
