"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Item = {
  id: string;
  header: React.ReactNode;
  content: React.ReactNode;
};

type Props = {
  items: Item[];
  defaultOpenId?: string;
  className?: string;
};

export function Accordion({ items, defaultOpenId, className }: Props) {
  const [openId, setOpenId] = React.useState<string | null>(defaultOpenId ?? null);

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((it) => {
        const open = it.id === openId;
        return (
          <div
            key={it.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setOpenId(open ? null : it.id)}
              aria-expanded={open}
            >
              <div className="min-w-0 flex-1">{it.header}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {open ? "Fechar" : "Abrir"}
              </div>
            </button>
            {open ? (
              <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">{it.content}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
