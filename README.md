# Selfcheckout Monorepo

Milestone 1 scaffolding for the Selfcheckout SaaS platform. The workspace is structured as a pnpm monorepo hosting the core API, the super admin control panel, and the retailer-facing responsive web POS.

## Apps

- `apps/api` – TypeScript Express API with Prisma (PostgreSQL) and Razorpay integration points.
- `apps/super-admin` – Next.js 14 app router UI for onboarding, subscriptions, and KYC dashboards.
- `apps/retailer-web` – Mobile-first Next.js app for billing, inventory, and customer ledgers.
- `retailer-mobile` – Flutter workspace app mirroring the retailer web experience on iOS/Android.

Shared utilities and configuration live under `packages/`.

## Getting started

```bash
pnpm install
pnpm dev:api   # API at http://localhost:4000
pnpm dev:super-admin   # Super admin UI at http://localhost:3000
pnpm dev:retailer-web  # Retailer web app at http://localhost:3001 (configure port via .env.local)
```

### Retailer mobile (Flutter)

```bash
cd retailer-mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:4000/api
```

Use `--dart-define` to point the app at any deployed API base URL. The mobile client stores auth tokens offline, mirrors offline invoice queuing, and exposes billing, inventory, customers, reports, and self-checkout flows.

### Environment variables

Copy `.env.example` to `.env` and fill in real credentials. Frontend apps read `NEXT_PUBLIC_API_BASE_URL` to connect to the API.

### Database

Generate the Prisma client with:

```bash
pnpm --filter api prisma generate
```

Run migrations once schema is finalized:

```bash
pnpm --filter api prisma migrate dev --name init
```

## Milestone 1 scope recap

- Super admin onboarding pipeline (retailers, KYC, subscriptions, payments).
- Retailer POS: billing, receipts, customer ledger, inventory, offline-ready flows.
- Design-first approach – placeholder component layouts mirror the intended UX.

See `docs/` for product notes and design guidelines.
