# Shabbat Apartment Program Tracker

A web app for running a Shabbat apartment program. Participants log the Shabbat meals they host or attend and the Torah learning they complete each month. Admins review progress, manage Shabbatons and weekly RSVPs, enter data on a participant's behalf, and track payment status.

Built with React, TypeScript, Vite and Tailwind, on a Supabase backend (Postgres, Auth and Row Level Security).

## What it does

**Participants**
- Sign up and log in with email and password.
- Log meals and learning sessions (1–360 minutes each).
- See monthly progress toward the requirements, defaulting to 4 meals and 720 minutes of learning.
- RSVP for the weekly UWS Shabbat.

**Admins**
- Participant list with per-participant learning details.
- Manage Shabbatons and confirm or deny attendance, which grants default credits (3 meals, 180 minutes).
- View and manage the weekly UWS RSVPs.
- Enter logs manually on a participant's behalf (soft-deleted entries keep a reason and who deleted them).
- Reports, and monthly payment status (Not due, Due, Paid). The payment date is computed as the first day of the month plus two months.

## Data model

Seven Postgres tables, defined in [`supabase-schema.sql`](supabase-schema.sql): `users`, `month_logs`, `meal_logs`, `learning_sessions`, `shabbatons`, `attendances` and `uws_rsvps`. Row Level Security limits participants to their own rows and gives admins access to all of them. The matching TypeScript types are in [`src/types/index.ts`](src/types/index.ts).

## Project layout

```
src/
  components/
    participant/   dashboard, meal and learning logging, RSVP widget
    admin/         dashboard, participants, Shabbatons, UWS RSVPs, reports, manual entry
  contexts/        auth state (Supabase Auth)
  services/        Supabase data access
  lib/             Supabase client
  types/           shared types
supabase-schema.sql    database schema
scripts/sql/           one-off debugging, fix and migration SQL written during development
BACKEND_SETUP.md       step-by-step Supabase setup
```

## Running it locally

1. Create a Supabase project and run `supabase-schema.sql` in the SQL editor. [`BACKEND_SETUP.md`](BACKEND_SETUP.md) walks through this, including auth settings.
2. Create `.env.local` with your project's URL and anon key:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Install and start:
   ```bash
   npm install
   npm run dev
   ```
   The app runs at `http://localhost:5173`.

To make a user an admin, use [`scripts/sql/create-admin-user.sql`](scripts/sql/create-admin-user.sql) as a template.

## Deployment

A Netlify config is included (`netlify.toml`): the build command is `npm run build` and the publish directory is `dist`. The two `VITE_SUPABASE_*` values are public client-side keys, so they are allowed through Netlify's secrets scan. Set them in the Netlify dashboard.

## Notes

- `scripts/sql/` holds SQL I wrote while debugging row-level security and constraints. It is kept as a record, not as part of setup. Most of it is not safe to re-run on a live database, so read a file before running it.
- Status: working app, built September 2025. No automated tests.
