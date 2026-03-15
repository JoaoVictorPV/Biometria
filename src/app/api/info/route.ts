import { NextResponse } from "next/server";
import { cached } from "@/lib/info/cache";
import { PLACES } from "@/lib/info/geo";
import { getMoonPhase } from "@/lib/info/moon";

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
  forecast: ForecastDay[];
};

type WindBlock = {
  place: string;
  windDirNowDeg: number | null;
};

type WaveBlock = {
  place: string;
  waveHeightMaxM: number | null;
  wavePeriodMaxS: number | null;
  waveDirectionDominantDeg: number | null;
};

async function fetchJson(url: string) {
  const res = await fetch(url, {
    // cache do Next (server) + fallback do nosso cache
    next: { revalidate: 900 },
    headers: { "user-agent": "novobiometria/1.0" },
  });
  if (!res.ok) throw new Error(`Falha ao buscar dados (${res.status})`);
  return (await res.json()) as unknown;
}

async function getWeatherFor(placeKey: keyof typeof PLACES): Promise<WeatherBlock> {
  const p = PLACES[placeKey];

  function weatherCodeToDesc(code: number | null | undefined): string | null {
    if (code === null || code === undefined) return null;
    // https://open-meteo.com/en/docs#weathercode
    if (code === 0) return "Sol";
    if (code === 1) return "Sol entre nuvens";
    if (code === 2) return "Parcialmente nublado";
    if (code === 3) return "Nublado";
    if (code === 45 || code === 48) return "Neblina";
    if ([51, 53, 55, 56, 57].includes(code)) return "Garoa";
    if ([61, 63, 65, 66, 67].includes(code)) return "Chuva";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Neve";
    if ([80, 81, 82].includes(code)) return "Pancadas";
    if ([95, 96, 99].includes(code)) return "Tempestade";
    return "Tempo instável";
  }

  // Open-Meteo (sem API key)
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(p.lat));
  url.searchParams.set("longitude", String(p.lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,apparent_temperature,dew_point_2m,cloud_cover",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,cloud_cover_mean,dew_point_2m_max,apparent_temperature_max",
  );
  url.searchParams.set("timezone", "America/Sao_Paulo");
  url.searchParams.set("forecast_days", "4");

  const json = (await fetchJson(url.toString())) as {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      weather_code?: number;
      apparent_temperature?: number;
      dew_point_2m?: number;
      cloud_cover?: number;
    };
    daily?: {
      time?: string[];
      temperature_2m_max?: Array<number | null>;
      temperature_2m_min?: Array<number | null>;
      precipitation_sum?: Array<number | null>;
      precipitation_probability_max?: Array<number | null>;
      wind_speed_10m_max?: Array<number | null>;
      cloud_cover_mean?: Array<number | null>;
      dew_point_2m_max?: Array<number | null>;
      apparent_temperature_max?: Array<number | null>;
    };
  };

  const forecast: ForecastDay[] = (json?.daily?.time ?? []).map((d: string, i: number) => ({
    date: d,
    tMaxC: json?.daily?.temperature_2m_max?.[i] ?? null,
    tMinC: json?.daily?.temperature_2m_min?.[i] ?? null,
    precipitationMm: json?.daily?.precipitation_sum?.[i] ?? null,
    rainProbMaxPct: json?.daily?.precipitation_probability_max?.[i] ?? null,
    cloudCoverAvgPct: json?.daily?.cloud_cover_mean?.[i] ?? null,
    dewPointMaxC: json?.daily?.dew_point_2m_max?.[i] ?? null,
    apparentTempMaxC: json?.daily?.apparent_temperature_max?.[i] ?? null,
    windMaxKmh: json?.daily?.wind_speed_10m_max?.[i] ?? null,
  }));

  const rainProbTodayPct = forecast[0]?.rainProbMaxPct ?? null;
  const precipitationTodayMm = forecast[0]?.precipitationMm ?? null;
  const weatherDescNow = weatherCodeToDesc(json?.current?.weather_code);

  return {
    place: p.name,
    tempNowC: json?.current?.temperature_2m ?? null,
    humidityNowPct: json?.current?.relative_humidity_2m ?? null,
    weatherDescNow,
    rainProbTodayPct,
    precipitationTodayMm,
    cloudCoverNowPct: json?.current?.cloud_cover ?? null,
    dewPointNowC: json?.current?.dew_point_2m ?? null,
    apparentTempNowC: json?.current?.apparent_temperature ?? null,
    forecast,
  };
}

async function getWindNowFor(placeKey: keyof typeof PLACES): Promise<WindBlock> {
  const p = PLACES[placeKey];
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(p.lat));
  url.searchParams.set("longitude", String(p.lon));
  url.searchParams.set("current", "wind_direction_10m");
  url.searchParams.set("timezone", "America/Sao_Paulo");

  const json = (await fetchJson(url.toString())) as {
    current?: { wind_direction_10m?: number };
  };

  return {
    place: p.name,
    windDirNowDeg: json?.current?.wind_direction_10m ?? null,
  };
}

async function getWavesFor(placeKey: keyof typeof PLACES): Promise<WaveBlock> {
  const p = PLACES[placeKey];

  // Open-Meteo Marine (sem key). Nem todas as coordenadas têm o mesmo nível de detalhe.
  const url = new URL("https://marine-api.open-meteo.com/v1/marine");
  url.searchParams.set("latitude", String(p.lat));
  url.searchParams.set("longitude", String(p.lon));
  url.searchParams.set("daily", "wave_height_max,wave_period_max,wave_direction_dominant");
  url.searchParams.set("timezone", "America/Sao_Paulo");
  url.searchParams.set("forecast_days", "1");

  const json = (await fetchJson(url.toString())) as {
    daily?: {
      wave_height_max?: Array<number | null>;
      wave_period_max?: Array<number | null>;
      wave_direction_dominant?: Array<number | null>;
    };
  };
  return {
    place: p.name,
    waveHeightMaxM: json?.daily?.wave_height_max?.[0] ?? null,
    wavePeriodMaxS: json?.daily?.wave_period_max?.[0] ?? null,
    waveDirectionDominantDeg: json?.daily?.wave_direction_dominant?.[0] ?? null,
  };
}

export async function GET() {
  try {
    const payload = await cached("info:v1", 15 * 60 * 1000, async () => {
      const [curitiba, pontal] = await Promise.all([
        getWeatherFor("curitiba"),
        getWeatherFor("pontal"),
      ]);

      // Direção do vento atual para ajudar leitura humana.
      // (Ondas já têm direção em graus no endpoint marinho.)
      const [windCuritiba, windPontal] = await Promise.all([
        getWindNowFor("curitiba"),
        getWindNowFor("pontal"),
      ]);

      const waves = await Promise.all([
        getWavesFor("ilha_do_mel"),
        getWavesFor("brava_itajai"),
        getWavesFor("rosa"),
      ]);

      const moon = getMoonPhase(new Date());

      return {
        ok: true,
        updatedAt: new Date().toISOString(),
        weather: [
          { ...curitiba, windDirNowDeg: windCuritiba.windDirNowDeg },
          { ...pontal, windDirNowDeg: windPontal.windDirNowDeg },
        ],
        waves,
        moon,
      };
    });

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Falha ao montar painel de informações";
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
