"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "@/features/auth/store/useAuthStore";
import { useChatStore } from "@/features/chats/store/useChatStore";
import { UserInfo } from "./UserInfo";
import { ThemeToggle } from "./ThemeToggle";
import { Kbd } from "./Kbd";
import { MOD_KEY } from "@/shared/hooks/useKeyboardShortcuts";

const SHORTCUTS = [
  { keys: [MOD_KEY, "K"], label: "New chat" },
  { keys: [MOD_KEY, "B"], label: "Toggle sidebar" },
  { keys: ["/"], label: "Focus message box" },
];

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { setCurrentChat } = useChatStore();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setCurrentChat(null);
    toast.success("Signed out.");
    router.replace("/login");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-surface-2"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <UserInfo showEmail={false} />
        <ChevronsUpDownIcon className="size-4 shrink-0 text-subtle" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute inset-x-0 bottom-full z-50 mb-2 animate-slide-up overflow-hidden rounded-xl border border-border bg-surface shadow-float"
        >
          <div className="border-b border-border p-3">
            <UserInfo />
          </div>

          <div className="space-y-2 border-b border-border p-3">
            <p className="text-xs font-medium text-muted">Appearance</p>
            <ThemeToggle />
          </div>

          <div className="space-y-1.5 border-b border-border p-3">
            <p className="text-xs font-medium text-muted">Keyboard shortcuts</p>
            {SHORTCUTS.map(({ keys, label }) => (
              <div
                key={label}
                className="flex items-center justify-between text-xs text-fg"
              >
                <span>{label}</span>
                <span className="flex gap-1">
                  {keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>

          <div className="p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <LogOutIcon className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
