import { cn } from "@/shared/utils";

interface TypingIndicatorProps {
  className?: string;
}

export default function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex gap-1">
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-neutral-600"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-neutral-600"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-neutral-600"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
