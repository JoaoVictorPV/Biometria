export type MoonPhase = {
  // 0..1 (0 = nova, 0.5 = cheia)
  value: number;
  name: string;
};

// Aproximação robusta e sem dependências externas.
// Baseado no conceito de "lunation" com referência conhecida.
export function getMoonPhase(date = new Date()): MoonPhase {
  // Referência: 2000-01-06 18:14 UTC (Lua Nova) — aproximação comum.
  const ref = Date.UTC(2000, 0, 6, 18, 14, 0);
  const synodicMonth = 29.530588853; // dias
  const days = (date.getTime() - ref) / 86400000;
  const lunations = days / synodicMonth;
  const phase = lunations - Math.floor(lunations);

  const name =
    phase < 0.03 || phase > 0.97
      ? "Lua nova"
      : phase < 0.22
        ? "Crescente"
        : phase < 0.28
          ? "Quarto crescente"
          : phase < 0.47
            ? "Gibosa crescente"
            : phase < 0.53
              ? "Lua cheia"
              : phase < 0.72
                ? "Gibosa minguante"
                : phase < 0.78
                  ? "Quarto minguante"
                  : "Minguante";

  return { value: phase, name };
}
