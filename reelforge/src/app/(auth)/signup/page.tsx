"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { PLANS } from "@/lib/plans";
import type { PlanTier } from "@prisma/client";

function SignupInner() {
  const params = useSearchParams();
  const router = useRouter();
  const planParam = (params.get("plan") as PlanTier) || null;
  const plan = planParam && PLANS[planParam] ? PLANS[planParam] : null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    // Auto-login after signup.
    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    // New users go through onboarding; pass along the chosen plan.
    router.push(planParam ? `/onboarding?plan=${planParam}` : "/onboarding");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card">
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          {plan ? (
            <p className="mt-1 text-sm text-ink-400">
              Starting with the{" "}
              <span className="font-semibold text-brand-400">{plan.name}</span>{" "}
              plan. You&apos;ll confirm billing after setup.
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-400">
              Start free — no credit card required.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Creator"
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-ink-500">At least 8 characters.</p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-ink-400">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupInner />
    </Suspense>
  );
}
