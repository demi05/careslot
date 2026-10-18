# CareSlot

CareSlot is a web-based health appointment system for hospitals in developing countries, with separate patient and staff portals.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (CareSlot brand palette, Work Sans)
- Supabase (auth, database, backend logic)
- SmartSMSSolutions (SMS notifications)
- Nodemailer (email notifications)

## Getting started

```bash
npm install
cp .env.example .env
# fill in your Supabase / SmartSMSSolutions / SMTP credentials in .env
npm run dev
```

Failed email/SMS deliveries are retried automatically by a scheduled job
(`app/api/cron/retry-notifications`, configured in `vercel.json`) rather
than only on a staff member noticing and clicking retry.

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/` — routes on the Next.js App Router
  - `app/(patient)/` — patient-facing portal (register, login, booking, appointments, pharmacy, profile)
  - `app/(staff)/` — staff portal (dashboard, appointment management, doctor schedules, analytics, notification log)
- `components/ui/` — shared UI primitives (buttons, form fields, alerts, logo)
- `lib/supabase/` — Supabase browser/server clients and session middleware

## Brand

| Token | Value |
| --- | --- |
| Primary (deep teal) | `#1A5C52` |
| Accent (warm orange) | `#E07B39` |
| Background | `#F8F9FA` |
| Body text | `#2D2D2D` |
| Font | Work Sans |
