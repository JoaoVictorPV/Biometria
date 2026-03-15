import type { BiometricEntry } from "@/lib/db/types";
import type { FieldDef } from "@/components/biometrics/fields";
import type { FieldKey } from "@/components/biometrics/fields";
import type { RangeKey } from "@/components/biometrics/entries-chart";
import { formatDayBR, formatTimeBR, formatNumber } from "@/lib/formatters";

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rangeToMs(range: RangeKey): number | null {
  switch (range) {
    case "2d":
      return 2 * 864e5;
    case "7d":
      return 7 * 864e5;
    case "1m":
      return 30 * 864e5;
    case "6m":
      return 180 * 864e5;
    case "all":
      return null;
  }
}

function filterByRange(rows: BiometricEntry[], range: RangeKey) {
  const ms = rangeToMs(range);
  if (!ms) return rows;

  const times = rows
    .map((r) => new Date(r.measured_at).getTime())
    .filter((t) => Number.isFinite(t));
  const maxT = times.length ? Math.max(...times) : null;
  const cutoff = maxT ? maxT - ms : null;
  if (!cutoff) return rows;

  return rows.filter((r) => {
    const t = new Date(r.measured_at).getTime();
    return Number.isFinite(t) ? t >= cutoff : true;
  });
}

function rangeLabel(range: RangeKey) {
  if (range === "all") return "Tudo";
  if (range === "1m") return "1 mês";
  if (range === "6m") return "6 meses";
  return range.replace("d", " dias");
}

function makeMetricSeries(rows: BiometricEntry[], key: FieldKey) {
  const points = [...rows]
    .slice(0, 2000)
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .map((r) => {
      const t = new Date(r.measured_at).getTime();
      const v = r[key] as number | null;
      return { t, v };
    })
    .filter((p) => p.v !== null && Number.isFinite(p.t));

  return points;
}

export function buildExportHtml(args: {
  rows: BiometricEntry[];
  range: RangeKey;
  fieldDefs: FieldDef[];
  chartJsBundle: string;
}) {
  const filtered = filterByRange(args.rows, args.range);

  // Tabela: as colunas seguem os mesmos campos do app.
  const columns: Array<{ key: FieldKey; label: string; unit?: string }> = args.fieldDefs.map(
    (f) => ({ key: f.key, label: f.label, unit: f.unit }),
  );

  const rowsHtml = filtered
    .slice(0, 5000)
    .map((r) => {
      const cells = columns
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
          ${cells}
          <td class="pa">${escapeHtml(pa)}</td>
          <td class="notes">${escapeHtml(notes)}</td>
        </tr>`;
    })
    .join("");

  // Gráficos: 1 por métrica.
  const metrics = args.fieldDefs.map((f) => f.key);
  const charts = metrics
    .map((k) => {
      const def = args.fieldDefs.find((f) => f.key === k)!;
      return {
        key: k,
        label: def.label,
        unit: def.unit ?? "",
        series: makeMetricSeries(filtered, k),
      };
    })
    .filter((m) => m.series.length > 0);

  const dataJson = JSON.stringify({
    generatedAt: new Date().toISOString(),
    range: args.range,
    charts,
  });

  const css = `
  :root{color-scheme:light; --bg:#0b1020; --card:rgba(255,255,255,.86); --muted:#64748b; --line:rgba(15,23,42,.12); --accent:#0ea5e9; --accent2:#a78bfa; --accent3:#34d399;}
  *{box-sizing:border-box}
  body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,"Apple Color Emoji","Segoe UI Emoji";background:radial-gradient(circle at 20% 0%,rgba(14,165,233,.12),transparent 40%),radial-gradient(circle at 80% 20%,rgba(167,139,250,.10),transparent 45%),radial-gradient(circle at 60% 90%,rgba(52,211,153,.08),transparent 55%),#f8fafc;color:#0f172a;}
  .wrap{max-width:1100px;margin:0 auto;padding:28px 18px 42px;}
  .top{display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;}
  .brand{display:flex;gap:10px;align-items:center;}
  .title{font-size:18px;font-weight:800;letter-spacing:-.02em;margin:0;}
  .meta{font-size:12px;color:var(--muted);}
  .pill{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--line);background:rgba(255,255,255,.8);border-radius:999px;font-size:12px;color:#0f172a;}
  .grid{display:grid;grid-template-columns:1fr;gap:14px;margin-top:14px;}
  @media(min-width:980px){.grid{grid-template-columns: 1.1fr .9fr;}}
  .card{border:1px solid var(--line);background:rgba(255,255,255,.8);border-radius:18px;box-shadow:0 8px 28px rgba(2,6,23,.06);overflow:hidden;}
  .card h2{font-size:14px;margin:0;padding:14px 14px 0;font-weight:800;}
  .card p{margin:6px 14px 14px;color:var(--muted);font-size:12px;}
  table{width:100%;border-collapse:separate;border-spacing:0;min-width:980px;}
  thead th{position:sticky;top:0;background:rgba(248,250,252,.9);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);font-size:11px;color:var(--muted);text-align:left;padding:10px 10px;white-space:nowrap;}
  tbody td{border-bottom:1px solid rgba(15,23,42,.06);padding:10px 10px;font-size:12px;white-space:nowrap;}
  tbody tr:hover td{background:rgba(14,165,233,.05);}
  td.dt .d{font-weight:700}
  td.dt .t{color:var(--muted);font-size:11px;margin-top:2px}
  td.notes{max-width:320px;white-space:normal;}
  .scroll{overflow:auto;}
  .charts{display:grid;grid-template-columns:1fr;gap:12px;padding:14px;}
  .chart{border:1px solid rgba(15,23,42,.10);border-radius:14px;background:rgba(255,255,255,.65);padding:10px;}
  .chart .h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:4px 4px 10px;}
  .chart .h b{font-size:12px}
  .chart .h span{font-size:11px;color:var(--muted)}
  canvas{width:100%;height:220px;}
  `;

  // Um SVG simples e leve para a marca no export.
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

  const html = `<!doctype html>
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

      <div class="grid">
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
          <h2>Gráficos</h2>
          <p>Um gráfico por parâmetro com o mesmo intervalo selecionado no app.</p>
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
        const d = new Date(t);
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
        const ctx = canvas.getContext('2d');

        const color = palette[idx % palette.length];
        const labels = m.series.map(p => fmtDate(p.t));
        const values = m.series.map(p => p.v);

        new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: m.label,
              data: values,
              borderColor: color,
              backgroundColor: color + '22',
              borderWidth: 2.5,
              pointRadius: 0,
              tension: 0.25,
              fill: true,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
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
                grid: { color: 'rgba(15,23,42,.06)' },
                ticks: { maxTicksLimit: 6, color: 'rgba(15,23,42,.75)' }
              },
              y: {
                grid: { color: 'rgba(15,23,42,.06)' },
                ticks: { color: 'rgba(15,23,42,.75)' }
              }
            }
          }
        });
      });
    </script>
  </body>
</html>`;

  return html;
}
