"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BiometricEntry } from "@/lib/db/types";
import { formatDateTimeBR } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { FIELD_DEFS, type FieldKey } from "./fields";

type RangeKey = "7d" | "30d" | "90d" | "all";
const RANGES: Array<{ value: RangeKey; label: string }> = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "Tudo" },
];

type Props = {
  rows: BiometricEntry[];
  metric: FieldKey;
  onMetricChange: (m: FieldKey) => void;
};

export function EntriesChart({ rows, metric, onMetricChange }: Props) {
  // range default: 30d (mais limpo no celular)
  const [range, setRange] = useState<RangeKey>("30d");

  const metricDef = FIELD_DEFS.find((f) => f.key === metric)!;
  const options = FIELD_DEFS.map((f) => ({
    value: f.key,
    label: f.label,
  }));

  const metricOptions = options as Array<{ value: FieldKey; label: string }>;

  const data = useMemo(() => {
    // Evita sobrecarga: por padrão mostramos 30 dias.
    // Importante: para manter render puro, NÃO usamos Date.now().
    // A janela é calculada em relação ao registro mais recente.
    const ms =
      range === "7d"
        ? 7 * 864e5
        : range === "30d"
          ? 30 * 864e5
          : range === "90d"
            ? 90 * 864e5
            : null;

    const times = rows
      .map((r) => new Date(r.measured_at).getTime())
      .filter((t) => Number.isFinite(t));

    const maxT = times.length ? Math.max(...times) : null;
    const cutoff = ms && maxT ? maxT - ms : null;

    // Recharts prefere valores crescendo em X
    return [...rows]
      .filter((r) => {
        if (!cutoff) return true;
        const t = new Date(r.measured_at).getTime();
        return Number.isFinite(t) ? t >= cutoff : true;
      })
      .slice(0, 500)
      .reverse()
      .map((r) => ({
        measured_at: r.measured_at,
        t: new Date(r.measured_at).getTime(),
        value: r[metric],
      }))
      .filter((d) => d.value !== null && Number.isFinite(d.t));
  }, [rows, metric, range]);

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
            {range === "all" ? "Todas as medições" : `Últimos ${range.replace("d", " dias")}`}.
          </p>
        </div>
        <div className="flex flex-col gap-2 overflow-x-auto sm:items-end">
          <Segmented value={metric} onChange={onMetricChange} options={metricOptions} />
          <div className="flex justify-end">
            <Segmented value={range} onChange={setRange} options={RANGES} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-600 dark:text-zinc-400">
              Sem dados para este parâmetro.
            </div>
          ) : (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
