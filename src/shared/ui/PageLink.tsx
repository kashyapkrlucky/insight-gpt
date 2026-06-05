import Link from "next/link";
import { cn } from "../utils";

interface PageLinkProps {
  url: string;
  text: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  external?: boolean;
}

export default function PageLink({ 
  url, 
  text, 
  size = "xs", 
  className,
  external = false 
}: PageLinkProps) {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const classes = cn(
    "text-purple-600 hover:text-purple-700 visited:text-purple-600 transition-colors duration-200 px-1",
    sizeClasses[size],
    className
  );

  if (external) {
    return (
      <a 
        href={url} 
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    );
  }

  return (
    <Link href={url} className={classes}>
      {text}
    </Link>
  );
}
