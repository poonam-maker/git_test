# ReelForge — Technical Architecture

## Guiding principle

Ship fast with the **simplest reliable architecture**, but keep every external
dependency (AI, storage, jobs, payments) behind a small interface so the whole
product runs offline today and scales to real providers with no feature-code
changes.

## High-level shape

```
                 ┌─────────────────────────────────────────────┐
   Browser  ──►  │  Next.js 14 (App Router)                     │
                 │   • Server Components (data fetching)         │
                 │   • Server Actions (mutations)               │
                 │   • Route Handlers (upload, status, stripe)  │
                 └───────────────┬─────────────────────────────┘
                                 │  Prisma
                                 ▼
                        ┌──────────────────┐
                        │   PostgreSQL      │
                        └──────────────────┘
        Pluggable drivers (env-selected):
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐
        │ AIProvider   │ │ StorageDriver│ │ Job driver   │ │ Stripe   │
        │ mock│openai  │ │ local│s3     │ │ inline│redis │ │ (opt.)   │
        └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘
```

## Data model (Prisma)

Core entities (`prisma/schema.prisma`):

- **User / Account / Session / VerificationToken** — NextAuth.
- **Workspace** — the tenant. Holds billing (`planTier`, Stripe ids) and usage
  counters. Every user gets a personal workspace on signup.
- **Membership** — user↔workspace with a role (OWNER/ADMIN/EDITOR/VIEWER). This
  is what enables team tiers.
- **Project** — one upload/repurposing job. Has a `templateKey` and optional
  `brandKit`.
- **Video** — the uploaded file (storage key + transcript JSON).
- **ProcessingJob** — one pipeline step, with status/progress for the UI.
- **Clip** — an AI-suggested short segment (start/end/score).
- **Caption** — editable caption lines per clip.
- **SocialPost** — AI-written title/hook/description/hashtags/CTA per clip.
- **Export** — a rendered clip in a target format.
- **BrandKit** — colors, fonts, logo, tone, CTA templates.
- **AnalyticsEvent** — append-only events aggregated on the dashboard.

Design decisions:

- **Billing on the workspace, not the user** — you sell plans/seats to teams.
- **AI outputs are first-class rows** — captions and copy are editable and
  re-exportable, which is the core sellable loop.
- **Team-first from day one** — avoids a painful migration when adding
  Business/Agency tiers.

## Request → processing flow

1. `POST /api/projects/[id]/upload` stores the file via `StorageDriver`, creates
   a `Video`, sets project `QUEUED`, and calls `enqueueProjectProcessing`.
2. **Inline driver** runs `runProjectPipeline` in the background (fire-and-forget)
   so the HTTP response returns immediately.
   **Redis driver** (production) would enqueue to BullMQ; a separate worker runs
   the same `runProjectPipeline`.
3. The pipeline updates `ProcessingJob` rows step by step: transcribe → silence
   → clips → captions → copy, then sets the project `READY`.
4. The project page polls `GET /api/projects/[id]/status` and re-renders when
   `READY`.

## Abstractions (swap without touching features)

| Interface           | File                         | Dev default | Production                         |
| ------------------- | ---------------------------- | ----------- | ---------------------------------- |
| `AIProvider`        | `src/lib/ai/`                | `mock`      | `claude` (Claude + Whisper)        |
| `StorageDriver`     | `src/lib/storage.ts`         | `local`     | S3 / R2 / MinIO                    |
| Job driver          | `src/lib/jobs.ts`            | `inline`    | Redis + BullMQ worker              |
| Payments            | `src/lib/stripe.ts`          | dev upgrade | Stripe Checkout + webhook          |

Each is selected by an env var (`AI_PROVIDER`, `STORAGE_DRIVER`, `JOB_DRIVER`).

## Auth

NextAuth with the **JWT session strategy** (required to combine the Credentials
provider) plus the Prisma adapter backing the Email (magic-link) provider. New
users are provisioned with a workspace + default brand kit via
`provisionNewUser` (called from the signup route and the adapter's `createUser`
event). Route protection is centralized: `(app)/layout.tsx` calls
`requireWorkspace()`, which redirects unauthenticated users to `/login`.

## Payments

`POST /api/stripe/checkout` creates a Checkout session for the chosen tier. With
no Stripe keys, it upgrades the workspace instantly so billing-gated UX is fully
testable in dev. `POST /api/stripe/webhook` keeps `planTier` in sync on
subscription create/update/delete. Plan definitions, limits, and price-env
mapping all live in `src/lib/plans.ts`.

## Security notes

- All mutations re-resolve the caller's workspace and scope every query to it —
  a user can never read or write another workspace's data.
- The local file route authorizes by checking the key belongs to the caller's
  workspace before streaming bytes.
- Passwords are bcrypt-hashed; secrets come only from env.

## Scaling path (in order)

1. Move storage to S3/R2 (`STORAGE_DRIVER=s3`).
2. Move jobs to Redis/BullMQ workers (`JOB_DRIVER=redis`) + real ffmpeg render
   for exports (burn captions, reframe to 9:16).
3. Flip to the real AI provider (`AI_PROVIDER=claude`) — Claude for clip
   selection and copy, Whisper for transcription. Implemented in `src/lib/ai/`
   (`claude-provider.ts`, `transcription.ts`), with heuristic fallbacks.
4. Add Stripe usage-based add-ons and annual plans (toggle already in the UI).
5. Add scheduling/publishing integrations (the "publishing" half of the vision).
