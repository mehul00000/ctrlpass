# CtrlPass — Your World of Cinema

A premium movie, TV series and anime discovery + streaming platform built with Next.js, TypeScript and Tailwind CSS.

- **Discovery** is powered live by the **TMDB API** — trending titles, new releases and every section update automatically (trending every 15 min, lists every 30 min). No hardcoded catalogs.
- **Playback** runs through the **Vidy embed provider** (`vidy.st/movie/{tmdbId}` + `vidy.st/tv/{tmdbId}/{season}/{episode}`) — full features inside CtrlPass, never trailers, never redirects. Admin-configured HLS/MP4 sources override Vidy per title; a `playbackStatus` flag can mark titles unavailable; everything else degrades to an honest "unavailable" state with Retry / Back / Report.
- **Backend** is **Convex** (`convex/`): `users`, `watchlists`, `favorites`, `watchHistory`, `reviews`, `reports` (identity-based, Clerk-secured), `catalogCache` + `syncLogs` + `platformSettings` for the automated sync engine, and `playbackSources` + `playbackStatus` for admin-configured playback. Sync runs on a Convex cron every 6h (`convex/crons.ts`) and on demand (`POST /api/admin/sync`).

### Vidy embed — known limitation: provider popups

Vidy's player monetizes through popunders (an ad tab opens behind the browser when playback starts). **This is provider-side and cannot be disabled:**

- Vidy's documentation defines no flag to turn popups off.
- Sandbox restrictions (e.g. omitting `allow-popups`) make Vidy refuse to play at all — verified: it renders an "Iframe Sandbox Detected" error instead of the player.

**What CtrlPass guarantees:** our own code never opens tabs (`window.open`/`target="_blank"` are absent from app code), Watch Now is a single internal SPA navigation, and exactly one Vidy iframe is mounted per watch page. **For a fully ad-free experience on any title, add its video in Admin → Sources** — admin-configured sources (and the two seeded Creative Commons films) play through CtrlPass's own player with zero provider involvement. Real playback progress for Vidy titles is captured via the documented `PLAYER_EVENT` postMessage and stored in Convex `watchHistory`, so Continue Watching and resume work across providers.

### Convex environment variables (set on the deployment)

Already configured: `CLERK_ISSUER`, `CLERK_JWT_PUBLIC_KEY`, `TMDB_API_KEY`, `ADMIN_EMAILS`. The Clerk JWT template "convex" is created in your Clerk app.

![Stack](https://img.shields.io/badge/Next.js-15-black) ![TS](https://img.shields.io/badge/TypeScript-5-blue) ![TMDB](https://img.shields.io/badge/Powered%20by-TMDB-01b4e4)

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the homepage, Movies, TV, Anime, Genres, Search and every details page are **already live with real TMDB data** using the key in `.env.local`.

## What works out of the box (TMDB only)

| Feature | Status |
| --- | --- |
| Cinematic homepage (hero carousel + 14 auto-populated rows) | ✅ |
| Movies page — trending / in cinemas / top rated / upcoming / latest + genre, year, rating, language filters, infinite scroll | ✅ |
| TV Shows page — trending / popular / airing today + filters | ✅ |
| Anime page — series, movies, top-rated (TMDB genre 16 + Japanese language) | ✅ |
| Genre explorer — every TMDB genre, movies + TV | ✅ |
| Movie & TV details — cast, crew, production info, similar titles, seasons & episodes | ✅ |
| Global search — debounced navbar suggestions, full results, recent searches | ✅ |
| Streaming player — plays **authorized sources**; falls back to the official trailer; resume & continue-watching tracking | ✅ |
| My List / Favorites / Continue Watching / History — persisted locally | ✅ |
| User reviews & ratings | ✅ |
| Admin dashboard UI + protected APIs | ✅ (needs Firebase to store data) |
| Sign in / Sign up | ✅ UI + wiring (needs Clerk keys) |

## Environment

`.env.local` is pre-filled with your TMDB key. Add the optional integrations when ready (copy `.env.example` for the full list):

```bash
# TMDB (already configured)
TMDB_API_KEY=...

# Clerk — enables sign-in/sign-up + protected routes
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Firebase (client) — enables cloud sync for My List / history / reviews
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ...

# Firebase Admin (server) — enables admin dashboard data
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Emails that become admins (comma separated)
ADMIN_EMAILS=you@example.com
```

Everything degrades gracefully: no Clerk → auth pages show exact setup instructions and user data persists to localStorage. No Firebase → admin page shows connection status while TMDB discovery keeps working.

## Enabling full platform features

1. **Clerk** — create an app at [dashboard.clerk.com](https://dashboard.clerk.com), paste both keys into `.env.local`, restart. Sign-in/up, protected routes and Google login turn on. Users are mirrored into Firestore's `users` collection on first sign-in.
2. **Firebase** — create a project, add a Web app (client keys) and a service account (Admin keys). Deploy the included rules/indexes:
   ```bash
   npx firebase-tools deploy --only firestore:rules,firestore:indexes
   ```
3. **Admin** — put your email in `ADMIN_EMAILS` (or set `role: "admin"` on your `users` doc), then visit `/admin`.
4. **Authorized playback** — in `/admin → Sources`, add an `https` MP4/HLS URL for any TMDB title you have rights to stream. That title's Play button switches from trailer to full-feature playback, with resume tracking, quality/subtitle selection and optional downloads (`downloadEnabled`).

## Architecture

```
src/
├── app/
│   ├── page.tsx                  # Homepage (SSR + TMDB data cache)
│   ├── movies/ tv/ anime/        # Discovery (tabs, filters, infinite scroll)
│   ├── genres/ genres/[id]/      # Genre explorer
│   ├── movie/[id]/ tv/[id]/      # Details (cast, seasons, reviews)
│   ├── watch/[type]/[id]/        # Player: authorized source → trailer → notice
│   ├── search/ my-list/ history/ profile/ sign-in/ sign-up/ admin/
│   └── api/                      # movies, tv, discover, search, genres,
│                                 # playback, admin/*, user/sync (role-checked)
├── components/                   # Navbar, HeroBanner, MediaCard/Row, player…
└── lib/
    ├── tmdb.ts                   # Server-only TMDB client (Next data cache)
    ├── persistence.ts            # Firestore ⇄ localStorage user data layer
    ├── firebase-admin.ts         # Privileged server SDK (guarded)
    ├── auth-guard.ts             # Server-side admin/session validation
    └── playback.ts               # Authorized source resolution
```

**Security notes:** the TMDB key, Firebase Admin credentials and all privileged reads never reach the browser. Admin APIs re-verify the Clerk session and role on every request. TMDB presence never grants streaming rights — playback only happens through active admin-configured sources.

## Scripts

```bash
npm run dev        # development
npm run build      # production build
npm start          # production server
npm run typecheck  # strict TS check
```

## Deployment (Vercel)

1. Push the repo and import it in Vercel.
2. Add every variable from `.env.example` in Project Settings → Environment Variables.
3. Deploy. `NEXT_PUBLIC_APP_URL` should be your production URL.

---

This product uses the TMDB API but is not endorsed or certified by TMDB.
