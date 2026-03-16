import type { BiometricEntry } from "@/lib/db/types";
import type { FieldDef, FieldKey } from "@/components/biometrics/fields";
import type { RangeKey } from "@/components/biometrics/entries-chart";
import { formatDayBR, formatNumber, formatTimeBR } from "@/lib/formatters";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rangeLabel(range: RangeKey) {
  if (range === "1d") return "1 dia";
  if (range === "1m") return "1 mês";
  if (range === "6m") return "6 meses";
  if (range === "1y") return "1 ano";
  return range.replace("d", " dias");
}

function maxPointsForRange(range: RangeKey) {
  // Mesma ideia do app: resolução define densidade, sem estourar performance.
  return range === "1d"
    ? 48
    : range === "7d"
      ? 140
      : range === "1m"
        ? 240
        : range === "6m"
          ? 300
          : 360;
}

function downsample<T>(arr: T[], max: number) {
  if (arr.length <= max) return arr;
  const step = Math.ceil(arr.length / max);
  return arr.filter((_, idx) => idx % step === 0);
}

function makeMetricSeries(rows: BiometricEntry[], key: FieldKey, range: RangeKey) {
  const series = [...rows]
    .slice(0, 5000)
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .map((r) => {
      const t = new Date(r.measured_at).getTime();
      const v = r[key] as number | null;
      return { t, v };
    })
    .filter((p) => p.v !== null && Number.isFinite(p.t));

  return downsample(series, maxPointsForRange(range));
}

