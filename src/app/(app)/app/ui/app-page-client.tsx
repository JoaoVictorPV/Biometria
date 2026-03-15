"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { BiometricEntry } from "@/lib/db/types";
import { clientDeleteEntry } from "@/lib/data/client";
import { EntryForm } from "@/components/biometrics/entry-form";
import { EntriesByDay } from "@/components/biometrics/entries-by-day";
import { EntriesChart } from "@/components/biometrics/entries-chart";
import type { FieldKey } from "@/components/biometrics/fields";
import { SyncButton } from "@/components/biometrics/sync-button";

type Props = {
  userId: string;
  initialRows: BiometricEntry[];
};

export function AppPageClient({ userId, initialRows }: Props) {
  const [rows, setRows] = useState<BiometricEntry[]>(initialRows);
  const [editing, setEditing] = useState<BiometricEntry | null>(null);
  const [metric, setMetric] = useState<FieldKey>("weight_kg");

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ta = new Date(a.measured_at).getTime();
      const tb = new Date(b.measured_at).getTime();
      if (!Number.isFinite(ta) || !Number.isFinite(tb))
        return a.measured_at < b.measured_at ? 1 : -1;
      return tb - ta;
    });
  }, [rows]);

  async function onDelete(row: BiometricEntry) {
    // Evitar popups nativos (alert/confirm) conforme requisito.
    // Por simplicidade/robustez: pedimos dupla ação (clicar novamente no toast).
    const key = `delete-${row.id}`;
    toast.message("Toque novamente para confirmar a exclusão", {
      id: key,
      action: {
        label: "Apagar",
        onClick: async () => {
          try {
            await clientDeleteEntry(row.id);
            setRows((prev) => prev.filter((r) => r.id !== row.id));
            toast.success("Registro apagado");
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Erro ao apagar";
            toast.error(msg);
          }
        },
      },
    });

    return;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <SyncButton onSynced={(nextRows) => setRows(nextRows)} />
      </div>

      <EntryForm
        userId={userId}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        onSaved={(saved) => {
          setRows((prev) => {
            const exists = prev.some((r) => r.id === saved.id);
            return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
          });
          setEditing(null);
        }}
      />

      <EntriesChart rows={sortedRows} metric={metric} onMetricChange={setMetric} />
      <EntriesByDay rows={sortedRows} onEdit={setEditing} onDelete={onDelete} />
    </div>
  );
}
