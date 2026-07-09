import Link from "next/link";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/templates";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export default async function ProjectsPage() {
  const { workspace } = await requireWorkspace();
  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { clips: true } } },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <Link href="/projects/new" className="btn-primary">
          + New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card mt-8 py-12 text-center text-ink-400">
          No projects yet.{" "}
          <Link href="/projects/new" className="text-brand-400 hover:underline">
            Create one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {projects.map((p) => {
            const tpl = getTemplate(p.templateKey);
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="card transition hover:border-brand-500/40"
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{tpl.emoji}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-3 font-semibold text-white">{p.title}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {tpl.name} · {p._count.clips} clips · updated{" "}
                  {formatDate(p.updatedAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