export function buildExportHtml(args: {
  rows: BiometricEntry[];
  range: RangeKey;
  fieldDefs: FieldDef[];
  chartJsBundle: string;
}) {
  // Para ser um espelho fiel do gráfico do app:
  // - NÃO cortamos registros por tempo aqui.
  // - A "resolução" afeta apenas a densidade (downsample).
  const filtered = args.rows;

  const columns: Array<{ key: FieldKey; label: string; unit?: string }> = args.fieldDefs.map(
    (f) => ({ key: f.key, label: f.label, unit: f.unit }),
  );

  const rowsHtml = filtered
    .slice(0, 5000)
    .map((r) => {
      const values = columns
        .map((c) => {
          const v = r[c.key] as number | null;
          const digits = c.key === "glucose_mg_dl" || c.key.startsWith("bp_") ? 0 : 1;
          return `<td>${escapeHtml(formatNumber(v, digits))}</td>`;
        })
        .join("");

      const pa = r.bp_systolic && r.bp_diastolic ? `${r.bp_systolic}/${r.bp_diastolic}` : "—";
      const notes = r.notes?.trim() ? r.notes.trim() : "";

      return `
<tr>
  <td class="dt">
    <div class="d">${escapeHtml(formatDayBR(r.measured_at))}</div>
    <div class="t">${escapeHtml(formatTimeBR(r.measured_at))}</div>
  </td>
  ${values}
  <td class="pa">${escapeHtml(pa)}</td>
  <td class="notes">${escapeHtml(notes)}</td>
</tr>`;
    })
    .join("");

  const metrics = args.fieldDefs.map((f) => f.key);
  const charts = metrics
    .map((k) => {
      const def = args.fieldDefs.find((f) => f.key === k)!;
      return {
        key: k,
        label: def.label,
        unit: def.unit ?? "",
        series: makeMetricSeries(filtered, k, args.range),
      };
    })
    .filter((m) => m.series.length > 0);

  const dataJson = JSON.stringify({
    generatedAt: new Date().toISOString(),
    range: args.range,
    charts,
  });

  const css = `
:root{color-scheme:light;--muted:#64748b;--line:rgba(15,23,42,.12)}
*{box-sizing:border-box}
body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; background:radial-gradient(circle at 20% 0%,rgba(14,165,233,.12),transparent 40%),radial-gradient(circle at 80% 20%,rgba(167,139,250,.10),transparent 45%),radial-gradient(circle at 60% 90%,rgba(52,211,153,.08),transparent 55%),#f8fafc;color:#0f172a}
.wrap{max-width:1100px;margin:0 auto;padding:22px 14px 42px}
.top{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.brand{display:flex;gap:10px;align-items:center}
.title{font-size:18px;font-weight:800;letter-spacing:-.02em;margin:0}
.meta{font-size:12px;color:var(--muted)}
.pill{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--line);background:rgba(255,255,255,.8);border-radius:999px;font-size:12px}
.stack{display:flex;flex-direction:column;gap:14px;margin-top:14px}
.card{border:1px solid var(--line);background:rgba(255,255,255,.82);border-radius:18px;box-shadow:0 8px 28px rgba(2,6,23,.06);overflow:hidden}
.card h2{font-size:14px;margin:0;padding:14px 14px 0;font-weight:800}
.card p{margin:6px 14px 14px;color:var(--muted);font-size:12px}
.scroll{overflow:auto}
table{width:100%;border-collapse:separate;border-spacing:0;min-width:980px}
thead th{position:sticky;top:0;background:rgba(248,250,252,.94);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);font-size:11px;color:var(--muted);text-align:left;padding:10px;white-space:nowrap}
tbody td{border-bottom:1px solid rgba(15,23,42,.06);padding:10px;font-size:12px;white-space:nowrap}
tbody tr:hover td{background:rgba(14,165,233,.05)}
td.dt .d{font-weight:700}
td.dt .t{color:var(--muted);font-size:11px;margin-top:2px}
td.notes{max-width:380px;white-space:normal}
.charts{display:grid;grid-template-columns:1fr;gap:12px;padding:14px}
.chart{border:1px solid rgba(15,23,42,.10);border-radius:14px;background:rgba(255,255,255,.65);padding:10px;display:flex;flex-direction:column;height:320px}
.chart .h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:4px 4px 10px}
.chart .h b{font-size:12px}
.chart .h span{font-size:11px;color:var(--muted)}
.chart canvas{display:block;width:100% !important;height:100% !important;flex:1;min-height:0}
`;

  const brandSvg = `
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:18px;height:18px">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22d3ee"/>
      <stop offset=".55" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#34d399"/>
    </linearGradient>
  </defs>
  <circle cx="24" cy="24" r="18" fill="none" stroke="url(#g1)" stroke-width="2.2" opacity=".95"/>
  <path d="M14 25.5c3.5-6.5 6.5-6.5 10 0 2.2 4.2 4.6 4.2 7.8-0.5" fill="none" stroke="#0ea5e9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="34" cy="25" r="2.6" fill="url(#g1)" opacity=".95"/>
</svg>`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Biometria — Exportação</title>
  <style>${css}</style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div class="brand">
        ${brandSvg}
        <div>
          <h1 class="title">Biometria — Exportação</h1>
          <div class="meta">Gerado em ${escapeHtml(new Date().toLocaleString("pt-BR"))} • Intervalo: ${escapeHtml(rangeLabel(args.range))}</div>
        </div>
      </div>
      <div class="pill">Arquivo único • Funciona offline</div>
    </div>

    <div class="stack">
      <div class="card">
        <h2>Tabela</h2>
        <p>Colunas organizadas por parâmetro. Observações aparecem na última coluna.</p>
        <div class="scroll">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                ${columns
                  .map(
                    (c) =>
                      `<th>${escapeHtml(c.label)}${c.unit ? ` (${escapeHtml(c.unit)})` : ""}</th>`,
                  )
                  .join("")}
                <th>PA</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h2>Gráfico</h2>
        <p>Exporta apenas o parâmetro selecionado no app (no mesmo intervalo).</p>
        <div class="charts" id="charts"></div>
      </div>
    </div>
  </div>

  <script>
${args.chartJsBundle}
  </script>
  <script>
    const EXPORT = ${dataJson};

    function fmtDate(t){
      const d = new Date(Number(t));
      return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    }

    const container = document.getElementById('charts');
    const palette = ['#0ea5e9', '#a78bfa', '#34d399', '#f59e0b', '#ef4444'];

    (EXPORT.charts || []).forEach((m, idx) => {
      const el = document.createElement('div');
      el.className = 'chart';
      el.innerHTML = '<div class="h"><b></b><span></span></div><canvas></canvas>';
      const b = el.querySelector('b');
      const span = el.querySelector('span');
      if (b) b.textContent = String(m.label ?? '');
      if (span) span.textContent = m.unit ? "(" + m.unit + ")" : '';
      container.appendChild(el);

      const canvas = el.querySelector('canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const color = palette[idx % palette.length];
      const points = (m.series || []).map(p => ({ x: p.t, y: p.v }));
      if (!points.length) {
        el.style.display = 'none';
        return;
      }

      // Define tamanho fixo do canvas (evita "crescer" infinitamente em alguns browsers mobile)
      canvas.width = Math.max(900, el.clientWidth || 900);
      canvas.height = 260;

      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: m.label,
            data: points,
            borderColor: color,
            backgroundColor: color + '22',
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.25,
            fill: true,
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: false,
          parsing: false,
          devicePixelRatio: 1,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(2,6,23,.92)',
              borderColor: 'rgba(255,255,255,.12)',
              borderWidth: 1,
              titleColor: 'white',
              bodyColor: 'white',
              padding: 10,
              displayColors: false,
            }
          },
          scales: {
            x: {
              type: 'linear',
              grid: { color: 'rgba(15,23,42,.06)' },
              ticks: {
                maxTicksLimit: 6,
                color: 'rgba(15,23,42,.75)',
                callback: (v) => fmtDate(v),
              }
            },
            y: {
              grid: { color: 'rgba(15,23,42,.06)' },
              ticks: { color: 'rgba(15,23,42,.75)' }
            }
          }
        }
      });

      // Reflow pós-layout (iOS às vezes calcula 0px no primeiro frame)
      setTimeout(() => {
        try { chart.resize(); chart.update('none'); } catch {}
      }, 0);
    });
  </script>
</body>
</html>`;
}
