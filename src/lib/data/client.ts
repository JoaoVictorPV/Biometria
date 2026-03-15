"use client";

import type { BiometricEntry } from "@/lib/db/types";
import type { BiometricEntryInput } from "@/lib/db/biometrics.schema";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createEntry, deleteEntry, listEntries, updateEntry } from "@/lib/db/biometrics.repo";

export type DataMode = "online" | "local";

export function getClientDataMode(): DataMode {
  const mode = process.env.NEXT_PUBLIC_DATA_MODE;
  // Se não foi definido, a gente assume ONLINE (porque é o caso real).
  // Para testar LOCAL, defina NEXT_PUBLIC_DATA_MODE=local.
  return mode === "local" ? "local" : "online";
}

export async function clientListEntries() {
  const mode = getClientDataMode();
  if (mode === "local") {
    const res = await fetch("/api/local/entries", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao ler base local");
    return (await res.json()) as { entries: BiometricEntry[] };
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await listEntries(supabase);
  if (error) throw error;
  return { entries: data ?? [] };
}

export async function clientCreateEntry(userId: string, input: BiometricEntryInput) {
  const mode = getClientDataMode();
  if (mode === "local") {
    const res = await fetch("/api/local/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Falha ao salvar local");
    return (await res.json()) as { entry: BiometricEntry };
  }

  const supabase = createSupabaseBrowserClient();
  const result = await createEntry(supabase, userId, input);
  if (result.error) throw result.error;
  return { entry: result.data };
}

export async function clientUpdateEntry(id: string, input: BiometricEntryInput) {
  const mode = getClientDataMode();
  if (mode === "local") {
    const res = await fetch(`/api/local/entries/${id}` as string, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Falha ao atualizar local");
    return (await res.json()) as { entry: BiometricEntry };
  }

  const supabase = createSupabaseBrowserClient();
  const result = await updateEntry(supabase, id, input);
  if (result.error) throw result.error;
  return { entry: result.data };
}

export async function clientDeleteEntry(id: string) {
  const mode = getClientDataMode();
  if (mode === "local") {
    const res = await fetch(`/api/local/entries/${id}` as string, { method: "DELETE" });
    if (!res.ok) throw new Error("Falha ao apagar local");
    return;
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await deleteEntry(supabase, id);
  if (error) throw error;
}

export async function clientSyncFromOnlineToLocal() {
  // Sempre chama o endpoint de sync (que puxa do Supabase e sobrescreve o local).
  const res = await fetch("/api/local/sync", { method: "POST" });
  const body = (await res.json()) as {
    ok?: boolean;
    count?: number;
    entries?: BiometricEntry[];
    error?: string;
  };
  if (!res.ok) throw new Error(body.error ?? "Falha ao sincronizar");
  return body;
}
