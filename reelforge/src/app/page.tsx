import Link from "next/link";
import { Logo } from "@/components/logo";
import { TEMPLATE_LIST } from "@/lib/templates";

// Public marketing landing page. Positions the product as
// "AI repurposing & publishing" — not just another editor.

const STEPS = [
  { n: "1", title: "Upload", body: "Drop in one long recording — a talking-head, vlog, or podcast." },
  { n: "2", title: "Process", body: "AI removes silence, finds the best moments, and cuts short clips." },
  { n: "3", title: "Review", body: "Edit captions and AI-written titles, hooks, and hashtags." },
  { n: "4", title: "Export", body: "Download ready-to-post assets for TikTok, Reels, and Shorts." },
];

const VALUE = [
  { icon: "✂️", title: "One video → a week of content", body: "Turn a single upload into a batch of publish-ready short clips." },
  { icon: "🔇", title: "Auto-remove silence & filler", body: "Tighten pacing automatically so every clip keeps attention." },
  { icon: "💬", title: "Social-friendly captions", body: "Clean, styled captions with placement presets, ready to burn in." },
  { icon: "✍️", title: "Ready-to-post copy", body: "Titles, hooks, descriptions, hashtags, and CTAs written for you." },
  { icon: "🎨", title: "Brand kits", body: "Keep colors, fonts, tone, and CTAs consistent across everything." },
  { icon: "📤", title: "Export bundles", body: "Bulk-export for every platform in the exact formats they want." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/pricing" className="btn-ghost hidden sm:inline-flex">
              Pricing
            </Link>
            <Link href="/login" className="btn-ghost">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.25),transparent)]" />
        <div className="mx-auto max-w-4xl px-4 py-24 text-center">
          <span className="badge mb-6 bg-brand-500/10 text-brand-300">
            AI repurposing & publishing
          </span>
          <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
            One upload becomes a{" "}
            <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              week of content
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-300">
            ReelForge turns one raw recording into multiple publish-ready short
            clips — with captions, titles, hooks, and hashtags. Built for
            creators and small businesses who want to post more, faster.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary px-6 py-3 text-base">
              Start free — no card needed
            </Link>
            <Link href="/pricing" className="btn-secondary px-6 py-3 text-base">
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-400">
            For TikTok · Instagram Reels · YouTube Shorts · Standard vertical
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-white">
          The whole workflow, in four steps
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                {s.n}
              </div>
              <h3 className="font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-white">
          Outputs that are ready to post
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-400">
          Not just edited — packaged, on-brand, and optimized for each platform.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE.map((v) => (
            <div key={v.title} className="card">
              <div className="text-2xl">{v.icon}</div>
              <h3 className="mt-3 font-semibold text-white">{v.title}</h3>
              <p className="mt-1 text-sm text-ink-400">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-white">
          Templates for how you actually create
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {TEMPLATE_LIST.map((t) => (
            <div
              key={t.key}
              className="card flex items-center gap-3 px-4 py-3"
            >
              <span className="text-xl">{t.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs capitalize text-ink-400">{t.audience}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="card bg-gradient-to-br from-brand-700/30 to-ink-900 p-10">
          <h2 className="text-3xl font-bold text-white">
            Post more without filming more
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-300">
            Start free today. Upgrade when you&apos;re ready to scale your
            content and your team.
          </p>
          <Link
            href="/signup"
            className="btn-primary mt-6 px-6 py-3 text-base"
          >
            Create your first project
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Logo />
          <div className="flex gap-6 text-sm text-ink-400">
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/login" className="hover:text-white">Log in</Link>
            <Link href="/signup" className="hover:text-white">Sign up</Link>
          </div>
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} ReelForge
          </p>
        </div>
      </footer>
    </div>
  );
}
