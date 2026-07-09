# ReelForge

**AI repurposing & publishing for creators and small businesses.**

Turn one long recording into a week of publish-ready short-form content —
auto-cut clips, silence removal, styled captions, and AI-written titles, hooks,
descriptions, and hashtags — optimized for TikTok, Instagram Reels, YouTube
Shorts, and standard vertical.

> One upload becomes a week of content. The outputs are ready to post, not just
> edited.

---

## Why this exists

Most tools stop at "edited." ReelForge is positioned as a **content workflow
product**: upload → process → review → edit → export. The unique angle is
repurposing + brand-awareness + publish-ready packaging, so creators and small
businesses can post more without filming more.

## Tech stack

| Concern            | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Framework          | Next.js 14 (App Router) + React 18 + TypeScript    |
| Styling            | Tailwind CSS                                        |
| Database           | PostgreSQL via Prisma ORM                           |
| Auth               | NextAuth (email/password **and** magic link)        |
| File storage       | Pluggable driver — `local` (dev) or `s3`/R2 (prod) |
| Background jobs     | Pluggable driver — `inline` (dev) or Redis/BullMQ  |
| AI                 | Pluggable provider — `mock` (offline) or `claude`  |
| Payments           | Stripe subscriptions (with dev fallback)           |

Everything external (AI, storage, jobs, payments) is behind a small interface so
you can run the **entire product end-to-end with zero API keys**, then swap in
real providers without touching feature code.

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env          # defaults work offline (mock AI, local storage)
#   set DATABASE_URL to your Postgres, and NEXTAUTH_SECRET (openssl rand -base64 32)

# 3. Database
npm run db:push               # create tables from the Prisma schema
npm run db:seed               # optional: demo account + sample project

# 4. Run
npm run dev                   # http://localhost:3000
```

**Demo login** (after seeding): `demo@reelforge.app` / `password123`

No Postgres handy? Spin one up quickly:

```bash
docker run --name reelforge-db -e POSTGRES_USER=reelforge \
  -e POSTGRES_PASSWORD=reelforge -e POSTGRES_DB=reelforge \
  -p 5432:5432 -d postgres:16
```

## How the workflow runs (with mock AI)

1. **Sign up** → a personal **workspace** + default **brand kit** are created.
2. **New project** → pick a template (Talking-head, Vlog, Business promo, …).
3. **Upload** a video → stored via the storage driver; a `Video` row is created.
4. **Processing** is enqueued. The pipeline (`src/lib/jobs.ts`) runs:
   transcribe → detect silence → suggest clips → generate captions → write
   social copy. The project page polls `/api/projects/[id]/status`.
5. **Review & edit** clips: fix captions, tweak AI titles/hooks/hashtags/CTA.
6. **Export** per platform, or **bulk export** every clip at once (Pro feature).
   The renderer (`src/lib/render.ts`) reframes each clip to the platform's
   aspect ratio and burns in styled captions with ffmpeg; the page shows render
   progress and a download link when each export is ready.

The mock AI produces deterministic, plausible output so this all works offline.
Set `AI_PROVIDER=claude` (with `ANTHROPIC_API_KEY`, and `OPENAI_API_KEY` for
Whisper transcription) to get real AI: Whisper transcribes the audio, and Claude
selects clip boundaries and writes brand-aware titles, hooks, hashtags, and
CTAs. Every model-backed step falls back to the offline heuristics if a key is
missing or a call fails, so processing never hard-fails.

## Environment variables

See [`.env.example`](./.env.example). Highlights:

- `DATABASE_URL` — Postgres connection string (**required**).
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — auth (**required**).
- `AI_PROVIDER` — `mock` (default, no keys) or `openai`.
- `STORAGE_DRIVER` — `local` (default) or `s3`.
- `JOB_DRIVER` — `inline` (default) or `redis`.
- `STRIPE_SECRET_KEY` + `STRIPE_PRICE_*` — enable real checkout. If unset,
  upgrades apply instantly in dev so billing-gated UX stays testable.

## Project structure

```
reelforge/
├── prisma/
│   ├── schema.prisma        # data model (users, workspaces, projects, clips…)
│   └── seed.ts              # demo account + sample project
├── src/
│   ├── app/
│   │   ├── (app)/           # authenticated app (dashboard, projects, brand kit…)
│   │   ├── (auth)/          # login + signup
│   │   ├── api/             # upload, status, files, signup, stripe, nextauth
│   │   ├── onboarding/      # first-run wizard
│   │   ├── page.tsx         # public landing
│   │   └── pricing/         # public pricing page
│   ├── components/          # UI (project editor, brand kit, pricing table…)
│   ├── lib/                 # plans, templates, ai/, storage, jobs, auth, stripe
│   └── server/actions.ts    # server actions (mutations)
└── docs/                    # product + architecture plans, roadmap
```

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start dev server                     |
| `npm run worker`    | Run the BullMQ job worker (needs `JOB_DRIVER=redis` + `REDIS_URL`) |
| `npm run build`     | Generate Prisma client + production build |
| `npm run db:push`   | Sync schema to the database          |
| `npm run db:seed`   | Seed demo data                       |
| `npm run db:studio` | Open Prisma Studio                   |
| `npm run typecheck` | TypeScript check                     |

## Deploying

Deploy the Next.js app anywhere that runs Node (Vercel, Fly, Railway, a
container). For production:

- Point `DATABASE_URL` at managed Postgres (Neon, Supabase, RDS).
- Set `STORAGE_DRIVER=s3` with `S3_BUCKET` + credentials (works with AWS S3,
  Cloudflare R2, or MinIO — set `S3_ENDPOINT` for the latter two).
- Set `JOB_DRIVER=redis` + `REDIS_URL` and run `npm run worker` (BullMQ) — one
  or more worker processes handle AI processing and export rendering off the
  request path.
- Install `ffmpeg` on the worker host (or set `FFMPEG_PATH`) so exports reframe
  to 9:16 and burn in captions. Without it, exports fall back to the source clip.
- Add Stripe keys + a webhook to `/api/stripe/webhook`.
- Set `AI_PROVIDER=claude` with `ANTHROPIC_API_KEY` + `OPENAI_API_KEY`
  (Claude for clips/copy, Whisper for transcription — see `src/lib/ai/`).

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full technical plan
and [`docs/PRODUCT.md`](./docs/PRODUCT.md) for the product spec.
