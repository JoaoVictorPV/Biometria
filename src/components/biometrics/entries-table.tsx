"use client";

import { useMemo } from "react";
import type { BiometricEntry } from "@/lib/db/types";
import { formatDayBR, formatNumber, formatTimeBR } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  rows: BiometricEntry[];
  onEdit: (row: BiometricEntry) => void;
  onDelete: (row: BiometricEntry) => void;
};

export function EntriesTable({ rows, onEdit, onDelete }: Props) {
  const visible = useMemo(() => rows.slice(0, 30), [rows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Registros</CardTitle>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Mostrando os 30 mais recentes.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                {[
                  "Data",
                  "Peso",
                  "% Gord",
                  "% Água",
                  "Massa magra",
                  "IMC",
                  "Cintura",
                  "Braço",
                  "Coxa",
                  "PA",
                  "Glicemia",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="border-b border-zinc-200 px-2 py-2 font-medium dark:border-zinc-800"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="text-sm">
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    <div className="flex flex-col">
                      <span>{formatDayBR(r.measured_at)}</span>
                      <span className="text-xs text-zinc-500">{formatTimeBR(r.measured_at)}</span>
                    </div>
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {formatNumber(r.weight_kg, 1)}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {formatNumber(r.body_fat_pct, 1)}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {formatNumber(r.body_water_pct, 1)}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {formatNumber(r.lean_mass_kg, 1)}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {formatNumber(r.bmi, 1)}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {formatNumber(r.waist_cm, 1)}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {formatNumber(r.arm_max_cm, 1)}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {formatNumber(r.thigh_max_cm, 1)}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {r.bp_systolic && r.bp_diastolic ? `${r.bp_systolic}/${r.bp_diastolic}` : "—"}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-900">
                    {r.glucose_mg_dl ?? "—"}
                  </td>
                  <td className="border-b border-zinc-100 px-2 py-2 text-right dark:border-zinc-900">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(r)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => onDelete(r)}
                      >
                        Apagar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum registro ainda. Salve seu primeiro no card acima.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
