-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'RETAILER_ADMIN', 'RETAILER_STAFF');

-- CreateEnum
CREATE TYPE "RetailerStatus" AS ENUM ('PENDING_ONBOARDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'CARD');

-- CreateEnum
CREATE TYPE "StoreType" AS ENUM ('KIRANA', 'RESTAURANT', 'TRAIN');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'S3');

-- CreateEnum
CREATE TYPE "InvoiceDeliveryChannel" AS ENUM ('PRINT', 'WHATSAPP', 'PDF', 'EMAIL');

-- CreateEnum
CREATE TYPE "SelfCheckoutStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'PAID', 'APPROVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Retailer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "gstEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gstNumber" TEXT,
    "languagePreference" TEXT NOT NULL DEFAULT 'en',
    "status" "RetailerStatus" NOT NULL DEFAULT 'PENDING_ONBOARDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subscriptionPlanId" TEXT,

    CONSTRAINT "Retailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "retailerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "features" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kyc" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documents" JSONB,
    "reviewerComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "mrp" DOUBLE PRECISION,
    "taxPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "barcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerPhone" TEXT,
    "paymentMode" "PaymentMode" NOT NULL,
    "subtotalAmount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "selfCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "taxPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayPaymentLinkId" TEXT,
    "razorpayPaymentId" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailerSettings" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "storageProvider" "StorageProvider" NOT NULL DEFAULT 'LOCAL',
    "storageBucket" TEXT,
    "storageRegion" TEXT,
    "storage_path_prefix" TEXT,
    "offlineModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "receiptFooter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceDeliveryLog" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "channel" "InvoiceDeliveryChannel" NOT NULL,
    "destination" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "InvoiceDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfCheckoutSession" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "customerPhone" TEXT,
    "kioskDeviceId" TEXT,
    "status" "SelfCheckoutStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "storeType" "StoreType" NOT NULL DEFAULT 'KIRANA',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "securityCode" TEXT NOT NULL,
    "securityVerifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelfCheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfCheckoutItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "taxPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelfCheckoutItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityGateEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "guardId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "attachmentUrl" TEXT,

    CONSTRAINT "SecurityGateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_contactEmail_key" ON "Retailer"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_retailerId_key" ON "Subscription"("retailerId");

-- CreateIndex
CREATE UNIQUE INDEX "Kyc_retailerId_key" ON "Kyc"("retailerId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_retailerId_sku_key" ON "InventoryItem"("retailerId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_retailerId_phone_key" ON "Customer"("retailerId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_selfCheckoutSessionId_key" ON "Invoice"("selfCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailerSettings_retailerId_key" ON "RetailerSettings"("retailerId");

-- CreateIndex
CREATE INDEX "InvoiceDeliveryLog_invoiceId_idx" ON "InvoiceDeliveryLog"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "SelfCheckoutSession_securityCode_key" ON "SelfCheckoutSession"("securityCode");

-- CreateIndex
CREATE INDEX "SelfCheckoutSession_retailerId_idx" ON "SelfCheckoutSession"("retailerId");

-- CreateIndex
CREATE INDEX "SelfCheckoutItem_sessionId_idx" ON "SelfCheckoutItem"("sessionId");

-- CreateIndex
CREATE INDEX "SelfCheckoutItem_inventoryItemId_idx" ON "SelfCheckoutItem"("inventoryItemId");

-- CreateIndex
CREATE INDEX "SecurityGateEvent_sessionId_idx" ON "SecurityGateEvent"("sessionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kyc" ADD CONSTRAINT "Kyc_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_selfCheckoutSessionId_fkey" FOREIGN KEY ("selfCheckoutSessionId") REFERENCES "SelfCheckoutSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerSettings" ADD CONSTRAINT "RetailerSettings_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceDeliveryLog" ADD CONSTRAINT "InvoiceDeliveryLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfCheckoutSession" ADD CONSTRAINT "SelfCheckoutSession_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfCheckoutItem" ADD CONSTRAINT "SelfCheckoutItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SelfCheckoutSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfCheckoutItem" ADD CONSTRAINT "SelfCheckoutItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityGateEvent" ADD CONSTRAINT "SecurityGateEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SelfCheckoutSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
