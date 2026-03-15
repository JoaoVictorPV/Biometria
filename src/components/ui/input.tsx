import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm transition-shadow outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-700",
        className,
      )}
      {...props}
    />
  );
}
