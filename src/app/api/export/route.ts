import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listEntries } from "@/lib/db/biometrics.repo";
import { FIELD_DEFS } from "@/components/biometrics/fields";
import type { FieldKey } from "@/components/biometrics/fields";
import type { RangeKey } from "@/components/biometrics/entries-chart";
import { buildExportHtml } from "@/lib/export/export-html";
import fs from "node:fs";
import path from "node:path";

type ExportBody = {
  range?: RangeKey;
  metric?: FieldKey;
  chartSvg?: string | null;
};

function asRangeKey(v: string | null): RangeKey {
  if (v === "1d" || v === "7d" || v === "1m" || v === "6m" || v === "1y") return v;
  return "1m";
}

function asFieldKey(v: string | null): FieldKey | null {
  if (!v) return null;
  return (FIELD_DEFS.find((f) => f.key === v)?.key as FieldKey | undefined) ?? null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = asRangeKey(url.searchParams.get("range"));
  const metric = asFieldKey(url.searchParams.get("metric"));

  return await handleExport({ range, metric, chartSvg: null });
}

export async function POST(request: Request) {
  let body: ExportBody | null = null;
  try {
    body = (await request.json()) as ExportBody;
  } catch {
    body = null;
  }

  const range = asRangeKey(body?.range ?? null);
  const metric = asFieldKey(body?.metric ?? null);
  const chartSvg = typeof body?.chartSvg === "string" ? body.chartSvg : null;

  return await handleExport({ range, metric, chartSvg });
}

async function handleExport(args: { range: RangeKey; metric: FieldKey | null; chartSvg: string | null }) {

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

  const fieldDefs = args.metric ? FIELD_DEFS.filter((f) => f.key === args.metric) : FIELD_DEFS;

  const html = buildExportHtml({
    rows: data ?? [],
    range: args.range,
    fieldDefs,
    chartJsBundle,
    chartSvg: args.chartSvg,
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
