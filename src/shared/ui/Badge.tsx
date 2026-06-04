import type { ReactNode } from "react";
import { cn } from "../utils";

type BadgeProps = {
  readonly children: ReactNode;
  readonly className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600",
        className
      )}
    >
      {children}
    </span>
  );
}
