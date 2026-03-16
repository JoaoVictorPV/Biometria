import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listEntries } from "@/lib/db/biometrics.repo";
import { FIELD_DEFS } from "@/components/biometrics/fields";
import type { FieldKey } from "@/components/biometrics/fields";
import type { RangeKey } from "@/components/biometrics/entries-chart";
import { buildExportHtml } from "@/lib/export/export-html";

type ExportBody = {
  range?: RangeKey;
  metric?: FieldKey;
  chartSvg?: string | null;
  chartPngDataUrl?: string | null;
};

function asRangeKey(v: string | null | undefined): RangeKey {
  if (v === "1d" || v === "7d" || v === "1m" || v === "6m" || v === "1y") return v;
  return "1m";
}

function asFieldKey(v: string | null | undefined): FieldKey | null {
  if (!v) return null;
  return (FIELD_DEFS.find((f) => f.key === v)?.key as FieldKey | undefined) ?? null;
}

async function parseJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

async function handleExport(args: {
  range: RangeKey;
  metric: FieldKey | null;
  chartSvg: string | null;
  chartPngDataUrl: string | null;
}) {
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

  const fieldDefs = args.metric ? FIELD_DEFS.filter((f) => f.key === args.metric) : FIELD_DEFS;

  const html = buildExportHtml({
    rows: data ?? [],
    range: args.range,
    fieldDefs,
    // ChartJS fica apenas como fallback (o principal é PNG/SVG embutido)
    chartJsBundle: "",
    chartSvg: args.chartSvg,
    chartPngDataUrl: args.chartPngDataUrl,
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = asRangeKey(url.searchParams.get("range"));
  const metric = asFieldKey(url.searchParams.get("metric"));

  return await handleExport({ range, metric, chartSvg: null, chartPngDataUrl: null });
}

export async function POST(request: Request) {
  const body = await parseJson<ExportBody>(request);
  const range = asRangeKey(body?.range);
  const metric = asFieldKey(body?.metric);
  const chartSvg = typeof body?.chartSvg === "string" ? body.chartSvg : null;
  const chartPngDataUrl = typeof body?.chartPngDataUrl === "string" ? body.chartPngDataUrl : null;

  return await handleExport({ range, metric, chartSvg, chartPngDataUrl });
}
