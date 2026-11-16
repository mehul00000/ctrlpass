# CtrlPass Monorepo

CtrlPass is an enterprise event ticketing, gate access verification, and organizer management platform.

## Architecture

The project is structured as a monorepo:

```text
CtrlPass/
├── apps/
│   ├── mobile/         # React Native 0.88 app (Attendee discovery/ticketing + Volunteer gate scanner)
│   └── web/            # Next.js 14 App Router dashboard (Organizer portal + Admin command center)
├── packages/
│   ├── types/          # Shared TypeScript domain models & DTOs
│   ├── ui/             # Shared styling tokens & UI primitives
│   └── config/         # Shared configurations & constants
├── supabase/
│   ├── migrations/     # PostgreSQL DDL, tables, RLS policies, indexes, and triggers
│   ├── functions/      # Supabase Edge Functions (Cashfree webhook, check-in, reservations)
│   └── seed/           # Development database seeds
├── docs/               # Architecture, API, and workflow documentation
└── scripts/            # Build, test, and maintenance scripts
```

## Quick Start

### Prerequisites
- Node.js >= 20.x
- npm or pnpm
- Android Studio / Android SDK (for mobile development)

### Install Dependencies
```bash
npm install
```

### Run Web Application (Organizer & Admin Dashboard)
```bash
npm run web:dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

### Run Mobile Application (Attendee & Volunteer Gate Scanner)
```bash
npm run mobile:android
# or start Metro bundler:
npm run mobile:start
```

## Production Builds

### Web (Next.js)
```bash
npm run web:build
```

### TypeScript Validation
```bash
npm run typecheck:web
npm run typecheck:mobile
```
