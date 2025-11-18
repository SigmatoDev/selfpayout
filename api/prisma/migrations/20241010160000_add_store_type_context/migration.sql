-- CreateEnum
CREATE TYPE "StoreType" AS ENUM ('KIRANA', 'RESTAURANT', 'TRAIN');

-- AlterTable
ALTER TABLE "SelfCheckoutSession"
ADD COLUMN "storeType" "StoreType" NOT NULL DEFAULT 'KIRANA',
ADD COLUMN "context" JSONB;
