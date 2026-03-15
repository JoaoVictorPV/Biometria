-- Migração para quem já criou a tabela antiga com measured_at como DATE.
-- Rode no Supabase SQL Editor.

alter table public.biometric_entries
  alter column measured_at type timestamptz
  using measured_at::timestamptz;

alter table public.biometric_entries
  alter column measured_at set default now();

drop index if exists public.biometric_entries_user_measured_at_idx;
create index biometric_entries_user_measured_at_idx
  on public.biometric_entries (user_id, measured_at desc);
