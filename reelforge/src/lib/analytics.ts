import { prisma } from "./prisma";
import type { AnalyticsEventType } from "@prisma/client";

// Thin analytics helper. Events are cheap rows we aggregate on the dashboard
// (projects, exports, template usage, content-per-month). Fire-and-forget:
// analytics must never break the core workflow.

export async function logEvent(
  workspaceId: string,
  type: AnalyticsEventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: { workspaceId, type, metadata: (metadata ?? {}) as any },
    });
  } catch (err) {
    console.error("[analytics] failed to log", type, err);
  }
}
