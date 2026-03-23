ALTER TABLE "SelfCheckoutSession" ADD COLUMN "kotNumber" TEXT;
ALTER TABLE "CounterOrder" ADD COLUMN "kotNumber" TEXT;

CREATE INDEX "SelfCheckoutSession_retailerId_kotNumber_idx"
  ON "SelfCheckoutSession"("retailerId", "kotNumber");

CREATE INDEX "CounterOrder_retailerId_kotNumber_idx"
  ON "CounterOrder"("retailerId", "kotNumber");
