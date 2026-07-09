import { requireWorkspace } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { AppNav } from "@/components/app-nav";

// Authenticated application shell. `requireWorkspace` redirects to /login when
// there is no session, so every page under (app) is protected here.

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, workspace } = await requireWorkspace();
  const plan = getPlan(workspace.planTier);

  return (
    <div className="flex min-h-screen">
      <AppNav
        workspaceName={workspace.name}
        planName={plan.name}
        userEmail={user.email}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
