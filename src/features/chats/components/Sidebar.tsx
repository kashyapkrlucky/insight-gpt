"use client";

import Image from "next/image";
import Link from "next/link";
import { PanelLeftCloseIcon, SquarePenIcon, XIcon } from "lucide-react";
import { ChatList } from "./ChatList";
import { APP_NAME } from "@/shared/constants";
import { UserMenu } from "@/shared/ui/UserMenu";
import { IconButton } from "@/shared/ui/Button";
import { Kbd } from "@/shared/ui/Kbd";
import { MOD_KEY } from "@/shared/hooks/useKeyboardShortcuts";
import { useUIStore } from "@/shared/store/useUIStore";
import { cn } from "@/shared/utils";
import { useIsDesktop } from "@/shared/hooks/useMediaQuery";

export function Sidebar() {
  const {
    isSidebarOpen,
    setSidebarOpen,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useUIStore();
  const isDesktop = useIsDesktop();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity md:hidden",
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="sidebar"
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[min(85vw,300px)] flex-col border-r border-border bg-surface transition-transform duration-200 ease-out",
          "md:static md:z-auto md:w-[272px] md:translate-x-0 md:transition-[margin]",
          isSidebarOpen ? "translate-x-0 shadow-float md:shadow-none" : "-translate-x-full",
          isSidebarCollapsed && "md:-ml-[272px]",
        )}
        // Keep a collapsed or closed sidebar out of the tab order.
        inert={(isDesktop ? isSidebarCollapsed : !isSidebarOpen) || undefined}
      >
        <header className="flex h-14 shrink-0 items-center gap-2.5 px-3">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1"
          >
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-lg"
            />
            <span className="truncate text-sm font-semibold text-fg">
              {APP_NAME}
            </span>
          </Link>
          <IconButton
            label="Close sidebar"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <XIcon />
          </IconButton>
          <IconButton
            label={`Collapse sidebar (${MOD_KEY}B)`}
            className="hidden md:inline-grid"
            onClick={toggleSidebarCollapsed}
          >
            <PanelLeftCloseIcon />
          </IconButton>
        </header>

        <div className="px-3 pb-3">
          <Link
            href="/"
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg shadow-soft transition-colors hover:bg-surface-2"
          >
            <SquarePenIcon className="size-4 text-muted" />
            New chat
            <span className="ml-auto hidden gap-0.5 md:flex">
              <Kbd>{MOD_KEY}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <ChatList />
        </div>

        <footer className="border-t border-border p-2">
          <UserMenu />
        </footer>
      </aside>
    </>
  );
}
