-- Add ordering settings to retailer settings
ALTER TABLE "RetailerSettings" ADD COLUMN "tableOrderingEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "RetailerSettings" ADD COLUMN "deliveryOrderingEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "RetailerSettings" ADD COLUMN "tokenOrderingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Add menu item image url
ALTER TABLE "MenuItem" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "MenuItem" ADD COLUMN "subCategoryId" TEXT;

-- Add fulfillment tracking to self-checkout sessions
ALTER TABLE "SelfCheckoutSession" ADD COLUMN "fulfilledAt" TIMESTAMP(3);

-- Add menu type to categories
ALTER TABLE "MenuCategory" ADD COLUMN "menuTypeId" TEXT;

-- Create restaurant table groups
CREATE TABLE "RestaurantTableGroup" (
  "id" TEXT NOT NULL,
  "retailerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RestaurantTableGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "retailerId_tableGroup" ON "RestaurantTableGroup"("retailerId", "name");
CREATE INDEX "RestaurantTableGroup_retailerId_idx" ON "RestaurantTableGroup"("retailerId");

ALTER TABLE "RestaurantTableGroup"
  ADD CONSTRAINT "RestaurantTableGroup_retailerId_fkey"
  FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create restaurant tokens
CREATE TABLE "RestaurantToken" (
  "id" TEXT NOT NULL,
  "retailerId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RestaurantToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "retailerId_tokenLabel" ON "RestaurantToken"("retailerId", "label");
CREATE INDEX "RestaurantToken_retailerId_idx" ON "RestaurantToken"("retailerId");

ALTER TABLE "RestaurantToken"
  ADD CONSTRAINT "RestaurantToken_retailerId_fkey"
  FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Counter order fulfillment and table binding
ALTER TABLE "CounterOrder" ADD COLUMN "tableNumber" TEXT;
ALTER TABLE "CounterOrder" ADD COLUMN "fulfilledAt" TIMESTAMP(3);
ALTER TYPE "CounterOrderStatus" ADD VALUE IF NOT EXISTS 'FULFILLED';

-- Counter order item fulfillment
ALTER TABLE "CounterOrderItem" ADD COLUMN "fulfilledQuantity" INTEGER NOT NULL DEFAULT 0;

-- Create menu sub categories
CREATE TABLE "MenuSubCategory" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "retailerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MenuSubCategory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MenuSubCategory_retailerId_idx" ON "MenuSubCategory"("retailerId");
CREATE INDEX "MenuSubCategory_categoryId_idx" ON "MenuSubCategory"("categoryId");

ALTER TABLE "MenuSubCategory"
  ADD CONSTRAINT "MenuSubCategory_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuSubCategory"
  ADD CONSTRAINT "MenuSubCategory_retailerId_fkey"
  FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuItem"
  ADD CONSTRAINT "MenuItem_subCategoryId_fkey"
  FOREIGN KEY ("subCategoryId") REFERENCES "MenuSubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add selection type for add-on groups
ALTER TABLE "MenuAddOnGroup" ADD COLUMN "selectionType" TEXT NOT NULL DEFAULT 'SINGLE';

-- Create menu types
CREATE TABLE "MenuType" (
  "id" TEXT NOT NULL,
  "retailerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MenuType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "retailerId_menuType" ON "MenuType"("retailerId", "name");
CREATE INDEX "MenuType_retailerId_idx" ON "MenuType"("retailerId");

ALTER TABLE "MenuType"
  ADD CONSTRAINT "MenuType_retailerId_fkey"
  FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuCategory"
  ADD CONSTRAINT "MenuCategory_menuTypeId_fkey"
  FOREIGN KEY ("menuTypeId") REFERENCES "MenuType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
