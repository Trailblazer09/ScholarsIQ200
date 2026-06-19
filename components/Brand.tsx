import { cn } from "@/lib/utils";

/** The product wordmark: "Scholars" + a green "IQ200". */
export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold tracking-tight", className)}>
      Scholars<span className="text-brand">IQ200</span>
    </span>
  );
}
