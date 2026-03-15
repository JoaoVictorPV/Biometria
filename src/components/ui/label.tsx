import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Props = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: Props) {
  return (
    <label
      className={cn("text-sm font-medium text-zinc-800 dark:text-zinc-200", className)}
      {...props}
    />
  );
}
