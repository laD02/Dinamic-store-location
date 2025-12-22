/*
  Warnings:

  - You are about to drop the column `onBoarding` on the `Store` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Style_shop_key";

-- CreateTable
CREATE TABLE "OnBoard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "onBoading" JSONB
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
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
INSERT INTO "new_Store" ("address", "city", "code", "contract", "createdAt", "directions", "id", "image", "lat", "lng", "phone", "shop", "source", "state", "storeName", "tags", "time", "updatedAt", "url", "visibility") SELECT "address", "city", "code", "contract", "createdAt", "directions", "id", "image", "lat", "lng", "phone", "shop", "source", "state", "storeName", "tags", "time", "updatedAt", "url", "visibility" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
