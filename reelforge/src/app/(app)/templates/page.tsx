import Link from "next/link";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_LIST } from "@/lib/templates";
import { formatDuration } from "@/lib/utils";

// Templates gallery. Each card links to /projects/new — the picker there
// pre-selects the intent. We also surface which templates the workspace uses
// most (a small analytics touch that reinforces value).

export default async function TemplatesPage() {
  const { workspace } = await requireWorkspace();

  const usage = await prisma.analyticsEvent.findMany({
    where: { workspaceId: workspace.id, type: "TEMPLATE_USED" },
    select: { metadata: true },
  });

  // Roll up counts by templateKey from the JSON metadata.
  const counts: Record<string, number> = {};
  for (const row of usage) {
    const key = (row.metadata as { templateKey?: string } | null)?.templateKey;
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Templates</h1>
      <p className="mt-1 text-sm text-ink-400">
        Pick the intent that matches your content. Templates tune pacing,
        captions, and copy tone automatically.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {TEMPLATE_LIST.map((t) => (
          <div key={t.key} className="card flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-3xl">{t.emoji}</span>
              <div className="flex items-center gap-2">
                <span className="badge bg-ink-700/60 capitalize text-ink-200">
                  {t.audience}
                </span>
                {counts[t.key] ? (
                  <span className="badge bg-brand-500/15 text-brand-300">
                    used {counts[t.key]}×
                  </span>
                ) : null}
              </div>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-white">{t.name}</h3>
            <p className="mt-1 flex-1 text-sm text-ink-400">{t.description}</p>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <Meta label="Clip length" value={`~${formatDuration(t.defaults.targetClipSeconds)}`} />
              <Meta label="Caption" value={t.defaults.captionStyle.split("-")[0]} />
              <Meta label="Tone" value={t.defaults.tone} />
            </dl>

            <Link
              href={`/projects/new?template=${t.key}`}
              className="btn-primary mt-5"
            >
              Use this template
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-900 py-2">
      <dt className="text-ink-500">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize text-ink-200">{value}</dd>
    </div>
  );
}
