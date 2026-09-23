"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import toast from "react-hot-toast";
import { IconButton } from "./Button";
import { cn } from "../utils";

export function CopyButton({
  text,
  label = "Copy",
  className,
  withText = false,
}: {
  text: string;
  label?: string;
  className?: string;
  withText?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      toast.error("Couldn't copy to the clipboard.");
    }
  };

  const icon = copied ? (
    <CheckIcon className="text-success" />
  ) : (
    <CopyIcon />
  );

  if (withText) {
    return (
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors [&_svg]:size-3.5",
          className,
        )}
      >
        {icon}
        {copied ? "Copied" : label}
      </button>
    );
  }

  return (
    <IconButton
      label={copied ? "Copied" : label}
      size="sm"
      onClick={copy}
      className={className}
    >
      {icon}
    </IconButton>
  );
}
