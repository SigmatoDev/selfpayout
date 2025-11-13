# Flutter mobile app handoff

Milestone 1 focuses on responsive web, but the Flutter POS will reuse API contracts.

## Architecture pointers

- Recommended stack: Flutter 3.x + Riverpod or Bloc, sqflite for offline cache, dio for HTTP.
- Mirror REST endpoints exposed under `/api` for auth, inventory, invoices, and ledger.
- Offline strategy: maintain a queue of unsynced invoices with UUIDs generated client-side.
- Internationalisation: use `intl` package with English + regional language (start with Hindi).

## Screens to scope

1. Login (shop code + password, OTP fallback).
2. Dashboard with daily sales, pending dues, sync status.
3. Billing with barcode scanner integration (mobile camera or external scanner).
4. Customer ledger with settlement workflow.
5. Inventory quick edit (price override, stock count).
6. Settings: GST toggle, receipt sharing (PDF/WhatsApp), basic tax configuration.

## Design alignment

- Follow the visual system defined in web mocks to minimise rework.
- Primary colour palette: blue (#2563EB), green (#22C55E), slate backgrounds.
- Typography: Inter or similar humanist sans-serif.

Document updates once Figma files are available.
