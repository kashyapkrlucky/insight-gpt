export default function InlineLoader({ theme }: { theme?: string }) {
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full h-4 w-4 border-2 ${theme === "light" 
        ? "border-white/30 border-t-white" 
        : "border-gray-200 border-t-purple-500"
      }`}></div>
    </div>
  );
}
