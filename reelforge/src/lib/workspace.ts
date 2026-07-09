import { prisma } from "./prisma";

// Every user gets a personal workspace on first signup. This keeps the data
// model team-first (unlocking Business/Agency tiers) while staying invisible to
// solo creators.

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "workspace";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Ensure a freshly-created user has a workspace, an owner membership, and a
 * default brand kit. Safe to call more than once — it no-ops if a membership
 * already exists.
 */
export async function provisionNewUser(
  userId: string,
  displayName?: string | null
): Promise<void> {
  const existing = await prisma.membership.findFirst({ where: { userId } });
  if (existing) return;

  const name = displayName?.trim() || "My Workspace";
  const workspace = await prisma.workspace.create({
    data: {
      name: `${name}'s Workspace`,
      slug: slugify(name),
      memberships: { create: { userId, role: "OWNER" } },
      brandKits: {
        create: {
          name: "Default Brand",
          isDefault: true,
          ctaTemplates: ["Follow for more", "Link in bio"],
        },
      },
    },
  });
  return void workspace;
}

/** The user's primary workspace (first one they own/belong to). */
export async function getPrimaryWorkspace(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { workspace: true },
  });
  return membership?.workspace ?? null;
}
