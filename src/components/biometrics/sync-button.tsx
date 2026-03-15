"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  clientListEntries,
  clientSyncFromOnlineToLocal,
  getClientDataMode,
} from "@/lib/data/client";
import type { BiometricEntry } from "@/lib/db/types";
import { Button } from "@/components/ui/button";

type Props = {
  onSynced: (rows: BiometricEntry[]) => void;
};

export function SyncButton({ onSynced }: Props) {
  const [syncing, setSyncing] = useState(false);
  const mode = getClientDataMode();

  if (mode !== "local") return null;

  async function onClick() {
    setSyncing(true);
    try {
      await clientSyncFromOnlineToLocal();
      const { entries } = await clientListEntries();
      onSynced(entries);
      toast.success("Sincronizado! Base local foi atualizada a partir do online.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao sincronizar";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Button variant="secondary" onClick={onClick} disabled={syncing}>
      {syncing ? "Sincronizando..." : "Sincronizar"}
    </Button>
  );
}
