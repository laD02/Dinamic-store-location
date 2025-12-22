/*
  Warnings:

  - A unique constraint covering the columns `[shop]` on the table `OnBoard` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OnBoard_shop_key" ON "OnBoard"("shop");
