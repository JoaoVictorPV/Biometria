"use client";

import { useMemo } from "react";
import type { BiometricEntry } from "@/lib/db/types";
import { formatDayBR, formatTimeBR, formatNumber } from "@/lib/formatters";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FIELD_DEFS } from "@/components/biometrics/fields";

function dayKey(iso: string) {
  const d = new Date(iso);
  // Agrupar pelo DIA no fuso local do usuário (melhor pra uso humano)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function compactSummary(entry: BiometricEntry) {
  const parts: string[] = [];

  for (const f of FIELD_DEFS) {
    const v = entry[f.key];
    if (v === null) continue;

    if (f.key === "bp_systolic") {
      if (entry.bp_systolic && entry.bp_diastolic)
        parts.push(`PA ${entry.bp_systolic}/${entry.bp_diastolic}`);
      continue;
    }
    if (f.key === "bp_diastolic") continue;

    const unit = f.unit ? `${f.unit}` : "";
    const digits = f.step === "1" ? 0 : 1;
    parts.push(`${f.label} ${formatNumber(v as number, digits)}${unit ? ` ${unit}` : ""}`);
  }

  if (entry.notes?.trim()) parts.push("obs");
  return parts;
}

type Props = {
  rows: BiometricEntry[];
  onEdit: (row: BiometricEntry) => void;
  onDelete: (row: BiometricEntry) => void;
};

export function EntriesByDay({ rows, onEdit, onDelete }: Props) {
  const groups = useMemo(() => {
    const byDay = new Map<string, BiometricEntry[]>();
    const sorted = [...rows].sort((a, b) => {
      const ta = new Date(a.measured_at).getTime();
      const tb = new Date(b.measured_at).getTime();
      if (!Number.isFinite(ta) || !Number.isFinite(tb))
        return a.measured_at < b.measured_at ? 1 : -1;
      return tb - ta;
    });
    for (const r of sorted) {
      const key = dayKey(r.measured_at);
      const arr = byDay.get(key) ?? [];
      arr.push(r);
      byDay.set(key, arr);
    }
    return [...byDay.entries()].map(([k, v]) => ({ day: k, entries: v }));
  }, [rows]);

  const items = useMemo(() => {
    return groups.map((g, idx) => {
      const header = (
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{formatDayBR(g.day)}</div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {g.entries.length} mediç{g.entries.length === 1 ? "ão" : "ões"}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {Object.entries(
              g.entries.reduce<Record<string, number>>((acc, e) => {
                for (const f of FIELD_DEFS) {
                  if (f.key.startsWith("bp_")) continue;
                  if (e[f.key] !== null) acc[f.key] = 1;
                }
                if (e.bp_systolic && e.bp_diastolic) acc["bp"] = 1;
                if (e.glucose_mg_dl !== null) acc["glucose_mg_dl"] = 1;
                return acc;
              }, {}),
            )
              .slice(0, 6)
              .map(([k]) => (
                <span
                  key={k}
                  className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  {k === "bp" ? "PA" : (FIELD_DEFS.find((f) => f.key === k)?.label ?? "")}
                </span>
              ))}
          </div>
        </div>
      );

      const content = (
        <div className="space-y-2">
          {g.entries.map((e) => {
            const parts = compactSummary(e);
            return (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatTimeBR(e.measured_at)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {parts.length ? (
                      parts.map((p, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Sem valores (registro vazio)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(e)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => onDelete(e)}
                  >
                    Apagar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      );

      return { id: g.day, header, content, defaultOpen: idx === 0 };
    });
  }, [groups, onDelete, onEdit]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/80 p-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
        Nenhum registro ainda. Salve seu primeiro no card acima.
      </div>
    );
  }

  const defaultOpenId = items.find((i) => i.defaultOpen)?.id;
  return (
    <Accordion
      items={items.map(({ id, header, content }) => ({ id, header, content }))}
      defaultOpenId={defaultOpenId}
    />
  );
}
