# ReelForge — Product Plan

## Vision

AI-powered video **repurposing and publishing** for creators and small
businesses. Not a generic pro editor — a fast, simple, sellable product that
turns one raw recording into multiple publish-ready social assets.

Positioning: **"AI repurposing and publishing for creators and small
businesses."**

Unique angle:

- One upload becomes a week of content.
- The system understands the creator/business brand.
- Outputs are ready to post, not just edited.
- Saves time and increases posting volume.

## Target users

- **Creators**: talking-head creators, vloggers, educators, coaches, podcast
  clip creators.
- **Small businesses**: local/service businesses, agencies, founders, marketing
  teams, ecommerce brands.

## Core value proposition

1. Turn one long video into multiple short clips.
2. Auto-remove silence, filler, and awkward pauses.
3. Auto-generate captions with clean, social-friendly styling.
4. Auto-create titles, hooks, descriptions, hashtags, CTAs.
5. Apply brand templates for consistency.
6. Export in formats optimized for TikTok, Reels, Shorts, and standard vertical.

## The main workflow (optimize for speed to value)

```
Upload  →  Process  →  Review  →  Edit  →  Export
```

Every screen pushes the user toward the next step. The dashboard's primary
action is always "New project."

## Business model

Subscription tiers, each justified by **sellable, recurring-value features**:

| Tier               | Price/mo | Who it's for                     | Headline unlocks                              |
| ------------------ | -------- | -------------------------------- | --------------------------------------------- |
| Free               | $0       | Trial                            | Full workflow, watermark, tight limits        |
| **Solo Creator**   | $19      | Consistent solo creators         | No watermark, brand kit, all export formats   |
| **Creator Pro**    | $39      | Serious creators (most popular)  | Bulk export, repurposing automation, multi-video |
| **Small Business** | $89      | Teams keeping a brand consistent | Team seats, 10 brand kits, scheduling bundles |
| **Agency**         | $249     | Multi-brand at scale             | Unlimited, 20 seats, 50 brand kits            |

Feature → revenue mapping (why each exists):

- **Brand kits** → consistency = retention; more kits = higher tiers.
- **Team workspaces / seats** → expands ACV for business/agency.
- **Bulk export & export bundles** → time-saving, clear upgrade trigger.
- **Repurposing automation & multi-video** → volume = habitual usage.
- **Reusable templates** → faster time-to-value, stickiness.

Limits (projects/exports/seats/brand kits per plan) live in `src/lib/plans.ts`
and are enforced in `src/lib/limits.ts`. Hitting a limit is the natural,
in-context upgrade prompt.

## MVP feature checklist

| # | Feature                    | Status in this build                                            |
| - | -------------------------- | --------------------------------------------------------------- |
| 1 | Authentication + dashboard | ✅ Email/password + magic link, dashboard, onboarding wizard    |
| 2 | Project workflow           | ✅ Create, upload, processing status, project history            |
| 3 | AI video processing        | ✅ Transcript, silence detection, clip suggestion, captions (mock)|
| 4 | Caption tools              | ✅ Editable captions, styles, placement presets, export           |
| 5 | Social post generation     | ✅ Title/hook/description/hashtags/CTA, editable before export     |
| 6 | Brand kit                  | ✅ Name, logo, colors, fonts, tone, CTA templates, presets        |
| 7 | Export system              | ✅ TikTok/Reels/Shorts/Vertical/Square + bulk export              |
| 8 | Creator/business templates | ✅ Talking-head, Vlog, Business promo, Testimonial, Educational   |
| 9 | Analytics                  | ✅ Projects, exports, most-used templates, content per month      |
| 10| Pricing page               | ✅ Public landing + pricing tiers + comparison + CTAs             |

## Product principles applied

- **Speed to value** — mock AI runs the full pipeline instantly; demo seed data.
- **Obvious main workflow** — sidebar + dashboard funnel to Upload→Export.
- **No feature bloat** — no timeline scrubber, keyframes, or pro-editor surface.
- **Sellable over flashy** — brand kits, bulk export, seats prioritized.
- **Solo *and* team** — workspace/membership model from day one.
- **Every core feature supports recurring revenue** — see mapping above.
