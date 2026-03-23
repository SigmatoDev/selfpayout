-- DropForeignKey
ALTER TABLE "RestaurantTableGroup" DROP CONSTRAINT "RestaurantTableGroup_retailerId_fkey";

-- AddForeignKey
ALTER TABLE "RestaurantTableGroup" ADD CONSTRAINT "RestaurantTableGroup_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "retailerId_tableGroup" RENAME TO "RestaurantTableGroup_retailerId_name_key";
