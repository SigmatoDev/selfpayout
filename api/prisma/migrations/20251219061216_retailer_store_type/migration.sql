-- AlterTable
ALTER TABLE "Retailer" ADD COLUMN     "fssaiNumber" TEXT,
ADD COLUMN     "serviceChargePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "storeType" "StoreType" NOT NULL DEFAULT 'RESTAURANT';
