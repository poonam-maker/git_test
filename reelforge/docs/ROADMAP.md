# ReelForge — Roadmap

The MVP in this repo covers the full workflow with mock AI. Post-MVP, in
priority order (revenue and stickiness first):

## Next up (make it real)

- [ ] **Real AI provider** — Whisper transcription + LLM copy (`AI_PROVIDER=openai`).
- [ ] **Real export render** — ffmpeg worker: cut clip, reframe to 9:16, burn
      captions in the selected style, apply brand kit.
- [ ] **S3/R2 storage** — implement `S3StorageDriver`, presigned direct uploads
      for large files.
- [ ] **Redis/BullMQ jobs** — durable queue + separate worker; retries.

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
