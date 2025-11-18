# Selfcheckout API

TypeScript Express API powering the Selfcheckout SaaS platform. Uses Prisma ORM with PostgreSQL and integrates Razorpay for subscription payments.

## Available scripts

- `pnpm dev` – start development server with hot reload (requires database + env vars)
- `pnpm build` – compile to JavaScript
- `pnpm start` – run compiled build

## Environment variables

Copy `.env.example` to `.env` and populate values.

```ini
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/selfcheckout"
JWT_SECRET="change-me"
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
```

## Domain overview

- **Retailers** – onboarding lifecycle, KYC, subscription link, ability to suspend.
- **Subscriptions** – plan catalogue, assignments, payment tracking.
- **Inventory & Billing** – CRUD for inventory items, invoicing, receipts, sales summary.
- **Customers** – ledger tracking and invoice history.

Each module defines Zod schemas, services (Prisma) and Express controllers/routes for clarity and testability.
