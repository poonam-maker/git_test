"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ContentTemplate } from "@/lib/templates";

export function TemplatePicker({
  templates,
  defaultKey = "talking-head",
  name = "templateKey",
}: {
  templates: ContentTemplate[];
  defaultKey?: string;
  name?: string;
}) {
  const [selected, setSelected] = useState(defaultKey);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name={name} value={selected} />
      {templates.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setSelected(t.key)}
          className={cn(
            "card text-left transition",
            selected === t.key
              ? "border-brand-500 ring-1 ring-brand-500"
              : "hover:border-white/20"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{t.emoji}</span>
            <span className="font-semibold text-white">{t.name}</span>
          </div>
          <p className="mt-2 text-xs text-ink-400">{t.description}</p>
        </button>
      ))}
    </div>
  );
}
