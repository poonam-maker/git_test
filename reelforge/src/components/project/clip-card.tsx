"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDuration } from "@/lib/utils";
import { CAPTION_STYLES } from "@/lib/templates";
import { updateCaption, updateSocialPost, createExport } from "@/server/actions";
import type { ExportFormat } from "@prisma/client";

interface ClipData {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  score: number;
  captions: { id: string; text: string; startSec: number; endSec: number }[];
  social: {
    title: string;
    hook: string;
    description: string;
    hashtags: string[];
    cta: string;
  } | null;
  exports: { id: string; format: ExportFormat }[];
}

const FORMATS: { key: ExportFormat; label: string }[] = [
  { key: "TIKTOK", label: "TikTok" },
  { key: "REELS", label: "Reels" },
  { key: "SHORTS", label: "Shorts" },
  { key: "VERTICAL", label: "Vertical" },
  { key: "SQUARE", label: "Square" },
];

export function ClipCard({
  clip,
  captionStyle,
}: {
  clip: ClipData;
  captionStyle: string;
}) {
  const [tab, setTab] = useState<"captions" | "post" | "export">("captions");
  const style = CAPTION_STYLES[captionStyle] ?? CAPTION_STYLES["bold-bottom"];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">{clip.title}</h3>
          <p className="text-xs text-ink-400">
            {formatDuration(clip.startSec)} – {formatDuration(clip.endSec)} ·{" "}
            {Math.round((clip.endSec - clip.startSec))}s
          </p>
        </div>
        <span
          className="badge bg-brand-500/15 text-brand-300"
          title="AI relevance score"
        >
          🔥 {Math.round(clip.score * 100)}
        </span>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 rounded-lg bg-ink-900 p-1 text-sm">
        {(["captions", "post", "export"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-medium capitalize transition",
              tab === t ? "bg-brand-600 text-white" : "text-ink-400 hover:text-white"
            )}
          >
            {t === "post" ? "Social post" : t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "captions" && (
          <CaptionsEditor captions={clip.captions} styleClassName={style.className} placement={style.placement} />
        )}
        {tab === "post" && <SocialEditor clipId={clip.id} social={clip.social} />}
        {tab === "export" && (
          <ExportPanel clipId={clip.id} existing={clip.exports} />
        )}
      </div>
    </div>
  );
}

function CaptionsEditor({
  captions,
  styleClassName,
  placement,
}: {
  captions: ClipData["captions"];
  styleClassName: string;
  placement: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (captions.length === 0) {
    return <p className="text-sm text-ink-400">No captions for this clip.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Preview */}
      <div className="relative flex aspect-[9/16] max-h-72 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-ink-800 to-black">
        <span className="text-xs text-ink-500">9:16 preview</span>
        <div
          className={cn(
            "absolute inset-x-3 flex justify-center px-2 text-center text-sm leading-tight",
            placement === "top" && "top-4",
            placement === "center" && "top-1/2 -translate-y-1/2",
            placement === "bottom" && "bottom-6"
          )}
        >
          <span className={cn("rounded bg-black/30 px-2 py-0.5", styleClassName)}>
            {captions[0]?.text}
          </span>
        </div>
      </div>

      {/* Editable lines */}
      <div className="space-y-2">
        {captions.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <span className="mt-2 w-10 shrink-0 text-[10px] text-ink-500">
              {formatDuration(c.startSec)}
            </span>
            <textarea
              defaultValue={c.text}
              rows={2}
              className="input resize-none text-sm"
              onBlur={(e) => {
                if (e.target.value !== c.text) {
                  start(async () => {
                    await updateCaption(c.id, e.target.value);
                    router.refresh();
                  });
                }
              }}
            />
          </div>
        ))}
        {pending && <p className="text-xs text-ink-500">Saving…</p>}
      </div>
    </div>
  );
}

function SocialEditor({
  clipId,
  social,
}: {
  clipId: string;
  social: ClipData["social"];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    title: social?.title ?? "",
    hook: social?.hook ?? "",
    description: social?.description ?? "",
    hashtags: social?.hashtags.join(" ") ?? "",
    cta: social?.cta ?? "",
  });
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  function save() {
    start(async () => {
      await updateSocialPost(clipId, form);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
      <Field label="Hook" value={form.hook} onChange={(v) => set("hook", v)} />
      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <Field
        label="Hashtags"
        value={form.hashtags}
        onChange={(v) => set("hashtags", v)}
        hint="Space or comma separated"
      />
      <Field label="Call to action" value={form.cta} onChange={(v) => set("cta", v)} />

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending} className="btn-primary">
          {pending ? "Saving…" : "Save post"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

function ExportPanel({
  clipId,
  existing,
}: {
  clipId: string;
  existing: ClipData["exports"];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const done = new Set(existing.map((e) => e.format));

  function run(format: ExportFormat) {
    start(async () => {
      await createExport(clipId, format);
      router.refresh();
    });
  }

  return (
    <div>
      <p className="text-sm text-ink-400">
        Export this clip in the format each platform expects.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.key}
            onClick={() => run(f.key)}
            disabled={pending}
            className={cn(
              "btn text-sm",
              done.has(f.key)
                ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "btn-secondary"
            )}
          >
            {done.has(f.key) ? `✓ ${f.label}` : `Export ${f.label}`}
          </button>
        ))}
      </div>
      {existing.length > 0 && (
        <p className="mt-3 text-xs text-ink-500">
          {existing.length} export{existing.length > 1 ? "s" : ""} ready to download.
        </p>
      )}
    </div>
  );
}
