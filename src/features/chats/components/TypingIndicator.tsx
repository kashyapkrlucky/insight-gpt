import { cn } from "@/shared/utils";

export default function TypingIndicator({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex items-center gap-1", className)}>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-muted"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
