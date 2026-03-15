import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listEntries } from "@/lib/db/biometrics.repo";
import { FIELD_DEFS } from "@/components/biometrics/fields";
import type { RangeKey } from "@/components/biometrics/entries-chart";
import { buildExportHtml } from "@/lib/export/export-html";
import fs from "node:fs";
import path from "node:path";

function asRangeKey(v: string | null): RangeKey {
  if (v === "2d" || v === "7d" || v === "1m" || v === "6m" || v === "all") return v;
  return "1m";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = asRangeKey(url.searchParams.get("range"));

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data, error } = await listEntries(supabase);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const bundlePath = path.join(process.cwd(), "src", "lib", "export", "chartjs.bundle.min.js");
  const chartJsBundle = fs.readFileSync(bundlePath, "utf8");

  const html = buildExportHtml({
    rows: data ?? [],
    range,
    fieldDefs: FIELD_DEFS,
    chartJsBundle,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="biometria_export.html"`,
    },
  });
}
