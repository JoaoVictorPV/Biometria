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

  function captureChartSvgFromDom(): string | null {
    try {
      // No mobile, o timing do useEffect pode não ter gravado o SVG a tempo.
      // Aqui a gente captura no clique, direto do DOM, garantindo cópia fiel.
      const svg = document.querySelector(".recharts-wrapper svg") as SVGSVGElement | null;
      return svg?.outerHTML ?? null;
    } catch {
      return null;
    }
  }

  async function captureChartPngDataUrlFromDom(): Promise<string | null> {
    try {
      const svg = document.querySelector(".recharts-wrapper svg") as SVGSVGElement | null;
      if (!svg) return null;

      const xml = new XMLSerializer().serializeToString(svg);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const svgDataUrl = `data:image/svg+xml;base64,${svg64}`;

      const rect = svg.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      // Renderiza a “foto” do SVG em um canvas e retorna PNG.
      // Isso é o mais robusto no iOS (preview/QuickLook às vezes ignora scripts/SVG).
      const canvas = document.createElement("canvas");
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const img = new Image();
      img.decoding = "async";
      img.src = svgDataUrl;
      await img.decode();

      // Fundo transparente; se quiser fundo sólido, pintar aqui.
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }

  const disabledReason = useMemo(() => {
    if (!exportSource) return "Abra o painel para carregar os dados";
    if (exportSource.rows.length === 0) return "Sem registros para exportar";
    return null;
  }, [exportSource]);

  async function onClick() {
    if (!exportSource) return;
    setBusy(true);
    try {
      const chartSvg = captureChartSvgFromDom() ?? exportSource.chartSvg ?? null;
      const chartPngDataUrl = await captureChartPngDataUrlFromDom();

      // Preferimos POST para enviar o SVG real do gráfico atual (cópia fiel).
      // Mantém GET como fallback automático no server (se SVG não vier).
      const res = await fetch(`/api/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          range: exportSource.range,
          metric: exportSource.metric,
          chartSvg,
          chartPngDataUrl,
        }),
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
