"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useUIStore, type Theme } from "@/shared/store/useUIStore";
import { cn } from "../utils";

const OPTIONS: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-3 gap-1 rounded-lg bg-surface-2 p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
            theme === value
              ? "bg-surface text-fg shadow-soft"
              : "text-muted hover:text-fg",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
