import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-lg">
        RF
      </span>
      <span className="text-lg font-bold tracking-tight text-white">
        Reel<span className="text-brand-400">Forge</span>
      </span>
    </Link>
  );
}
