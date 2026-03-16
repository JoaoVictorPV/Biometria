"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BiometricEntry } from "@/lib/db/types";
import { formatDateTimeBR } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { FIELD_DEFS, type FieldKey } from "./fields";

export type RangeKey = "1d" | "7d" | "1m" | "6m" | "1y";
export const RANGES: Array<{ value: RangeKey; label: string }> = [
  { value: "1d", label: "1d" },
  { value: "7d", label: "7d" },
  { value: "1m", label: "1m" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1a" },
];

type Props = {
  rows: BiometricEntry[];
  metric: FieldKey;
  onMetricChange: (m: FieldKey) => void;
  range?: RangeKey;
  onRangeChange?: (r: RangeKey) => void;
};

export function EntriesChart({ rows, metric, onMetricChange, range, onRangeChange }: Props) {
  // range default: 1m (mais limpo no celular)
  const [internalRange, setInternalRange] = useState<RangeKey>("1m");
  const currentRange = range ?? internalRange;
  const setRange = onRangeChange ?? setInternalRange;

  const metricDef = FIELD_DEFS.find((f) => f.key === metric)!;
  const options = FIELD_DEFS.map((f) => ({
    value: f.key,
    label: f.label,
  }));

  const metricOptions = options as Array<{ value: FieldKey; label: string }>;

  function rangeToMs(r: RangeKey): number | null {
    if (r === "1d") return 1 * 864e5;
    if (r === "7d") return 7 * 864e5;
    if (r === "1m") return 30 * 864e5;
    if (r === "6m") return 180 * 864e5;
    if (r === "1y") return 365 * 864e5;
    return null;
  }

  const data = useMemo(() => {
    // Regra robusta:
    // - A “resolução” (1d/7d/1m/6m/1a) define a JANELA DE TEMPO no eixo X.
    // - Para manter leve, fazemos downsample (limite de pontos) dentro da janela.
    // - A janela é calculada a partir do registro mais recente (não depende de Date.now()).
    const all = [...rows]
      .slice(0, 5000)
      .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
      .map((r) => ({
        measured_at: r.measured_at,
        t: new Date(r.measured_at).getTime(),
        value: r[metric],
      }))
      .filter((d) => d.value !== null && Number.isFinite(d.t));

    const maxT = all.length ? all[all.length - 1]!.t : null;
    const ms = rangeToMs(currentRange);
    const cutoff = maxT && ms ? maxT - ms : null;
    const windowed = cutoff ? all.filter((p) => p.t >= cutoff) : all;

    const maxPoints =
      currentRange === "1d"
        ? 48
        : currentRange === "7d"
          ? 140
          : currentRange === "1m"
            ? 240
            : currentRange === "6m"
              ? 300
              : 360;

    if (windowed.length <= maxPoints) return windowed;
    const step = Math.ceil(windowed.length / maxPoints);
    return windowed.filter((_, idx) => idx % step === 0);
  }, [rows, metric, currentRange]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>
            Gráfico — {metricDef.label}
            {metricDef.unit ? (
              <span className="ml-2 text-sm text-zinc-500">({metricDef.unit})</span>
            ) : null}
          </CardTitle>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Intervalo: {currentRange === "1y" ? "1 ano" : currentRange} • Toque e arraste no gráfico.
          </p>
        </div>
        <div className="flex flex-col gap-2 overflow-x-auto sm:items-end">
          <Segmented value={metric} onChange={onMetricChange} options={metricOptions} />
          <div className="flex justify-end">
            <Segmented value={currentRange} onChange={setRange} options={RANGES} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 overflow-hidden">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-600 dark:text-zinc-400">
              Sem dados para este parâmetro.
            </div>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="h-72 min-w-[860px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis
                      dataKey="t"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(v) => formatDateTimeBR(new Date(Number(v)).toISOString())}
                      minTickGap={24}
                      stroke="currentColor"
                      tick={{ fill: "currentColor", fontSize: 12 }}
                    />
                    <YAxis stroke="currentColor" tick={{ fill: "currentColor", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.8)",
                        border: "none",
                        borderRadius: 12,
                        color: "white",
                      }}
                      labelFormatter={(l) =>
                        `Data: ${formatDateTimeBR(new Date(Number(l)).toISOString())}`
                      }
                      formatter={(v) => [
                        String(v),
                        metricDef.unit ? `${metricDef.label} (${metricDef.unit})` : metricDef.label,
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      strokeWidth={2.5}
                      stroke="#0ea5e9"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
