import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding-wizard";

// First-run setup. Names the workspace and seeds the default brand kit so the
// very first project already produces on-brand copy.

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const { user, workspace } = await requireWorkspace();
  const defaultKit = await prisma.brandKit.findFirst({
    where: { workspaceId: workspace.id, isDefault: true },
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <OnboardingWizard
          initial={{
            workspaceName: workspace.name,
            brandName: defaultKit?.name ?? "My Brand",
            primaryColor: defaultKit?.primaryColor ?? "#4f46e5",
            toneOfVoice: defaultKit?.toneOfVoice ?? "friendly",
            userName: user.name ?? "",
          }}
          plan={searchParams.plan ?? null}
        />
      </div>
    </div>
  );
}
