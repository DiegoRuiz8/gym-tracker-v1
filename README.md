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

## Available Scripts

- `npm run dev` — start the local development server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Deployment

This project is deployed with Vercel. Environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) must be configured in the Vercel project settings.