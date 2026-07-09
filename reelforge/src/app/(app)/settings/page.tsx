import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { isStripeEnabled } from "@/lib/stripe";
import { formatDate } from "@/lib/utils";
import { BillingPanel } from "@/components/billing-panel";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { upgrade?: string; reason?: string; upgraded?: string };
}) {
  const { user, workspace } = await requireWorkspace();
  const plan = getPlan(workspace.planTier);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [projectsThisMonth, exportsThisMonth, memberCount] = await Promise.all([
    prisma.project.count({
      where: { workspaceId: workspace.id, createdAt: { gte: startOfMonth } },
    }),
    prisma.export.count({
      where: {
        clip: { project: { workspaceId: workspace.id } },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.membership.count({ where: { workspaceId: workspace.id } }),
  ]);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Billing & settings</h1>

      {searchParams.upgraded && (
        <div className="card mt-4 border-emerald-500/30 bg-emerald-500/5 text-sm text-emerald-300">
          🎉 Your plan has been updated. Thanks for upgrading!
        </div>
      )}
      {searchParams.reason && (
        <div className="card mt-4 border-amber-500/30 bg-amber-500/5 text-sm text-amber-200">
          {decodeURIComponent(searchParams.reason)}
        </div>
      )}

      {/* Account */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-white">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Name" value={user.name ?? "—"} />
            <Row label="Email" value={user.email} />
            <Row label="Workspace" value={workspace.name} />
            <Row label="Members" value={String(memberCount)} />
          </dl>
        </div>

        <div className="card">
          <h2 className="font-semibold text-white">Current plan</h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{plan.name}</span>
            <span className="text-sm text-ink-400">${plan.priceMonthly}/mo</span>
          </div>
          {workspace.planRenewsAt && (
            <p className="mt-1 text-xs text-ink-400">
              Renews {formatDate(workspace.planRenewsAt)}
            </p>
          )}
          <div className="mt-4 space-y-2 text-sm">
            <Usage
              label="Projects"
              used={projectsThisMonth}
              limit={plan.limits.projectsPerMonth}
            />
            <Usage
              label="Exports"
              used={exportsThisMonth}
              limit={plan.limits.exportsPerMonth}
            />
            <Usage
              label="Seats"
              used={memberCount}
              limit={plan.limits.seats}
            />
          </div>
        </div>
      </section>

      {!isStripeEnabled() && (
        <p className="mt-4 text-xs text-ink-500">
          Stripe isn&apos;t configured, so upgrades apply instantly in this dev
          environment. Add your Stripe keys to enable real checkout.
        </p>
      )}

      {/* Plans */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Change plan</h2>
        <BillingPanel currentTier={workspace.planTier} />
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-400">{label}</dt>
      <dd className="font-medium text-ink-100">{value}</dd>
    </div>
  );
}

function Usage({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, (used / limit) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-ink-400">{label}</span>
        <span className="text-ink-300">
          {used} / {unlimited ? "∞" : limit}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
          <div
            className={pct >= 100 ? "h-full bg-red-500" : "h-full bg-brand-500"}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
