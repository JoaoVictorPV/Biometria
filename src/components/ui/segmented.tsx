import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  onChange: (next: T) => void;
  options: Option<T>[];
  className?: string;
};

export function Segmented<T extends string>({ value, onChange, options, className }: Props<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
      role="tablist"
      aria-label="Seleção"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-9 rounded-lg px-3 text-sm transition-colors",
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
