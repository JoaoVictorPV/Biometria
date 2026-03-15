"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppActions } from "@/components/app-actions-context";

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButton() {
  const { exportSource } = useAppActions();
  const [busy, setBusy] = useState(false);

  const disabledReason = useMemo(() => {
    if (!exportSource) return "Abra o painel para carregar os dados";
    if (exportSource.rows.length === 0) return "Sem registros para exportar";
    return null;
  }, [exportSource]);

  async function onClick() {
    if (!exportSource) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/export?range=${encodeURIComponent(exportSource.range)}`, {
        method: "GET",
      });
      if (!res.ok) throw new Error(`Falha ao exportar (${res.status})`);

      const blob = await res.blob();
      const yyyyMMdd = new Date().toISOString().slice(0, 10);
      downloadBlob(`biometria_export_${yyyyMMdd}.html`, blob);
      toast.success("Exportação gerada. Arquivo HTML baixado.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao exportar";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      disabled={busy || Boolean(disabledReason)}
      title={disabledReason ?? "Exportar tabela + gráficos (offline)"}
    >
      <Download className="mr-2 h-4 w-4" />
      {busy ? "Exportando..." : "Exportar"}
    </Button>
  );
}
