/*
  Warnings:

  - A unique constraint covering the columns `[shop]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shop]` on the table `Style` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Store_shop_key" ON "Store"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "Style_shop_key" ON "Style"("shop");
