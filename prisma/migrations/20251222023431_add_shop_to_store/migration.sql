/*
  Warnings:

  - You are about to drop the column `domain` on the `Key` table. All the data in the column will be lost.
  - Added the required column `b2bKey` to the `Key` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop` to the `Style` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL DEFAULT 'basic'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Key" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ggKey" TEXT NOT NULL,
    "b2bKey" TEXT NOT NULL,
    "url" TEXT NOT NULL
);
INSERT INTO "new_Key" ("ggKey", "id", "url") SELECT "ggKey", "id", "url" FROM "Key";
DROP TABLE "Key";
ALTER TABLE "new_Key" RENAME TO "Key";
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "onBoarding" JSONB,
    "storeName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "url" TEXT,
    "directions" TEXT,
    "contract" JSONB,
    "source" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "time" JSONB,
    "tags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lat" REAL,
    "lng" REAL
);
INSERT INTO "new_Store" ("address", "city", "code", "contract", "createdAt", "directions", "id", "image", "lat", "lng", "phone", "source", "state", "storeName", "time", "updatedAt", "url", "visibility") SELECT "address", "city", "code", "contract", "createdAt", "directions", "id", "image", "lat", "lng", "phone", "source", "state", "storeName", "time", "updatedAt", "url", "visibility" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
CREATE UNIQUE INDEX "Store_shop_key" ON "Store"("shop");
CREATE TABLE "new_Style" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "primaryFont" TEXT NOT NULL,
    "secondaryFont" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "iconColor" TEXT NOT NULL,
    "shadowColor" TEXT NOT NULL,
    "transparency" INTEGER NOT NULL,
    "blur" INTEGER NOT NULL,
    "anchorx" INTEGER NOT NULL,
    "anchory" INTEGER NOT NULL,
    "cornerRadius" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Style" ("anchorx", "anchory", "backgroundColor", "blur", "color", "cornerRadius", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "transparency", "updatedAt") SELECT "anchorx", "anchory", "backgroundColor", "blur", "color", "cornerRadius", "createdAt", "iconColor", "id", "primaryColor", "primaryFont", "secondaryColor", "secondaryFont", "shadowColor", "transparency", "updatedAt" FROM "Style";
DROP TABLE "Style";
ALTER TABLE "new_Style" RENAME TO "Style";
CREATE UNIQUE INDEX "Style_shop_key" ON "Style"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
