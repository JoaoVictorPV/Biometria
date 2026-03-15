"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets, Moon, Thermometer, Waves } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDayBR, formatNumber } from "@/lib/formatters";

type ForecastDay = {
  date: string;
  tMaxC: number | null;
  tMinC: number | null;
  precipitationMm: number | null;
  rainProbMaxPct: number | null;
  cloudCoverAvgPct: number | null;
  dewPointMaxC: number | null;
  apparentTempMaxC: number | null;
  windMaxKmh: number | null;
};

type WeatherBlock = {
  place: string;
  tempNowC: number | null;
  humidityNowPct: number | null;
  weatherDescNow: string | null;
  rainProbTodayPct: number | null;
  precipitationTodayMm: number | null;
  cloudCoverNowPct: number | null;
  dewPointNowC: number | null;
  apparentTempNowC: number | null;
  windDirNowDeg?: number | null;
  forecast: ForecastDay[];
};

type WaveBlock = {
  place: string;
  waveHeightMaxM: number | null;
  wavePeriodMaxS: number | null;
  waveDirectionDominantDeg: number | null;
};

type PayloadOk = {
  ok: true;
  updatedAt: string;
  weather: WeatherBlock[];
  waves: WaveBlock[];
  moon: { name: string; value: number };
};

type Payload = PayloadOk | { ok: false; error: string };

type Tone = "sky" | "emerald" | "violet" | "amber";

function toneCls(tone: Tone) {
  switch (tone) {
    case "sky":
      return "bg-sky-500/10 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200";
    case "emerald":
      return "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "violet":
      return "bg-violet-500/10 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200";
    case "amber":
      return "bg-amber-500/10 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200";
  }
}

function Chip({
  icon,
  title,
  value,
  tone,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white/70 px-3 py-2 text-xs shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/60",
        className,
      )}
      title={title}
    >
      <div className={cn("rounded-xl p-1", toneCls(tone))}>{icon}</div>
      <div className="min-w-0">
        <div className="truncate font-medium text-zinc-800 dark:text-zinc-100">{title}</div>
        <div className="truncate text-zinc-600 dark:text-zinc-400">{value}</div>
      </div>
    </div>
  );
}

function fmtC(n: number | null) {
  if (n === null) return "—";
  return `${formatNumber(n, 0)}°C`;
}

function fmtPct(n: number | null) {
  if (n === null) return "—";
  return `${formatNumber(n, 0)}%`;
}

function fmtMm(n: number | null) {
  if (n === null) return "—";
  return `${formatNumber(n, 1)}mm`;
}

function fmtRainProb(n: number | null) {
  if (n === null) return null;
  const v = Math.round(n);
  return `chuva ${v}%`;
}

function degToCardinal(deg: number | null | undefined) {
  if (deg === null || deg === undefined) return "—";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return dirs[idx];
}

function fmtWaves(w: WaveBlock) {
  const h = w.waveHeightMaxM === null ? "—" : `${formatNumber(w.waveHeightMaxM, 1)}m`;
  const p = w.wavePeriodMaxS === null ? "—" : `${formatNumber(w.wavePeriodMaxS, 0)}s`;
  const d =
    w.waveDirectionDominantDeg === null ? "—" : `${formatNumber(w.waveDirectionDominantDeg, 0)}°`;
  const c = degToCardinal(w.waveDirectionDominantDeg);
  return `${h} • ${p} • ${d} (${c})`;
}

