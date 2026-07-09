"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/projects", label: "Projects", icon: "🎬" },
  { href: "/templates", label: "Templates", icon: "🧩" },
  { href: "/brand-kit", label: "Brand kit", icon: "🎨" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/settings", label: "Billing & settings", icon: "⚙️" },
];

export function AppNav({
  workspaceName,
  planName,
  userEmail,
}: {
  workspaceName: string;
  planName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 flex-col border-r border-white/5 bg-ink-900/40 p-4">
      <Logo href="/dashboard" className="mb-6 px-2" />

      <div className="mb-4 rounded-lg border border-white/5 bg-ink-900 px-3 py-2">
        <p className="truncate text-sm font-semibold text-white">
          {workspaceName}
        </p>
        <span className="badge mt-1 bg-brand-500/15 text-brand-300">
          {planName}
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {LINKS.map((l) => {
          const active =
            pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-600 text-white"
                  : "text-ink-300 hover:bg-ink-800 hover:text-white"
              )}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/5 pt-4">
        <p className="truncate px-2 text-xs text-ink-400">{userEmail}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="btn-ghost mt-2 w-full justify-start text-sm"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
