# ReelForge — Roadmap

The MVP in this repo covers the full workflow with mock AI. Post-MVP, in
priority order (revenue and stickiness first):

## Next up (make it real)

- [x] **Real AI provider** — Claude for clip selection + brand-aware copy, Whisper
      for transcription (`AI_PROVIDER=claude`), with heuristic fallbacks.
- [x] **Real export render** — ffmpeg: cut clip, reframe to 9:16 / 1:1, burn in
      styled captions, watermark free plans (`src/lib/render.ts`).
- [x] **Redis/BullMQ jobs** — durable queue + separate worker (`npm run worker`),
      retries with backoff (`src/lib/queue.ts`, `src/worker.ts`).
- [x] **S3/R2 storage** — `S3StorageDriver` for AWS S3 / Cloudflare R2 / MinIO
      (`STORAGE_DRIVER=s3`), lazy-loaded, access still gated via `/api/files`.
- [x] **Audio extraction for long uploads** — ffmpeg pre-extracts mono 16kHz
      audio before Whisper, lifting the 25MB cap to ~50 min of video.
- [ ] **Presigned direct upload/download** — browser ↔ S3 directly (presigned
      PUT/GET) so large files skip the app server.
- [ ] **Audio chunking** — split >50 min audio into windows for Whisper.

## Sellable growth features

- [ ] **Scheduling & publishing** — connect TikTok/IG/YouTube, schedule the
      exported bundle (delivers the "publishing" half of the vision).
- [ ] **Team invites & roles UI** — surface the existing membership model.
- [ ] **Repurposing automation** — auto-generate a posting calendar from one
      upload; recurring "content packs."
- [ ] **Multi-video workflows** — batch upload, cross-video best-of reels.
- [ ] **Brand-kit A/B** — multiple kits per project, per-platform variants.

## Polish & trust

- [ ] Usage-based billing add-ons; annual billing wired to Stripe.
- [ ] Email notifications when processing finishes.
- [ ] Per-workspace monthly usage reset job.
- [ ] Analytics: retention, exports-by-day, funnel from upload → export.
- [ ] E2E tests (Playwright) for the upload→export happy path.