export function InfoBar() {
  const [data, setData] = useState<Payload | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    const ac = new AbortController();

    async function load() {
      try {
        const res = await fetch("/api/info", { cache: "no-store", signal: ac.signal });
        const json = (await res.json()) as Payload;
        if (!alive) return;
        setData(json);
      } catch {
        if (!alive) return;
        setData({ ok: false, error: "Sem conexão com serviço de informações" });
      }
    }

    void load();
    const id = window.setInterval(load, 15 * 60 * 1000);
    return () => {
      alive = false;
      ac.abort();
      window.clearInterval(id);
    };
  }, []);

  const blocks = useMemo(() => {
    if (!data || !data.ok) return null;
    return {
      curitiba: data.weather.find((w) => w.place.includes("Curitiba")),
      pontal: data.weather.find((w) => w.place.includes("Pontal")),
      today: data.weather[0]?.forecast?.[0] ?? null,
      waves: data.waves,
      forecast: data.weather[0]?.forecast ?? [],
      moon: data.moon,
    };
  }, [data]);

  return (
    <div className="sticky top-[53px] z-10 -mx-4 border-b border-zinc-200/60 bg-white/60 px-4 py-2 backdrop-blur dark:border-zinc-800/60 dark:bg-black/25">
      {/* fundo abstrato sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_80%_at_50%_0%,black,transparent)]">
        <div className="h-full w-full bg-[radial-gradient(circle_at_15%_0%,rgba(14,165,233,0.16),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(168,85,247,0.12),transparent_45%),radial-gradient(circle_at_65%_80%,rgba(16,185,129,0.10),transparent_55%)] dark:bg-[radial-gradient(circle_at_15%_0%,rgba(14,165,233,0.14),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(168,85,247,0.10),transparent_45%),radial-gradient(circle_at_65%_80%,rgba(16,185,129,0.08),transparent_55%)]" />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
        {/* Linha compacta (prioridade mobile) */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
          {data && !data.ok ? (
            <Chip
              icon={<Moon className="h-4 w-4" />}
              title="Info"
              value="Indisponível"
              tone="violet"
            />
          ) : null}

          {blocks?.curitiba ? (
            <Chip
              icon={<Thermometer className="h-4 w-4" />}
              title="Curitiba"
              value={`${blocks.curitiba.weatherDescNow ?? "Tempo"} • T ${fmtC(blocks.curitiba.tempNowC)} • Sens ${fmtC(blocks.curitiba.apparentTempNowC)} • Orv ${fmtC(blocks.curitiba.dewPointNowC)} • UR ${fmtPct(blocks.curitiba.humidityNowPct)} • Prec ${fmtMm(blocks.curitiba.precipitationTodayMm)}${fmtRainProb(blocks.curitiba.rainProbTodayPct) ? ` • ${fmtRainProb(blocks.curitiba.rainProbTodayPct)}` : ""}${blocks.curitiba.cloudCoverNowPct === null ? "" : ` • Nuv ${fmtPct(blocks.curitiba.cloudCoverNowPct)}`}${blocks.curitiba.windDirNowDeg === null || blocks.curitiba.windDirNowDeg === undefined ? "" : ` • Vento ${degToCardinal(blocks.curitiba.windDirNowDeg)}`}`}
              tone="sky"
            />
          ) : null}

          {blocks?.pontal ? (
            <Chip
              icon={<Thermometer className="h-4 w-4" />}
              title="Pontal"
              value={`${blocks.pontal.weatherDescNow ?? "Tempo"} • T ${fmtC(blocks.pontal.tempNowC)} • Sens ${fmtC(blocks.pontal.apparentTempNowC)} • Orv ${fmtC(blocks.pontal.dewPointNowC)} • UR ${fmtPct(blocks.pontal.humidityNowPct)} • Prec ${fmtMm(blocks.pontal.precipitationTodayMm)}${fmtRainProb(blocks.pontal.rainProbTodayPct) ? ` • ${fmtRainProb(blocks.pontal.rainProbTodayPct)}` : ""}${blocks.pontal.cloudCoverNowPct === null ? "" : ` • Nuv ${fmtPct(blocks.pontal.cloudCoverNowPct)}`}${blocks.pontal.windDirNowDeg === null || blocks.pontal.windDirNowDeg === undefined ? "" : ` • Vento ${degToCardinal(blocks.pontal.windDirNowDeg)}`}`}
              tone="emerald"
            />
          ) : null}

          {data && data.ok ? (
            <Chip
              icon={<Moon className="h-4 w-4" />}
              title="Lua"
              value={data.moon.name}
              tone="violet"
            />
          ) : null}

          {blocks?.today ? (
            <Chip
              icon={<Droplets className="h-4 w-4" />}
              title="Hoje"
              value={`Curitiba • ${fmtC(blocks.today.tMinC)}–${fmtC(blocks.today.tMaxC)} • Sens ${fmtC(blocks.today.apparentTempMaxC)} • Orv ${fmtC(blocks.today.dewPointMaxC)} • Prec ${fmtMm(blocks.today.precipitationMm)}${fmtRainProb(blocks.today.rainProbMaxPct) ? ` • ${fmtRainProb(blocks.today.rainProbMaxPct)}` : ""}${blocks.today.cloudCoverAvgPct === null ? "" : ` • Nuv ${fmtPct(blocks.today.cloudCoverAvgPct)}`}`}
              tone="sky"
              className="min-w-[180px]"
            />
          ) : null}

          {data && data.ok ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="col-span-2 shrink-0 rounded-2xl border border-zinc-200/70 bg-white/40 px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur hover:bg-white/60 sm:col-span-1 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-950/60"
            >
              {expanded ? "Menos" : "Mais"}
            </button>
          ) : null}
        </div>

        {/* Detalhes (opcional). No mobile fica escondido por padrão. */}
        {data && data.ok && expanded ? (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-center">
              {blocks?.waves.map((w) => (
                <Chip
                  key={w.place}
                  icon={<Waves className="h-4 w-4" />}
                  title={w.place}
                  value={fmtWaves(w)}
                  tone="amber"
                  className="w-full sm:min-w-[220px]"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-center">
              {blocks?.forecast.map((d, idx) => (
                <Chip
                  key={d.date}
                  icon={<Droplets className="h-4 w-4" />}
                  title={idx === 0 ? "Amanhã • Curitiba" : `${formatDayBR(d.date)} • Curitiba`}
                  value={`${fmtC(d.tMinC)}–${fmtC(d.tMaxC)} • Sens ${fmtC(d.apparentTempMaxC)} • Orv ${fmtC(d.dewPointMaxC)} • Prec ${fmtMm(d.precipitationMm)}${fmtRainProb(d.rainProbMaxPct) ? ` • ${fmtRainProb(d.rainProbMaxPct)}` : ""}${d.cloudCoverAvgPct === null ? "" : ` • Nuv ${fmtPct(d.cloudCoverAvgPct)}`}${d.windMaxKmh === null ? "" : ` • Vento ${formatNumber(d.windMaxKmh, 0)}km/h`}`}
                  tone="sky"
                  className="w-full sm:min-w-[240px]"
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
