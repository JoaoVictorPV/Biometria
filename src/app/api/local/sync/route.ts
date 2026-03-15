import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { overwriteLocalEntries } from "@/lib/localdb/entries";
import { listEntries } from "@/lib/db/biometrics.repo";

export async function POST(request: Request) {
  // Sincroniza do ONLINE (Supabase) para o arquivo local, sobrescrevendo.
  // Requer que o usuário esteja logado (cookies de sessão).
  const url = new URL(request.url);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Você precisa estar logado para sincronizar. Vá em /auth e entre com link mágico.",
      },
      { status: 401 },
    );
  }

  const { data, error } = await listEntries(supabase);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await overwriteLocalEntries(data ?? []);

  return NextResponse.json({
    ok: true,
    count: (data ?? []).length,
    entries: data ?? [],
    origin: url.origin,
  });
}
