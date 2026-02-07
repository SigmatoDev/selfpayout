-- AlterTable
ALTER TABLE "SelfCheckoutSession" ADD COLUMN     "guestCount" INTEGER,
ADD COLUMN     "preferredPaymentMode" "PaymentMode",
ADD COLUMN     "serviceChargePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tableNumber" TEXT;

-- CreateTable
CREATE TABLE "RestaurantTable" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "taxPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "isVeg" BOOLEAN,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuAddOnGroup" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min" INTEGER NOT NULL DEFAULT 0,
    "max" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuAddOnGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuAddOnOption" (
    "id" TEXT NOT NULL,
    "addOnGroupId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuAddOnOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenTicket" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitchenTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_retailerId_label_key" ON "RestaurantTable"("retailerId", "label");

-- CreateIndex
CREATE INDEX "MenuCategory_retailerId_idx" ON "MenuCategory"("retailerId");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

-- CreateIndex
CREATE INDEX "MenuItem_retailerId_idx" ON "MenuItem"("retailerId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_retailerId_sku_key" ON "MenuItem"("retailerId", "sku");

-- CreateIndex
CREATE INDEX "KitchenTicket_retailerId_idx" ON "KitchenTicket"("retailerId");

-- CreateIndex
CREATE UNIQUE INDEX "KitchenTicket_sessionId_key" ON "KitchenTicket"("sessionId");

-- CreateIndex
CREATE INDEX "SelfCheckoutSession_retailerId_tableNumber_idx" ON "SelfCheckoutSession"("retailerId", "tableNumber");

-- AddForeignKey
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuAddOnGroup" ADD CONSTRAINT "MenuAddOnGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuAddOnOption" ADD CONSTRAINT "MenuAddOnOption_addOnGroupId_fkey" FOREIGN KEY ("addOnGroupId") REFERENCES "MenuAddOnGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SelfCheckoutSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
