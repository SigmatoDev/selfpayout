-- DropForeignKey
ALTER TABLE "MenuSubCategory" DROP CONSTRAINT "MenuSubCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "MenuSubCategory" DROP CONSTRAINT "MenuSubCategory_retailerId_fkey";

-- DropForeignKey
ALTER TABLE "MenuType" DROP CONSTRAINT "MenuType_retailerId_fkey";

-- DropForeignKey
ALTER TABLE "RestaurantToken" DROP CONSTRAINT "RestaurantToken_retailerId_fkey";

-- AddForeignKey
ALTER TABLE "RestaurantToken" ADD CONSTRAINT "RestaurantToken_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuType" ADD CONSTRAINT "MenuType_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuSubCategory" ADD CONSTRAINT "MenuSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuSubCategory" ADD CONSTRAINT "MenuSubCategory_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "retailerId_menuType" RENAME TO "MenuType_retailerId_name_key";

-- RenameIndex
ALTER INDEX "retailerId_tokenLabel" RENAME TO "RestaurantToken_retailerId_label_key";
