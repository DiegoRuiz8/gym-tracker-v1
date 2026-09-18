# Lift Log

A mobile-first workout tracker built with React, TypeScript, Zustand, and Vite.

Lift Log helps users manage exercises, exercise variants, and routines, run active workout sessions, review session history, and sync data to the cloud. The app is designed with a clean dark-mode interface and is installable as a Progressive Web App (PWA).

## Features

- Mobile-first responsive UI
- Dark-mode interface with blue accent styling
- Email and Google OAuth authentication
- Cloud data sync with Supabase (per-user, real-time backup)
- Offline-ready — works without internet, syncs when online
- Routine management
- Exercise and exercise variant management
- Active workout session flow
- Session-based workout history
- Prefilled latest performance in active sessions
- Variant swap during active workouts
- Create new variants directly from an active session
- Weight unit toggle (kg / lb)
- JSON import / export
- Downloadable JSON template
- Installable PWA support

## Screenshots

### Home

![Lift Log Home](docs/screenshots/home.png)

### Active Workout

![Lift Log Active Workout](docs/screenshots/active-workout.png)

### Routines

![Lift Log Routines](docs/screenshots/routines.png)

### History

![Lift Log History](docs/screenshots/history.png)

### Import / Export

![Lift Log Import Export](docs/screenshots/import-export.png)

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Zustand
- Supabase (auth + database)
- CSS
- vite-plugin-pwa
- Vercel

## Highlights

- Refactored the app from a legacy workout log model into a session-based workout architecture
- Preserved backward compatibility for legacy JSON imports through migration into workout sessions
- Implemented local-first persistence with Supabase cloud sync and JSON backup/restore support
- Added email and Google OAuth authentication with per-user data isolation via Row Level Security
- Designed around real gym usage, including in-session variant swapping and prefilled latest performance

## Getting Started

### 1. Install dependencies

npm install

### 2. Set up environment variables

Create a `.env.local` file in the root with your Supabase credentials:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

### 3. Start the development server

npm run dev

### 4. Build for production

npm run build

### 5. Preview the production build

npm run preview

## Project Structure

src/
app/
components/
lib/
pages/
store/
styles/
types/
utils/
public/
docs/
screenshots/

## Data Storage

Lift Log uses a local-first architecture. Data is stored in the browser's localStorage for offline access, and automatically synced to Supabase in the background when the user is authenticated and online.

On login, the app pulls the latest data from Supabase. On any change, it pushes updates to Supabase with a 2-second debounce. The app remains fully functional without an internet connection.

Users can also manually export and import their data as JSON for additional backup control.

## Authentication

Lift Log supports:

- Email and password sign up / sign in
- Google OAuth sign in
- Password reset via email
- Per-user data isolation enforced with Supabase Row Level Security (RLS)

## PWA

Lift Log is configured as a Progressive Web App.

It includes:

- Web app manifest
- Service worker
- Installable experience on supported devices
- Offline-ready app shell

## Rest timer push notifications

The rest timer keeps one `active-workout` notification updated while the app is running. When a rest period ends, Supabase sends a Web Push message that replaces that same notification and requests a vibration alert.

To enable the remote alert in production:

1. Generate a VAPID key pair and add the public key to Vercel as `VITE_WEB_PUSH_PUBLIC_KEY`.
2. Apply [202609180001_rest_timer_push.sql](supabase/migrations/202609180001_rest_timer_push.sql) in the Supabase SQL editor.
3. Set these Supabase Edge Function secrets: `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `REST_TIMER_CRON_SECRET`.
4. Deploy `rest-timer-notifications` normally and deploy `deliver-rest-timer-notifications` with JWT verification disabled. The delivery function is protected by `REST_TIMER_CRON_SECRET` instead.
5. Apply [202609180002_active_rest_timer_cron.sql](supabase/migrations/202609180002_active_rest_timer_cron.sql). It creates a five-second cron job only while a rest timer is pending, then removes it when idle.

On iPhone and iPad, LiftLog must be installed to the Home Screen before the user can grant push notification permission.

## Available Scripts

- `npm run dev` — start the local development server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Deployment

This project is deployed with Vercel. Environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) must be configured in the Vercel project settings.
