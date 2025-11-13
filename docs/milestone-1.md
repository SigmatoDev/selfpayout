# Milestone 1 blueprint

## Objectives

- Digitise onboarding for Kirana and neighbourhood stores with verification, subscriptions, and payments.
- Deliver a mobile-first POS covering billing, inventory control, and customer receipts.
- Establish baseline analytics dashboards for admins and retailers.

## Deliverables

1. **Super Admin control center**
   - Retailer CRM: onboarding, KYC tracking, suspend/disable actions.
   - Subscription catalogue and Razorpay payment link issuance.
   - Dashboard showing active shops, revenue run-rate, pending verifications.

2. **Retailer workspace (mobile web)**
   - Authenticated billing flow with scanning, quick checkout, multi-payment support.
   - Customer ledger for dues and settlements.
   - Inventory management with SKU search and CSV bulk upload.
   - Offline capture with later sync (queue abstraction TBD).
   - Localisation: English + regional language (Hindi placeholder included).

3. **API platform**
   - Prisma-backed data models for retailers, subscriptions, inventory, invoices.
   - JWT-based auth, role guards, Razorpay integration hooks.
   - Modular service layout with Zod validation for all routes.

## UX baseline

- Figma exploration should align with the component structure in `apps/super-admin` and `apps/retailer-web`.
- Navigation patterns: sidebar for admin, bottom nav for retailer mobile.
- Colour strategy: admin (light, professional), retailer (high-contrast dark mode for readability on phones).

## Next steps

- Wire real API calls into the frontends with React Query.
- Implement authentication and session management.
- Design offline data store (IndexedDB) with sync triggers.
- Finalise Razorpay webhook signature validation and invoicing templates.
