"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BiometricEntryInputSchema, type BiometricEntryInput } from "@/lib/db/biometrics.schema";
import type { BiometricEntry } from "@/lib/db/types";
import { clientCreateEntry, clientUpdateEntry } from "@/lib/data/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIELD_DEFS } from "./fields";

function toNumberOrNull(value: unknown) {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(value: unknown) {
  const n = toNumberOrNull(value);
  return n === null ? null : Math.trunc(n);
}

function nowISO() {
  return new Date().toISOString();
}

type Props = {
  userId: string;
  editing?: BiometricEntry | null;
  onSaved?: (saved: BiometricEntry) => void;
  onCancelEdit?: () => void;
};

export function EntryForm({ userId, editing, onSaved, onCancelEdit }: Props) {
  const [saving, setSaving] = useState(false);

  const defaults: BiometricEntryInput = useMemo(() => {
    if (!editing) {
      return {
        measured_at: nowISO(),
        weight_kg: null,
        body_fat_pct: null,
        body_water_pct: null,
        lean_mass_kg: null,
        bmi: null,
        waist_cm: null,
        arm_max_cm: null,
        thigh_max_cm: null,
        bp_systolic: null,
        bp_diastolic: null,
        glucose_mg_dl: null,
        notes: null,
      };
    }

    return {
      measured_at: editing.measured_at,
      weight_kg: editing.weight_kg,
      body_fat_pct: editing.body_fat_pct,
      body_water_pct: editing.body_water_pct,
      lean_mass_kg: editing.lean_mass_kg,
      bmi: editing.bmi,
      waist_cm: editing.waist_cm,
      arm_max_cm: editing.arm_max_cm,
      thigh_max_cm: editing.thigh_max_cm,
      bp_systolic: editing.bp_systolic,
      bp_diastolic: editing.bp_diastolic,
      glucose_mg_dl: editing.glucose_mg_dl,
      notes: editing.notes ?? null,
    };
  }, [editing]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BiometricEntryInput>({
    resolver: zodResolver(BiometricEntryInputSchema),
    defaultValues: defaults,
    values: defaults,
  });

  async function onSubmit(input: BiometricEntryInput) {
    setSaving(true);
    try {
      const result = editing
        ? await clientUpdateEntry(editing.id, input)
        : await clientCreateEntry(userId, input);

      toast.success(editing ? "Registro atualizado" : "Registro salvo");
      onSaved?.(result.entry);
      if (!editing) reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>{editing ? "Editar registro" : "Novo registro"}</CardTitle>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Preencha só o que quiser — campos são opcionais.
          </p>
        </div>
        {editing ? (
          <Button variant="secondary" onClick={onCancelEdit}>
            Cancelar
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELD_DEFS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>
                  {f.label}
                  {f.unit ? <span className="ml-1 text-zinc-500">({f.unit})</span> : null}
                </Label>
                <Input
                  id={f.key}
                  inputMode={f.inputMode}
                  type="number"
                  step={f.step}
                  {...register(f.key, {
                    setValueAs:
                      f.key.startsWith("bp_") || f.key === "glucose_mg_dl"
                        ? toIntOrNull
                        : toNumberOrNull,
                  })}
                />
                {errors[f.key] ? (
                  <p className="text-xs text-red-600">{errors[f.key]?.message as string}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <textarea
              id="notes"
              className="min-h-24 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-700"
              placeholder="Ex.: jejum, pós-treino, etc."
              {...register("notes", {
                setValueAs: (v) => {
                  if (v === "" || v === undefined || v === null) return null;
                  const s = String(v).trim();
                  return s ? s : null;
                },
              })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Salvar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
