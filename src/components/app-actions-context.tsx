"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { BiometricEntry } from "@/lib/db/types";
import type { RangeKey } from "@/components/biometrics/entries-chart";
import type { FieldKey } from "@/components/biometrics/fields";

export type ExportSource = {
  rows: BiometricEntry[];
  range: RangeKey;
  metric: FieldKey;
  chartSvg?: string | null;
};

type AppActionsContextValue = {
  exportSource: ExportSource | null;
  setExportSource: React.Dispatch<React.SetStateAction<ExportSource | null>>;
};

const AppActionsContext = createContext<AppActionsContextValue | null>(null);

export function AppActionsProvider({ children }: { children: React.ReactNode }) {
  const [exportSource, setExportSource] = useState<ExportSource | null>(null);

  const value = useMemo<AppActionsContextValue>(
    () => ({ exportSource, setExportSource }),
    [exportSource],
  );

  return <AppActionsContext.Provider value={value}>{children}</AppActionsContext.Provider>;
}

export function useAppActions() {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error("useAppActions deve ser usado dentro de <AppActionsProvider>");
  return ctx;
}
