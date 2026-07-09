import Link from "next/link";
import { Logo } from "@/components/logo";
import { PricingTable } from "@/components/pricing-table";

export const metadata = {
  title: "Pricing — ReelForge",
  description: "Simple plans for creators, pros, small businesses, and agencies.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <nav className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost">Log in</Link>
            <Link href="/signup" className="btn-primary">Start free</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-black text-white">
            Plans that grow with your content
          </h1>
          <p className="mt-4 text-ink-300">
            Start free. Upgrade for more projects, brand kits, team seats, and
            bulk export. Cancel anytime.
          </p>
        </div>

        <div className="mt-12">
          <PricingTable ctaHref="/signup" />
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h2 className="text-xl font-bold text-white">Questions?</h2>
          <p className="mt-2 text-sm text-ink-400">
            Every plan includes auto captions, clip detection, and social copy
            generation. Paid plans remove the watermark and unlock brand kits,
            bulk export, and team workspaces.
          </p>
        </div>
      </section>
    </div>
  );
}
