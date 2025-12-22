/*
  Warnings:

  - You are about to drop the column `onBoading` on the `OnBoard` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OnBoard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "onBoarding" JSONB
);
INSERT INTO "new_OnBoard" ("id", "shop") SELECT "id", "shop" FROM "OnBoard";
DROP TABLE "OnBoard";
ALTER TABLE "new_OnBoard" RENAME TO "OnBoard";
CREATE UNIQUE INDEX "OnBoard_shop_key" ON "OnBoard"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
