import React from "react";
import { cn } from "../utils";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

const variantClasses = {
  primary:
    "bg-accent text-accent-fg shadow-soft hover:bg-accent-hover",
  secondary: "bg-fg text-bg shadow-soft hover:opacity-90",
  outline:
    "border border-border bg-surface text-fg shadow-soft hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  // Fixed red in both themes: keeps white text at 4.5:1+ contrast.
  danger: "bg-[#dc2626] text-white shadow-soft hover:bg-[#b91c1c]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className,
      size = "md",
      variant = "primary",
      icon,
      loading = false,
      disabled,
      fullWidth,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && "w-full",
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner className="size-4" /> : icon}
        {children}
      </button>
    );
  },
);

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md";
  tone?: "default" | "danger" | "inverse";
}

/** Square icon-only button. `label` becomes the accessible name and tooltip. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, size = "md", tone = "default", className, children, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={cn(
          "inline-grid shrink-0 place-items-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
          size === "sm" ? "size-7" : "size-9",
          tone === "default" && "text-muted hover:bg-surface-2 hover:text-fg",
          tone === "danger" && "text-muted hover:bg-danger-soft hover:text-danger",
          tone === "inverse" && "text-accent-fg hover:bg-white/10",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
