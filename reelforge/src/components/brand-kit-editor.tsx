"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBrandKit } from "@/server/actions";

interface Kit {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  toneOfVoice: string;
  ctaTemplates: string[];
  logoUrl: string | null;
  logoKey: string | null;
  isDefault: boolean;
}

const TONES = ["friendly", "professional", "bold", "educational", "warm", "casual"];
const FONTS = ["Inter", "Poppins", "Montserrat", "Roboto", "Playfair Display"];

export function BrandKitEditor({
  kit,
  readOnly,
}: {
  kit: Kit | null;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [logoKey, setLogoKey] = useState<string | null>(kit?.logoKey ?? null);
  const [logoUrl, setLogoUrl] = useState<string | null>(kit?.logoUrl ?? null);
  const [form, setForm] = useState({
    name: kit?.name ?? "New Brand",
    primaryColor: kit?.primaryColor ?? "#4f46e5",
    accentColor: kit?.accentColor ?? "#f97316",
    fontFamily: kit?.fontFamily ?? "Inter",
    toneOfVoice: kit?.toneOfVoice ?? "friendly",
    ctaTemplates: (kit?.ctaTemplates ?? ["Follow for more", "Link in bio"]).join("\n"),
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/brand-kit/logo", { method: "POST", body });
    if (res.ok) {
      const data = await res.json();
      setLogoKey(data.key);
      setLogoUrl(data.url);
      setSaved(false);
    }
  }

  function save() {
    start(async () => {
      await saveBrandKit(kit?.id ?? null, { ...form, logoKey });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            className="input max-w-xs text-lg font-semibold"
            value={form.name}
            disabled={readOnly}
            onChange={(e) => set("name", e.target.value)}
          />
          {kit?.isDefault && (
            <span className="badge bg-brand-500/15 text-brand-300">Default</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {/* Logo */}
          <div>
            <label className="label">Logo</label>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-ink-900">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="logo" className="max-h-full max-w-full" />
                ) : (
                  <span className="text-xs text-ink-500">No logo</span>
                )}
              </div>
              {!readOnly && (
                <label className="btn-secondary cursor-pointer text-sm">
                  Upload
                  <input type="file" accept="image/*" hidden onChange={onLogo} />
                </label>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Primary"
              value={form.primaryColor}
              disabled={readOnly}
              onChange={(v) => set("primaryColor", v)}
            />
            <ColorField
              label="Accent"
              value={form.accentColor}
              disabled={readOnly}
              onChange={(v) => set("accentColor", v)}
            />
          </div>

          {/* Font + tone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Font</label>
              <select
                className="input"
                value={form.fontFamily}
                disabled={readOnly}
                onChange={(e) => set("fontFamily", e.target.value)}
              >
                {FONTS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tone of voice</label>
              <select
                className="input capitalize"
                value={form.toneOfVoice}
                disabled={readOnly}
                onChange={(e) => set("toneOfVoice", e.target.value)}
              >
                {TONES.map((t) => (
                  <option key={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">CTA templates (one per line)</label>
            <textarea
              className="input resize-none"
              rows={5}
              value={form.ctaTemplates}
              disabled={readOnly}
              onChange={(e) => set("ctaTemplates", e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-500">
              These rotate into your generated social posts.
            </p>
          </div>

          {/* Live swatch preview */}
          <div>
            <label className="label">Preview</label>
            <div
              className="flex items-center gap-3 rounded-lg p-4"
              style={{ backgroundColor: form.primaryColor }}
            >
              <span
                className="rounded px-2 py-1 text-sm font-bold"
                style={{ backgroundColor: form.accentColor, color: "#fff" }}
              >
                {form.name}
              </span>
              <span className="text-sm text-white" style={{ fontFamily: form.fontFamily }}>
                Aa Bb Cc
              </span>
            </div>
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} disabled={pending} className="btn-primary">
            {pending ? "Saving…" : kit ? "Save changes" : "Create brand kit"}
          </button>
          {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        </div>
      )}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded border border-white/10 bg-transparent"
        />
        <input
          className="input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
