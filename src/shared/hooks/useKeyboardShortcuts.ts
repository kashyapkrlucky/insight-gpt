"use client";

import { useEffect, useRef } from "react";

export const MOD_KEY =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
    ? "⌘"
    : "Ctrl";

export const COMPOSER_ID = "composer";

type Shortcuts = {
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
};

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * App-wide shortcuts:
 * - Mod+K: new chat
 * - Mod+B: toggle sidebar
 * - "/": focus the message box (when not already typing)
 */
export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  const ref = useRef(shortcuts);
  useEffect(() => {
    ref.current = shortcuts;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod && !event.shiftKey && !event.altKey && key === "k") {
        event.preventDefault();
        ref.current.onNewChat?.();
      } else if (mod && !event.shiftKey && !event.altKey && key === "b") {
        event.preventDefault();
        ref.current.onToggleSidebar?.();
      } else if (key === "/" && !mod && !isTypingTarget(event.target)) {
        const composer = document.getElementById(COMPOSER_ID);
        if (composer && !(composer as HTMLTextAreaElement).disabled) {
          event.preventDefault();
          composer.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
