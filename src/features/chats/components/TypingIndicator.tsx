import { cn } from "@/shared/utils";

interface TypingIndicatorProps {
  className?: string;
}

export default function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex gap-1">
        <div
          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
