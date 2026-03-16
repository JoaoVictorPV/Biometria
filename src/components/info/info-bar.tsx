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
  open,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  tone: Tone;
  className?: string;
  open?: boolean;
  onToggle?: () => void;
}) {
  const Comp = onToggle ? ("button" as const) : ("div" as const);
  return (
    <Comp
      type={onToggle ? "button" : undefined}
      onClick={onToggle}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-2xl border border-zinc-200/70 bg-white/70 px-3 py-2 text-left text-xs shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/60",
        onToggle ? "hover:bg-white/85 dark:hover:bg-zinc-950/75" : null,
        className,
      )}
      title={title}
    >
      <div className={cn("rounded-xl p-1", toneCls(tone))}>{icon}</div>
      <div className="min-w-0">
        <div className="truncate font-medium text-zinc-800 dark:text-zinc-100">{title}</div>
        <div
          className={cn(
            "text-zinc-600 dark:text-zinc-400",
            open ? "whitespace-normal break-words" : "truncate",
          )}
        >
          {value}
        </div>
      </div>
    </Comp>
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

function compactWeather(w: WeatherBlock) {
  // Resumo útil (retraído): tempo + temperatura + sensação + chuva%.
  const desc = w.weatherDescNow ?? "Tempo";
  const t = fmtC(w.tempNowC);
  const sens = fmtC(w.apparentTempNowC);
  const rain = w.rainProbTodayPct === null ? null : `${Math.round(w.rainProbTodayPct)}% chuva`;
  return `${desc} • ${t} • Sens ${sens}${rain ? ` • ${rain}` : ""}`;
}

function fullWeather(w: WeatherBlock) {
  const rainProb = fmtRainProb(w.rainProbTodayPct);
  const wind =
    w.windDirNowDeg === null || w.windDirNowDeg === undefined
      ? null
      : `Vento ${degToCardinal(w.windDirNowDeg)}`;
  return `${w.weatherDescNow ?? "Tempo"} • T ${fmtC(w.tempNowC)} • Sens ${fmtC(w.apparentTempNowC)} • Orv ${fmtC(w.dewPointNowC)} • UR ${fmtPct(w.humidityNowPct)} • Prec ${fmtMm(w.precipitationTodayMm)}${rainProb ? ` • ${rainProb}` : ""}${w.cloudCoverNowPct === null ? "" : ` • Nuv ${fmtPct(w.cloudCoverNowPct)}`}${wind ? ` • ${wind}` : ""}`;
}

export function InfoBar() {
  const [data, setData] = useState<Payload | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [openChipId, setOpenChipId] = useState<string | null>(null);

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

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2">
        {/* Retráido: apenas hoje de Curitiba + Pontal, lado a lado e compacto */}
        <div className="grid w-full grid-cols-2 gap-2">
          {data && !data.ok ? (
            <Chip
              icon={<Moon className="h-4 w-4" />}
              title="Info"
              value="Indisponível"
              tone="violet"
              open={openChipId === "info"}
              onToggle={() => setOpenChipId((v) => (v === "info" ? null : "info"))}
            />
          ) : null}

          {blocks?.curitiba ? (
            <Chip
              icon={<Thermometer className="h-4 w-4" />}
              title="Curitiba"
              value={openChipId === "curitiba" ? fullWeather(blocks.curitiba) : compactWeather(blocks.curitiba)}
              tone="sky"
              className="w-full"
              open={openChipId === "curitiba"}
              onToggle={() => setOpenChipId((v) => (v === "curitiba" ? null : "curitiba"))}
            />
          ) : null}

          {blocks?.pontal ? (
            <Chip
              icon={<Thermometer className="h-4 w-4" />}
              title="Pontal"
              value={openChipId === "pontal" ? fullWeather(blocks.pontal) : compactWeather(blocks.pontal)}
              tone="emerald"
              className="w-full"
              open={openChipId === "pontal"}
              onToggle={() => setOpenChipId((v) => (v === "pontal" ? null : "pontal"))}
            />
          ) : null}
        </div>

        {data && data.ok ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
              "w-full rounded-2xl border px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur",
              "border-zinc-200/70 bg-white/50 text-zinc-800 hover:bg-white/70",
              "dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-950/60",
            )}
          >
            {expanded ? "Menos" : "Mais detalhes"}
          </button>
        ) : null}

        {/* Expandido: organizado por função, simétrico e horizontal */}
        {data && data.ok && expanded ? (
          <div className="space-y-2">
            <div className="grid w-full grid-cols-2 gap-2">
              {blocks?.forecast?.[0] ? (
                <Chip
                  icon={<Droplets className="h-4 w-4" />}
                  title="Previsão (Curitiba)"
                  value={`${formatDayBR(blocks.forecast[0].date)} • ${fmtC(blocks.forecast[0].tMinC)}–${fmtC(blocks.forecast[0].tMaxC)} • ${blocks.forecast[0].rainProbMaxPct === null ? "" : `Chuva ${formatNumber(blocks.forecast[0].rainProbMaxPct, 0)}%`}`.trim()}
                  tone="sky"
                  className="w-full"
                  open={openChipId === "forecast"}
                  onToggle={() => setOpenChipId((v) => (v === "forecast" ? null : "forecast"))}
                />
              ) : null}

              {data.moon ? (
                <Chip
                  icon={<Moon className="h-4 w-4" />}
                  title="Lua"
                  value={data.moon.name}
                  tone="violet"
                  className="w-full"
                  open={openChipId === "lua"}
                  onToggle={() => setOpenChipId((v) => (v === "lua" ? null : "lua"))}
                />
              ) : null}
            </div>

            {blocks?.waves?.length ? (
              <div className="grid w-full grid-cols-2 gap-2">
                {blocks.waves.slice(0, 2).map((w) => (
                  <Chip
                    key={w.place}
                    icon={<Waves className="h-4 w-4" />}
                    title={w.place}
                    value={fmtWaves(w)}
                    tone="amber"
                    className="w-full"
                    open={openChipId === `wave-${w.place}`}
                    onToggle={() =>
                      setOpenChipId((v) => (v === `wave-${w.place}` ? null : `wave-${w.place}`))
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
