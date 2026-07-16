# LeadPilot — Lead Dashboard

A clean, self-contained **lead dashboard** for a local service business — one screen
to see and manage every lead coming in from calls, texts, web forms, Facebook/Instagram,
Google, and web chat.

Built around the "never miss a lead" idea, with three things front and center:

1. **Missed-Call Text-Back** — the instant a call goes unanswered, a text goes out so the
   caller never waits (or dials a competitor).
2. **Unified Lead Inbox** — every channel in one thread the whole team can see.
3. **AI Receptionist** — an AI answers calls and web chats 24/7, qualifies the lead, and
   books the appointment.

## Running it

No build step, no dependencies. Open `index.html` in a browser, or serve the folder
statically (e.g. `python3 -m http.server`). State persists in `localStorage`.

| File | Purpose |
|------|---------|
| `index.html` | The dashboard |
| `app.css` | All styles (design tokens + reset + dashboard) |
| `app.js` | Dashboard logic: state, seed data, all views |

## Views

- **Dashboard** — KPIs (leads today, calls recovered, response time, revenue recovered),
  a live activity feed, and a lead-source breakdown.
- **Inbox** — unified conversation list + thread view with two-way replies.
- **Missed Calls** — every missed call and the auto-text that recovered it.
- **AI Receptionist** — transcripts of AI-handled conversations, with an on/off toggle.
- **Contacts** — searchable table of every lead.
- **Settings** — business profile, auto-text template, connected channels.

## Demo controls

Click **"Simulate incoming lead"** in the top bar to drop a new lead into the system in
real time — a missed call gets texted back, the AI books an appointment, or a Facebook lead
lands in the inbox, with a toast notification. Use **Settings → Reset demo data** to start
fresh.

This is a front-end dashboard with sample data; the channels and AI aren't wired to a
backend yet.
