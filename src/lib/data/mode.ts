import { hasSupabaseEnv } from "@/lib/env";

export type DataMode = "online" | "local";

export function getDataMode(): DataMode {
  // Preferência explícita do usuário
  const mode = process.env.NEXT_PUBLIC_DATA_MODE;
  if (mode === "local") return "local";
  if (mode === "online") return "online";

  // Fallback robusto: se Supabase não estiver configurado, fica em LOCAL.
  return hasSupabaseEnv() ? "online" : "local";
}

export function isLocalMode() {
  return getDataMode() === "local";
}
