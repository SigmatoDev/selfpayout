ALTER TABLE "RetailerSettings"
ADD COLUMN "selfBillingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "marketplaceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "ticketingEnabled" BOOLEAN NOT NULL DEFAULT true;
