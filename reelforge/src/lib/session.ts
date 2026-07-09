import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { getPrimaryWorkspace } from "./workspace";

// Server-side helpers used by pages, server actions, and API routes to resolve
// the current user and their active workspace.

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require an authenticated user AND resolve their primary workspace. */
export async function requireWorkspace() {
  const user = await requireUser();
  const workspace = await getPrimaryWorkspace(user.id);
  if (!workspace) redirect("/login");
  return { user, workspace };
}

/** API-route variant: returns null instead of redirecting. */
export async function getSessionContext() {
  const user = await getCurrentUser();
  if (!user) return null;
  const workspace = await getPrimaryWorkspace(user.id);
  if (!workspace) return null;
  return { user, workspace };
}
