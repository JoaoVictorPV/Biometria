export type BiometricEntry = {
  id: string;
  user_id: string;
  created_at: string;
  measured_at: string; // ISO string (timestamptz)

  weight_kg: number | null;
  body_fat_pct: number | null;
  body_water_pct: number | null;
  lean_mass_kg: number | null;
  bmi: number | null;

  waist_cm: number | null;
  arm_max_cm: number | null;
  thigh_max_cm: number | null;

  bp_systolic: number | null;
  bp_diastolic: number | null;
  glucose_mg_dl: number | null;

  notes: string | null;
};
