import type { SupabaseClient } from "@supabase/supabase-js";
import type { BiometricEntry } from "@/lib/db/types";
import type { BiometricEntryInput } from "@/lib/db/biometrics.schema";

const TABLE = "biometric_entries";

const NUM_KEYS = [
  "weight_kg",
  "body_fat_pct",
  "body_water_pct",
  "lean_mass_kg",
  "bmi",
  "waist_cm",
  "arm_max_cm",
  "thigh_max_cm",
] as const;

const INT_KEYS = ["bp_systolic", "bp_diastolic", "glucose_mg_dl"] as const;

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toInt(v: unknown): number | null {
  const n = toNum(v);
  return n === null ? null : Math.trunc(n);
}

function normalizeEntry(row: BiometricEntry): BiometricEntry {
  // PostgREST costuma retornar `numeric` como string.
  // Se não normalizar, gráficos (Recharts/Chart.js) podem falhar silenciosamente.
  const next: BiometricEntry = { ...row };

  for (const k of NUM_KEYS) {
    (next as Record<(typeof NUM_KEYS)[number], number | null>)[k] = toNum(
      row[k] as unknown,
    );
  }
  for (const k of INT_KEYS) {
    (next as Record<(typeof INT_KEYS)[number], number | null>)[k] = toInt(
      row[k] as unknown,
    );
  }

  return next;
}

export async function listEntries(supabase: SupabaseClient) {
  const res = await supabase
    .from(TABLE)
    .select("*")
    .order("measured_at", { ascending: false })
    .returns<BiometricEntry[]>();

  if (res.data) res.data = res.data.map(normalizeEntry);
  return res;
}

export async function createEntry(
  supabase: SupabaseClient,
  userId: string,
  input: BiometricEntryInput,
) {
  const res = await supabase
    .from(TABLE)
    .insert({ ...input, user_id: userId })
    .select("*")
    .single<BiometricEntry>();

  if (res.data) res.data = normalizeEntry(res.data);
  return res;
}

export async function updateEntry(
  supabase: SupabaseClient,
  id: string,
  input: BiometricEntryInput,
) {
  const res = await supabase
    .from(TABLE)
    .update(input)
    .eq("id", id)
    .select("*")
    .single<BiometricEntry>();

  if (res.data) res.data = normalizeEntry(res.data);
  return res;
}

export async function deleteEntry(supabase: SupabaseClient, id: string) {
  return await supabase.from(TABLE).delete().eq("id", id);
}
