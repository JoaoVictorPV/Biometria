import { z } from "zod";

// Neste app a conversão de input -> number/null é feita no register() do react-hook-form.
// Assim mantemos tipagem forte e evitamos bugs (ex.: Number("") virar 0).
const num = () => z.number().finite().nullable();
const int = () => z.number().int().finite().nullable();

export const BiometricEntryInputSchema = z.object({
  measured_at: z.string().min(1),
  weight_kg: num(),
  body_fat_pct: num(),
  body_water_pct: num(),
  lean_mass_kg: num(),
  bmi: num(),
  waist_cm: num(),
  arm_max_cm: num(),
  thigh_max_cm: num(),
  bp_systolic: int(),
  bp_diastolic: int(),
  glucose_mg_dl: int(),
  notes: z.string().max(2000).nullable(),
});

export type BiometricEntryInput = z.infer<typeof BiometricEntryInputSchema>;
