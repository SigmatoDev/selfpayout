# Patent-Ready Artifacts (Selfcheckout Platform)

This document translates the implementation into patent-style figures, reference numerals, and structured descriptions.

## FIG. 1 — System Block Diagram (Diagrammatic)

```
                          ┌───────────────────────────────┐
                          │ 106 Super Admin Console       │
                          │ (Super-admin web app)          │
                          └──────────────┬────────────────┘
                                         │
                                         │
┌───────────────────────────────┐        │        ┌───────────────────────────────┐
│ 102 Customer Device           │        │        │ 104 Retailer Device           │
│ (User self-checkout web app)  │        │        │ (Retailer web/mobile POS)     │
└──────────────┬────────────────┘        │        └──────────────┬────────────────┘
               │                         │                         │
               └──────────────┬──────────┴───────────┬─────────────┘
                              │      108 Network     │
                              └──────────┬───────────┘
                                         │
                          ┌──────────────┴──────────────┐
                          │ 110 API Server              │
                          │ 112 Auth Service            │
                          │ 114 Self-Checkout Service   │
                          │ 116 Inventory Service       │
                          │ 118 Customer Ledger Service │
                          │ 120 Receipt/Invoice Service │
                          │ 122 Subscription/KYC        │
                          │ 124 Payment Integration     │
                          │ 126 Reporting/Admin         │
                          │ 128 Storage Service         │
                          └───────┬─────────┬───────────┘
                                  │         │
                   ┌──────────────┘         └──────────────┐
                   │                                       │
        ┌──────────┴──────────┐                 ┌──────────┴──────────┐
        │ 130 Data Store       │                 │ 132 Object Storage  │
        │ (PostgreSQL/Prisma)  │                 │ (S3 or local)        │
        └──────────────────────┘                 └─────────────────────┘
                                  │
                                  │
                          ┌───────┴─────────┐
                          │ 134 Payment     │
                          │ Gateway         │
                          │ (Razorpay)      │
                          └─────────────────┘

Additional local subsystems:
 - 136 Offline Queue Store (retailer device local storage)
 - 138 Scanner/Camera (QR/barcode capture on customer/retailer device)
 - 140 Menu Service (restaurant menu endpoints)
```

## FIG. 1 — Reference Numerals

- 100 Selfcheckout platform (overall system)
- 102 Customer device (user self-checkout web client)
- 104 Retailer device (retailer web POS / mobile POS)
- 106 Super admin console (admin web client)
- 108 Network (HTTPS/IP network)
- 110 API server (Express backend)
- 112 Auth service (JWT auth and role guards)
- 114 Self-checkout session service (session lifecycle, security codes)
- 116 Inventory service (SKU lookup, price/tax resolution)
- 118 Customer ledger service (dues, settlements)
- 120 Receipt/invoice service (invoice creation, receipts)
- 122 Subscription/KYC service (onboarding, compliance)
- 124 Payment integration service (Razorpay link/webhook/refund)
- 126 Reporting/admin service (sales/reports)
- 128 Storage service (file uploads to S3/local)
- 130 Data store (PostgreSQL via Prisma ORM)
- 132 Object storage (S3 or local storage path)
- 134 Payment gateway (Razorpay)
- 136 Offline queue store (client-side offline invoice queue)
- 138 Scanner/camera subsystem (QR/barcode capture)
- 140 Menu service (restaurant menu retrieval)

## Component-wise Description (Linked to Numerals)

| Component name | Numeral | Location in system | Connections | Technical function |
| --- | --- | --- | --- | --- |
| Selfcheckout platform | 100 | System boundary | 102, 104, 106, 108, 110, 130, 132, 134 | End-to-end self-checkout and POS ecosystem across clients and backend. |
| Customer device | 102 | Client side | 108, 110, 138 | Runs customer self-checkout UI to start sessions, scan items, submit checkout. |
| Retailer device | 104 | Client side | 108, 110, 136, 138 | Runs retailer POS for billing, payment marking, and offline queuing. |
| Super admin console | 106 | Client side | 108, 110 | Admin UI for onboarding, KYC, subscriptions, and oversight. |
| Network | 108 | Communications layer | 102, 104, 106, 110 | Transports HTTPS requests/responses between clients and backend. |
| API server | 110 | Server side | 108, 112–128, 130, 132, 134 | Hosts REST API and coordinates service modules. |
| Auth service | 112 | Server side | 110, 130 | Validates credentials, issues JWTs, enforces role guards. |
| Self-checkout service | 114 | Server side | 110, 116, 120, 130 | Creates and manages sessions, totals, and security codes. |
| Inventory service | 116 | Server side | 110, 130 | Resolves SKU to price/tax; provides item metadata. |
| Customer ledger service | 118 | Server side | 110, 130 | Tracks customer balances and settlement states. |
| Receipt/invoice service | 120 | Server side | 110, 130 | Generates invoice entities and receipt records. |
| Subscription/KYC service | 122 | Server side | 110, 130, 134 | Manages retailer onboarding and compliance data. |
| Payment integration | 124 | Server side | 110, 134 | Creates payment links, handles webhooks/refunds. |
| Reporting/admin service | 126 | Server side | 110, 130 | Aggregates sales and reporting data for dashboards. |
| Storage service | 128 | Server side | 110, 132, 130 | Stores/retrieves uploaded files (S3 or local). |
| Data store | 130 | Server side | 110, 112–126 | Persists retailers, sessions, items, invoices, and KYC data. |
| Object storage | 132 | Server side | 128 | Stores binary assets (documents, receipts). |
| Payment gateway | 134 | External service | 124 | Processes payment links, webhooks, and refunds. |
| Offline queue store | 136 | Client side | 104 | Buffers invoices locally until connectivity returns. |
| Scanner/camera | 138 | Client side | 102, 104 | Captures QR codes or barcodes for session/items. |
| Menu service | 140 | Server side | 110, 130 | Serves restaurant menu data to customer sessions. |

## FIG. 2 — Operational Workflow (Self-Checkout Session Flow)

```
 [200 Start] 
     |
 [202 Validate retailer/context] 
     |
 [204 Create session + security code]
     |
 [206 Scan/enter item SKU]
     |
 [208 Lookup inventory price/tax]
     |
 [210 Update session items + totals]
     |
 [212 More items?] -- yes --> [206 Scan/enter item SKU]
     |
     no
     |
 [214 Submit session]
     |
 [216 Retailer marks payment mode]
     |
 [218 Create invoice + totals]
     |
 [220 Update session status = PAID]
     |
 [222 Verify security code at exit]
     |
 [224 Update session status = APPROVED]
     |
 [226 End]
```

## FIG. 2 — Flow Step Numerals

- 200 Start self-checkout session request received from client.
- 202 Validate retailer identity, store type, and required context.
- 204 Create session record and security code.
- 206 Capture SKU via barcode/QR scan or manual entry.
- 208 Resolve SKU to inventory item pricing and tax values.
- 210 Update session items and recompute totals.
- 212 Decision: additional items to add/remove.
- 214 Submit session for payment.
- 216 Retailer staff confirms payment mode and marks payment.
- 218 Create invoice and persist invoice line items.
- 220 Update session status to PAID.
- 222 Verify customer’s security code at exit or counter.
- 224 Update session status to APPROVED (completed).
- 226 End of transaction.
