# LifeArc — Level up your real life

LifeArc is a gamified, identity-driven life-building app for people in their 20s
who feel overwhelmed, stuck, or unsure what to do next. It turns *getting your
life together* into an RPG you actually want to play: pick your identity, take on
AI-personalized daily quests, beat weekly bosses, earn XP / coins / badges, and
turn your wins into shareable cards.

> Not a to-do app. Not a habit tracker. A **life progression** app.

<p>
  <img alt="stack" src="https://img.shields.io/badge/React-18-61dafb"> ·
  <img alt="stack" src="https://img.shields.io/badge/TypeScript-strict-3178c6"> ·
  <img alt="stack" src="https://img.shields.io/badge/Vite-5-646cff"> ·
  <img alt="stack" src="https://img.shields.io/badge/Tailwind-3-38bdf8">
</p>

---

## ✨ Highlights

- **Identity-driven RPG** — 6 classes (Builder, Creator, Explorer, Organizer,
  Rebuilder, Leader), each with its own **theme, vocabulary, missions, level
  titles, milestones, badges, and share-card style**. Picking a class re-themes
  the entire UI in real time.
- **Full product loop** — signup → life-path quiz → identity reveal → daily
  quests → weekly boss battles → XP / levels / coins / badges → progress
  dashboard → shareable cards → daily return.
- **AI everywhere** — personalized daily quests, task breakdowns, motivational
  copy, next-step coaching, social captions, and progress summaries. Runs fully
  offline by default; swap in a real LLM with one env var (see below).
- **Viral by design** — level-up, weekly-recap, mission, boss-win, streak, and
  identity-reveal cards, each exported as a high-res **PNG** ready for stories &
  feeds.
- **Launch-ready polish** — mobile-first, dark-mode-first, bold gradients,
  animated progression, empty / loading / error states, accessible controls,
  reduced-motion support, and safe-area handling for notched phones.
- **Monetization-ready** — free vs. premium tiers already modeled (extra
  identities, custom themes, share-card packs, advanced stats, boss rerolls).

## 🧩 Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **React 18 + Vite 5** | Fast, modern, deploys anywhere static |
| Language | **TypeScript (strict)** | Safe, self-documenting schema |
| Styling | **Tailwind CSS 3** | Theming via CSS variables per identity |
| State | **Zustand** (+ `persist`) | Tiny store, localStorage-backed |
| Animation | **Framer Motion** | Progression / celebration effects |
| Export | **html-to-image** | Client-side PNG share cards |
| Routing | **React Router 6** | Standard SPA routing |

No backend is required to run — the app persists to `localStorage`, so it's fully
demoable and deployable as a static site today. The type layer in
[`src/types.ts`](src/types.ts) doubles as the production database schema.

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to /dist
npm run preview    # serve the production build
```

## 🗂️ Project structure

```
src/
  types.ts              # Full data model (= backend schema)
  data/
    identities.ts       # 6 classes: theme, vocabulary, milestones, share style
    lifeAreas.ts        # career, money, health, home, relationships, confidence
    quiz.ts             # Life-path onboarding quiz + scoring → identity
    badges.ts           # Achievement catalog
    bosses.ts           # Weekly boss generator
  lib/
    ai.ts               # AI service: quests, breakdowns, copy, captions, summaries
    game.ts             # XP curve + level math
    store.ts            # Zustand store — all game logic & progression
    theme.ts            # Identity → CSS variable theming
    utils.ts            # Dates, ids, seeded randomness
  components/           # AppShell, ShareCard, QuestRow, LevelUpOverlay, UI kit…
  pages/                # Landing, Auth, Onboarding, Dashboard, Identity,
                        # Quests, BossBattle, Achievements, ShareCreator, Profile
```

## 🧠 AI service

All AI features route through [`src/lib/ai.ts`](src/lib/ai.ts).

- **Default (`VITE_AI_MODE=local`)** — a deterministic, identity-aware generator.
  Zero keys, zero latency, works offline. Great for demos and privacy.
- **Live (`VITE_AI_MODE=live`)** — posts a structured prompt to
  `VITE_AI_ENDPOINT` (a server proxy so keys never ship to the client) and
  **falls back to the local generator on any error**, so the UX never breaks.

Copy `.env.example` → `.env` and set the values to go live. Point the endpoint at
a proxy for the latest Claude models (e.g. `claude-sonnet-5`).

## 🧬 Data model

Modeled in `src/types.ts` and ready to lift into Postgres / Supabase:

`users` · `profiles` · `identities` · `quests` · `tasks` · `streaks` ·
`achievements` · `boss_battles` · `share_cards` · `notifications` ·
`progress_logs`.

## 📱 Pages

Landing · Sign up / Login · Onboarding quiz · Dashboard · Identity/class ·
Quests & tasks · Boss battle · Achievements · Share-card creator · Profile /
settings.

## 🔭 Roadmap to production

- Real auth + sync (Supabase / Auth.js) — swap the simulated `signup` in
  `store.ts` and gate `/api/generate`.
- Push notifications (Web Push / native) — the `notifications` model is ready.
- Payments (Stripe) wired to the existing `tier` field.
- Server-side AI proxy for live generation.

---

Built as a focused, coherent MVP: retention hooks and beautiful execution over
unnecessary complexity. **Level up your real life.**
