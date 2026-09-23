"use client";

import { MenuIcon, PanelLeftOpenIcon } from "lucide-react";
import { IconButton } from "@/shared/ui/Button";
import { MOD_KEY } from "@/shared/hooks/useKeyboardShortcuts";
import { useUIStore } from "@/shared/store/useUIStore";

/** Page header with the sidebar toggles (mobile drawer / collapsed desktop sidebar). */
export function TopBar({
  children,
  actions,
}: {
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { setSidebarOpen, isSidebarCollapsed, toggleSidebarCollapsed } =
    useUIStore();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-surface/70 sm:px-4">
      <IconButton
        label="Open sidebar"
        className="md:hidden"
        aria-controls="sidebar"
        onClick={() => setSidebarOpen(true)}
      >
        <MenuIcon />
      </IconButton>
      {isSidebarCollapsed && (
        <IconButton
          label={`Expand sidebar (${MOD_KEY}B)`}
          className="hidden md:inline-grid"
          aria-controls="sidebar"
          onClick={toggleSidebarCollapsed}
        >
          <PanelLeftOpenIcon />
        </IconButton>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
