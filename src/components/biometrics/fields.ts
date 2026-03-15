import type { HTMLAttributes } from "react";

export type FieldKey =
  | "weight_kg"
  | "body_fat_pct"
  | "body_water_pct"
  | "lean_mass_kg"
  | "bmi"
  | "waist_cm"
  | "arm_max_cm"
  | "thigh_max_cm"
  | "bp_systolic"
  | "bp_diastolic"
  | "glucose_mg_dl";

export type FieldDef = {
  key: FieldKey;
  label: string;
  unit?: string;
  step?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
};

export const FIELD_DEFS: FieldDef[] = [
  { key: "weight_kg", label: "Peso", unit: "kg", step: "0.1", inputMode: "decimal" },
  { key: "body_fat_pct", label: "% Gordura", unit: "%", step: "0.1", inputMode: "decimal" },
  { key: "body_water_pct", label: "% Água", unit: "%", step: "0.1", inputMode: "decimal" },
  { key: "lean_mass_kg", label: "Massa magra", unit: "kg", step: "0.1", inputMode: "decimal" },
  { key: "bmi", label: "IMC", step: "0.1", inputMode: "decimal" },
  { key: "waist_cm", label: "Cintura/abdômen", unit: "cm", step: "0.1", inputMode: "decimal" },
  { key: "arm_max_cm", label: "Braço (máx)", unit: "cm", step: "0.1", inputMode: "decimal" },
  { key: "thigh_max_cm", label: "Coxa (máx)", unit: "cm", step: "0.1", inputMode: "decimal" },
  { key: "bp_systolic", label: "Pressão sistólica", unit: "mmHg", step: "1", inputMode: "numeric" },
  {
    key: "bp_diastolic",
    label: "Pressão diastólica",
    unit: "mmHg",
    step: "1",
    inputMode: "numeric",
  },
  { key: "glucose_mg_dl", label: "Glicemia", unit: "mg/dL", step: "1", inputMode: "numeric" },
];
