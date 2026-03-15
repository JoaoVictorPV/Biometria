import crypto from "crypto";
import type { BiometricEntry } from "@/lib/db/types";
import type { BiometricEntryInput } from "@/lib/db/biometrics.schema";
import { localDbFilePath, readJsonFile, writeJsonFileAtomic } from "@/lib/localdb/storage";

type LocalDb = {
  version: 1;
  entries: BiometricEntry[];
};

const EMPTY: LocalDb = { version: 1, entries: [] };

async function readDb(): Promise<LocalDb> {
  return await readJsonFile(localDbFilePath(), EMPTY);
}

async function writeDb(db: LocalDb) {
  await writeJsonFileAtomic(localDbFilePath(), db);
}

export async function listLocalEntries() {
  const db = await readDb();
  return db.entries.sort((a, b) => {
    const ta = new Date(a.measured_at).getTime();
    const tb = new Date(b.measured_at).getTime();
    if (!Number.isFinite(ta) || !Number.isFinite(tb)) return a.measured_at < b.measured_at ? 1 : -1;
    return tb - ta;
  });
}

export async function createLocalEntry(input: BiometricEntryInput) {
  const db = await readDb();
  const now = new Date().toISOString();

  const entry: BiometricEntry = {
    id: crypto.randomUUID(),
    user_id: "local",
    created_at: now,
    measured_at: input.measured_at,
    weight_kg: input.weight_kg,
    body_fat_pct: input.body_fat_pct,
    body_water_pct: input.body_water_pct,
    lean_mass_kg: input.lean_mass_kg,
    bmi: input.bmi,
    waist_cm: input.waist_cm,
    arm_max_cm: input.arm_max_cm,
    thigh_max_cm: input.thigh_max_cm,
    bp_systolic: input.bp_systolic,
    bp_diastolic: input.bp_diastolic,
    glucose_mg_dl: input.glucose_mg_dl,
    notes: input.notes,
  };

  db.entries.unshift(entry);
  await writeDb(db);
  return entry;
}

export async function updateLocalEntry(id: string, input: BiometricEntryInput) {
  const db = await readDb();
  const idx = db.entries.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Registro não encontrado");

  const old = db.entries[idx];
  const updated: BiometricEntry = {
    ...old,
    measured_at: input.measured_at,
    weight_kg: input.weight_kg,
    body_fat_pct: input.body_fat_pct,
    body_water_pct: input.body_water_pct,
    lean_mass_kg: input.lean_mass_kg,
    bmi: input.bmi,
    waist_cm: input.waist_cm,
    arm_max_cm: input.arm_max_cm,
    thigh_max_cm: input.thigh_max_cm,
    bp_systolic: input.bp_systolic,
    bp_diastolic: input.bp_diastolic,
    glucose_mg_dl: input.glucose_mg_dl,
    notes: input.notes,
  };

  db.entries[idx] = updated;
  await writeDb(db);
  return updated;
}

export async function deleteLocalEntry(id: string) {
  const db = await readDb();
  db.entries = db.entries.filter((e) => e.id !== id);
  await writeDb(db);
}

export async function overwriteLocalEntries(nextEntries: BiometricEntry[]) {
  await writeDb({ version: 1, entries: nextEntries });
}
