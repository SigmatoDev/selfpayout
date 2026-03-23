-- CreateEnum
CREATE TYPE "RawMaterialLedgerType" AS ENUM ('PURCHASE', 'CONSUMPTION', 'WASTAGE', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "CounterOrderItem" ADD COLUMN     "consumedQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SelfCheckoutItem" ADD COLUMN     "consumedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RawMaterial" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemRecipeItem" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItemRecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterialLedgerEntry" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "type" "RawMaterialLedgerType" NOT NULL,
    "quantityDelta" DOUBLE PRECISION NOT NULL,
    "previousStock" DOUBLE PRECISION NOT NULL,
    "currentStock" DOUBLE PRECISION NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawMaterialLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RawMaterial_retailerId_idx" ON "RawMaterial"("retailerId");

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterial_retailerId_name_key" ON "RawMaterial"("retailerId", "name");

-- CreateIndex
CREATE INDEX "MenuItemRecipeItem_rawMaterialId_idx" ON "MenuItemRecipeItem"("rawMaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemRecipeItem_menuItemId_rawMaterialId_key" ON "MenuItemRecipeItem"("menuItemId", "rawMaterialId");

-- CreateIndex
CREATE INDEX "RawMaterialLedgerEntry_retailerId_createdAt_idx" ON "RawMaterialLedgerEntry"("retailerId", "createdAt");

-- CreateIndex
CREATE INDEX "RawMaterialLedgerEntry_rawMaterialId_createdAt_idx" ON "RawMaterialLedgerEntry"("rawMaterialId", "createdAt");

-- AddForeignKey
ALTER TABLE "RawMaterial" ADD CONSTRAINT "RawMaterial_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemRecipeItem" ADD CONSTRAINT "MenuItemRecipeItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemRecipeItem" ADD CONSTRAINT "MenuItemRecipeItem_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterialLedgerEntry" ADD CONSTRAINT "RawMaterialLedgerEntry_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterialLedgerEntry" ADD CONSTRAINT "RawMaterialLedgerEntry_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
