import type { SupabaseClient } from "@supabase/supabase-js";
import type { BiometricEntry } from "@/lib/db/types";
import type { BiometricEntryInput } from "@/lib/db/biometrics.schema";

const TABLE = "biometric_entries";

export async function listEntries(supabase: SupabaseClient) {
  return await supabase
    .from(TABLE)
    .select("*")
    .order("measured_at", { ascending: false })
    .returns<BiometricEntry[]>();
}

export async function createEntry(
  supabase: SupabaseClient,
  userId: string,
  input: BiometricEntryInput,
) {
  return await supabase
    .from(TABLE)
    .insert({ ...input, user_id: userId })
    .select("*")
    .single<BiometricEntry>();
}

export async function updateEntry(
  supabase: SupabaseClient,
  id: string,
  input: BiometricEntryInput,
) {
  return await supabase.from(TABLE).update(input).eq("id", id).select("*").single<BiometricEntry>();
}

export async function deleteEntry(supabase: SupabaseClient, id: string) {
  return await supabase.from(TABLE).delete().eq("id", id);
}
