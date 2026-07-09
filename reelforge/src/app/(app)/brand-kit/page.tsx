import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { getStorage } from "@/lib/storage";
import { BrandKitEditor } from "@/components/brand-kit-editor";
import Link from "next/link";

export default async function BrandKitPage() {
  const { workspace } = await requireWorkspace();
  const plan = getPlan(workspace.planTier);
  const storage = getStorage();

  const kits = await prisma.brandKit.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  const hasBrandKits = plan.features.includes("brand_kits");

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Brand kit</h1>
          <p className="mt-1 text-sm text-ink-400">
            Keep every clip on-brand. Colors, fonts, tone, and CTAs feed the AI
            copy generator automatically.
          </p>
        </div>
        <span className="text-sm text-ink-400">
          {kits.length}/{plan.limits.brandKits} kits
        </span>
      </div>

      {!hasBrandKits && (
        <div className="card mt-6 flex items-center justify-between border-brand-500/30 bg-brand-500/5">
          <p className="text-sm text-ink-200">
            Brand kits shape your captions and social copy. Upgrade to save and
            reuse your brand.
          </p>
          <Link href="/settings?upgrade=1" className="btn-primary">
            Upgrade
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {kits.map((kit) => (
          <BrandKitEditor
            key={kit.id}
            kit={{
              id: kit.id,
              name: kit.name,
              primaryColor: kit.primaryColor,
              accentColor: kit.accentColor,
              fontFamily: kit.fontFamily,
              toneOfVoice: kit.toneOfVoice,
              ctaTemplates: kit.ctaTemplates,
              logoUrl: kit.logoKey ? storage.url(kit.logoKey) : null,
              logoKey: kit.logoKey,
              isDefault: kit.isDefault,
            }}
            readOnly={!hasBrandKits}
          />
        ))}

        {hasBrandKits && kits.length < plan.limits.brandKits && (
          <BrandKitEditor kit={null} readOnly={false} />
        )}
      </div>
    </div>
  );
}
