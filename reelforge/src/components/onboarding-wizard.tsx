"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { completeOnboarding } from "@/server/actions";

const TONES = ["friendly", "professional", "bold", "educational"];

export function OnboardingWizard({
  initial,
  plan,
}: {
  initial: {
    workspaceName: string;
    brandName: string;
    primaryColor: string;
    toneOfVoice: string;
    userName: string;
  };
  plan: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    workspaceName: initial.workspaceName,
    brandName: initial.brandName,
    primaryColor: initial.primaryColor,
    toneOfVoice: initial.toneOfVoice,
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function finish() {
    start(async () => {
      await completeOnboarding(form);
      // Send users who picked a paid plan to billing to confirm; others to app.
      router.push(plan && plan !== "FREE" ? `/settings?upgrade=1` : "/dashboard");
    });
  }

  const steps = [
    {
      title: "Name your workspace",
      body: (
        <div>
          <label className="label">Workspace name</label>
          <input
            className="input"
            value={form.workspaceName}
            onChange={(e) => set("workspaceName", e.target.value)}
            placeholder="Acme Studio"
          />
          <p className="mt-2 text-xs text-ink-500">
            This is where your projects and brand kits live. You can invite a
            team later.
          </p>
        </div>
      ),
    },
    {
      title: "Set up your brand",
      body: (
        <div className="space-y-4">
          <div>
            <label className="label">Brand name</label>
            <input
              className="input"
              value={form.brandName}
              onChange={(e) => set("brandName", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Brand color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-white/10 bg-transparent"
              />
              <input
                className="input"
                value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Pick your voice",
      body: (
        <div>
          <label className="label">Tone of voice</label>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("toneOfVoice", t)}
                className={`card text-left capitalize ${
                  form.toneOfVoice === t
                    ? "border-brand-500 ring-1 ring-brand-500"
                    : ""
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-500">
            We use this to write titles, hooks, and captions that sound like you.
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <Logo href="/dashboard" />
      </div>
      <div className="card">
        <div className="mb-4 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-brand-500" : "bg-ink-800"
              }`}
            />
          ))}
        </div>

        <h1 className="text-xl font-bold text-white">{current.title}</h1>
        <div className="mt-5">{current.body}</div>

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => (step === 0 ? router.push("/dashboard") : setStep((s) => s - 1))}
          >
            {step === 0 ? "Skip" : "Back"}
          </button>
          {isLast ? (
            <button onClick={finish} disabled={pending} className="btn-primary">
              {pending ? "Finishing…" : "Finish setup"}
            </button>
          ) : (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
