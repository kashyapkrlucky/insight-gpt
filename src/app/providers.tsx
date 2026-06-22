"use client";

import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            color: "#111827",
            fontSize: "14px",
          },
          error: {
            duration: 5000,
          },
        }}
      />
    </>
  );
}
