"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(params.get("verify") === "1");

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
  }

  async function onMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setError(null);
    setLoading(true);
    await signIn("email", { email, redirect: false });
    setLoading(false);
    setMagicSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card">
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-400">
            Log in to your ReelForge workspace.
          </p>

          {magicSent && (
            <div className="mt-4 rounded-lg border border-brand-500/30 bg-brand-500/10 p-3 text-sm text-brand-200">
              Check your email for a magic sign-in link. (In dev, it&apos;s
              printed to the server console.)
            </div>
          )}

          <form onSubmit={onPasswordLogin} className="mt-5 space-y-4">
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
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "…" : "Log in"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-ink-500">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={onMagicLink}
            disabled={loading}
            className="btn-secondary w-full"
          >
            Email me a magic link
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-ink-400">
          New here?{" "}
          <Link href="/signup" className="text-brand-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
