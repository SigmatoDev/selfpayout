/*
  Warnings:

  - A unique constraint covering the columns `[retailerCode]` on the table `Retailer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Retailer" ADD COLUMN     "retailerCode" TEXT;

-- AlterTable
ALTER TABLE "SelfCheckoutSession" ADD COLUMN     "customerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_retailerCode_key" ON "Retailer"("retailerCode");

-- CreateIndex
CREATE INDEX "SelfCheckoutSession_customerId_idx" ON "SelfCheckoutSession"("customerId");

-- AddForeignKey
ALTER TABLE "SelfCheckoutSession" ADD CONSTRAINT "SelfCheckoutSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
