import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeClasses = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
  xl: "px-8 py-4 text-lg",
};

const variantClasses = {
  primary:
    "bg-neutral-950 text-white shadow-sm hover:bg-neutral-800 focus:ring-2 focus:ring-neutral-300",
  secondary:
    "bg-neutral-700 text-white shadow-sm hover:bg-neutral-800 focus:ring-2 focus:ring-neutral-300",
  outline:
    "border border-neutral-300 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-200",
  ghost:
    "border-transparent bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
  danger:
    "border-transparent bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  size = "md",
  variant = "primary",
  icon,
  iconPosition = "left",
  loading = false,
  disabled,
  fullWidth,
  ...props
}: ButtonProps) => {
  const renderIcon = () => {
    if (loading) {
      return (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      );
    }
    return icon;
  };

  const iconElement = renderIcon();
  const showLeftIcon = iconElement && iconPosition === "left";
  const showRightIcon = iconElement && iconPosition === "right";
  const buttonClassName = fullWidth ? "w-full" : "";

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${className} ${buttonClassName}`}
      disabled={disabled || loading}
      {...props}
    >
      {showLeftIcon && <span className="flex-shrink-0">{iconElement}</span>}
      {children}
      {showRightIcon && <span className="flex-shrink-0">{iconElement}</span>}
    </button>
  );
};
