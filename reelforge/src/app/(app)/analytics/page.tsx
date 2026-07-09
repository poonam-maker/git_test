import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/templates";

// Simple, useful analytics: projects, exports, most-used templates, and content
// created per month. All derived from AnalyticsEvent rows + core tables.

export default async function AnalyticsPage() {
  const { workspace } = await requireWorkspace();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [projectCount, clipCount, exportCount, templateEvents, monthlyProjects, exportsByFormat] =
    await Promise.all([
      prisma.project.count({ where: { workspaceId: workspace.id } }),
      prisma.clip.count({ where: { project: { workspaceId: workspace.id } } }),
      prisma.export.count({
        where: { clip: { project: { workspaceId: workspace.id } } },
      }),
      prisma.analyticsEvent.findMany({
        where: { workspaceId: workspace.id, type: "TEMPLATE_USED" },
        select: { metadata: true },
      }),
      prisma.project.findMany({
        where: { workspaceId: workspace.id, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.export.findMany({
        where: { clip: { project: { workspaceId: workspace.id } } },
        select: { format: true },
      }),
    ]);

  // Most-used templates
  const templateCounts: Record<string, number> = {};
  for (const e of templateEvents) {
    const key = (e.metadata as { templateKey?: string } | null)?.templateKey;
    if (key) templateCounts[key] = (templateCounts[key] ?? 0) + 1;
  }
  const topTemplates = Object.entries(templateCounts).sort((a, b) => b[1] - a[1]);
  const maxTemplate = topTemplates[0]?.[1] ?? 1;

  // Content per month (last 6 months)
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("en-US", { month: "short" });
    const count = monthlyProjects.filter(
      (p) =>
        p.createdAt.getMonth() === d.getMonth() &&
        p.createdAt.getFullYear() === d.getFullYear()
    ).length;
    months.push({ label, count });
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  // Exports by format
  const formatCounts: Record<string, number> = {};
  for (const e of exportsByFormat) {
    formatCounts[e.format] = (formatCounts[e.format] ?? 0) + 1;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>
      <p className="mt-1 text-sm text-ink-400">
        Your content output at a glance.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Projects" value={projectCount} />
        <Stat label="Clips generated" value={clipCount} />
        <Stat label="Exports" value={exportCount} />
        <Stat
          label="Clips / project"
          value={projectCount ? (clipCount / projectCount).toFixed(1) : "0"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Content per month */}
        <div className="card">
          <h2 className="font-semibold text-white">Content created per month</h2>
          <div className="mt-6 flex h-40 items-end gap-3">
            {months.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-brand-500/80"
                    style={{ height: `${(m.count / maxMonth) * 100}%`, minHeight: m.count ? 6 : 2 }}
                    title={`${m.count} projects`}
                  />
                </div>
                <span className="text-xs text-ink-400">{m.label}</span>
                <span className="text-xs font-medium text-white">{m.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most-used templates */}
        <div className="card">
          <h2 className="font-semibold text-white">Most-used templates</h2>
          {topTemplates.length === 0 ? (
            <p className="mt-6 text-sm text-ink-400">No template usage yet.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {topTemplates.map(([key, count]) => {
                const tpl = getTemplate(key);
                return (
                  <li key={key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-ink-200">
                        {tpl.emoji} {tpl.name}
                      </span>
                      <span className="text-ink-400">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: `${(count / maxTemplate) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Exports by format */}
      <div className="card mt-6">
        <h2 className="font-semibold text-white">Exports by platform</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {["TIKTOK", "REELS", "SHORTS", "VERTICAL", "SQUARE"].map((f) => (
            <div key={f} className="rounded-lg bg-ink-900 px-4 py-3 text-center">
              <p className="text-xs uppercase text-ink-400">{f}</p>
              <p className="mt-1 text-xl font-bold text-white">
                {formatCounts[f] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
