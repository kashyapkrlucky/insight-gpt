"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { applyTheme, useUIStore } from "@/shared/store/useUIStore";

function ThemeSync() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSync />
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--surface)",
            color: "var(--fg)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            fontSize: "14px",
            boxShadow: "0 8px 24px -6px rgb(0 0 0 / 0.18)",
          },
          error: { duration: 5000 },
        }}
      />
    </>
  );
}
