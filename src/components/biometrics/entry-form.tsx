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

function nowLocalInputValue() {
  return isoToLocalInputValue(nowISO());
}

function isoToLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  // datetime-local exige formato local sem timezone.
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function localInputValueToISO(v: unknown) {
  if (v === "" || v === undefined || v === null) return nowISO();
  const s = String(v);
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toISOString() : nowISO();
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
        measured_at: nowLocalInputValue(),
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
      measured_at: isoToLocalInputValue(editing.measured_at),
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
      const inputFixed: BiometricEntryInput = {
        ...input,
        measured_at: localInputValueToISO(input.measured_at),
      };
      const result = editing
        ? await clientUpdateEntry(editing.id, inputFixed)
        : await clientCreateEntry(userId, inputFixed);

      toast.success(editing ? "Registro atualizado" : "Registro salvo");
      onSaved?.(result.entry);
      if (!editing) reset({ ...defaults, measured_at: nowLocalInputValue() });
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
            <div className="space-y-2">
              <Label htmlFor="measured_at">Data e hora</Label>
              <Input
                id="measured_at"
                type="datetime-local"
                {...register("measured_at")}
              />
              {errors.measured_at ? (
                <p className="text-xs text-red-600">{errors.measured_at?.message as string}</p>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  (Opcional) Você pode registrar medições antigas.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELD_DEFS.filter((f) => f.key !== "glucose_mg_dl").map((f) => (
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

            {/* Glicemia (esquerda) + Observações (direita) */}
            <div className="space-y-2">
              <Label htmlFor="glucose_mg_dl">Glicemia</Label>
              <Input
                id="glucose_mg_dl"
                inputMode="numeric"
                type="number"
                step={"1"}
                {...register("glucose_mg_dl", {
                  setValueAs: toIntOrNull,
                })}
              />
              {errors.glucose_mg_dl ? (
                <p className="text-xs text-red-600">{errors.glucose_mg_dl?.message as string}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                placeholder="Opcional"
                {...register("notes", {
                  setValueAs: (v) => {
                    if (v === "" || v === undefined || v === null) return null;
                    const s = String(v).trim();
                    return s ? s : null;
                  },
                })}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Salvar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
