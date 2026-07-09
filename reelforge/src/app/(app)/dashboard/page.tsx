import Link from "next/link";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import { getTemplate } from "@/lib/templates";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspace();
  const plan = getPlan(workspace.planTier);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [projects, projectCount, exportCount, monthProjects] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { clips: true } } },
    }),
    prisma.project.count({ where: { workspaceId: workspace.id } }),
    prisma.export.count({
      where: { clip: { project: { workspaceId: workspace.id } } },
    }),
    prisma.project.count({
      where: { workspaceId: workspace.id, createdAt: { gte: startOfMonth } },
    }),
  ]);

  const projectLimit = plan.limits.projectsPerMonth;
  const remaining =
    projectLimit === -1 ? "∞" : Math.max(0, projectLimit - monthProjects);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Turn one recording into a week of content.
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          + New project
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Total projects" value={projectCount} />
        <Stat label="Total exports" value={exportCount} />
        <Stat label="Projects this month" value={monthProjects} />
        <Stat label="Projects left" value={remaining} accent />
      </div>

      {/* Recent projects */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent projects</h2>
          <Link href="/projects" className="text-sm text-brand-400 hover:underline">
            View all
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {projects.map((p) => {
              const tpl = getTemplate(p.templateKey);
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="card flex items-center justify-between transition hover:border-brand-500/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tpl.emoji}</span>
                    <div>
                      <p className="font-medium text-white">{p.title}</p>
                      <p className="text-xs text-ink-400">
                        {tpl.name} · {p._count.clips} clips · {formatDate(p.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-black ${
          accent ? "text-brand-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center py-12 text-center">
      <div className="text-4xl">🎬</div>
      <h3 className="mt-3 font-semibold text-white">No projects yet</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-400">
        Create your first project, upload a video, and let ReelForge cut it into
        publish-ready clips.
      </p>
      <Link href="/projects/new" className="btn-primary mt-5">
        Create your first project
      </Link>
    </div>
  );
}
