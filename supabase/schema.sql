-- Rode este arquivo no Supabase SQL Editor.
-- Ele cria a tabela de registros biométricos e habilita RLS.

create extension if not exists "pgcrypto";

create table if not exists public.biometric_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  measured_at timestamptz not null default now(),

  weight_kg numeric(6,2),
  body_fat_pct numeric(5,2),
  body_water_pct numeric(5,2),
  lean_mass_kg numeric(6,2),
  bmi numeric(5,2),

  waist_cm numeric(6,2),
  arm_max_cm numeric(6,2),
  thigh_max_cm numeric(6,2),

  bp_systolic integer,
  bp_diastolic integer,
  glucose_mg_dl integer,

  notes text
);

create index if not exists biometric_entries_user_measured_at_idx
  on public.biometric_entries (user_id, measured_at desc);

alter table public.biometric_entries enable row level security;

drop policy if exists "biometric_entries_select_own" on public.biometric_entries;
create policy "biometric_entries_select_own"
  on public.biometric_entries
  for select
  using (auth.uid() = user_id);

drop policy if exists "biometric_entries_insert_own" on public.biometric_entries;
create policy "biometric_entries_insert_own"
  on public.biometric_entries
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "biometric_entries_update_own" on public.biometric_entries;
create policy "biometric_entries_update_own"
  on public.biometric_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "biometric_entries_delete_own" on public.biometric_entries;
create policy "biometric_entries_delete_own"
  on public.biometric_entries
  for delete
  using (auth.uid() = user_id);
