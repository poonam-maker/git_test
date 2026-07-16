# LeadPilot — Never Miss a Lead

LeadPilot is an all-in-one **lead capture platform for local service businesses** —
the kind of software you can sell to an HVAC shop, a plumber, a roofer, or a med spa
on a monthly subscription.

It turns the classic "never miss a lead" promise into a product built around three pillars:

1. **Missed-Call Text-Back** — the instant a call goes unanswered, LeadPilot fires off a
   friendly text so the customer never waits (or dials a competitor).
2. **Unified Lead Inbox** — calls, SMS, web forms, Facebook/Instagram, Google, and web chat
   all land in one thread the whole team can see.
3. **AI Receptionist** — an AI answers calls and web chats 24/7, qualifies the lead, and
   books the appointment automatically.

## What's in this repo

This is a self-contained, front-end product built with plain HTML / CSS / JS — no build step,
no dependencies to install. Open `index.html` in a browser (or serve the folder statically).

| File | Purpose |
|------|---------|
| `index.html` | Marketing site — hero, features, product preview, pricing tiers, trial signup |
| `login.html` | Log in / sign up flow (with plan selection) |
| `app.html` | The product itself — a fully clickable dashboard |
| `app.js` | App logic: state, seed data, all views, live "simulate lead" demo |
| `app.css` | Styles for the auth page and the dashboard |
| `style.css` | Marketing-site styles (shared design system) |
| `main.js` | Marketing-site interactions (hero spotlight, scroll reveals, counters) |

## The live demo

`app.html` is a working single-page app backed by `localStorage`:

- **Dashboard** — KPIs (leads today, calls recovered, response time, revenue recovered),
  a live activity feed, and a lead-source breakdown.
- **Inbox** — unified conversation list + thread view with two-way replies.
- **Missed Calls** — every missed call and the auto-text that recovered it.
- **AI Receptionist** — transcripts of AI-handled conversations, with an on/off toggle.
- **Contacts** — searchable table of every lead.
- **Settings** — business profile, auto-text template, connected channels.

Click **"Simulate incoming lead"** in the top bar to watch a new lead flow through the
system in real time — a missed call gets texted back, the AI books an appointment, or a
Facebook lead lands in the inbox, complete with a toast notification.

Use **Settings → Reset demo data** to start fresh at any time.

## Selling it

The marketing site is written to sell: a problem section that mirrors what business owners
actually say, three clearly-scoped features, a real product preview, and three pricing tiers
(Starter $49 / Growth $129 / Pro $299) with a 14-day free trial. Swap in your own branding,
wire the forms and channels to a backend, and it's ready to take to market.
