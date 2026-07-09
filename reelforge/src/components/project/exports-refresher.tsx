"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Polls export render progress and refreshes the page when a render finishes,
// so download links appear without a manual reload. Stops polling once nothing
// is pending. Cheap: one tiny GET every few seconds, only while work is live.

export function ExportsRefresher({ projectId }: { projectId: string }) {
  const router = useRouter();
  const lastPending = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/exports`, {
          cache: "no-store",
        });
        if (!res.ok || !active) return;
        const { pending } = await res.json();
        // Refresh when the pending count drops (a render just completed).
        if (lastPending.current !== null && pending < lastPending.current) {
          router.refresh();
        }
        lastPending.current = pending;
        if (pending > 0 && active) timer = setTimeout(tick, 2500);
      } catch {
        /* ignore transient errors */
      }
    };
    tick();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [projectId, router]);

  return null;
}
