/*
  Warnings:

  - You are about to drop the column `createAt` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Store` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Store" ("address", "city", "code", "contract", "directions", "id", "image", "phone", "source", "state", "storeName", "time", "url", "visibility") SELECT "address", "city", "code", "contract", "directions", "id", "image", "phone", "source", "state", "storeName", "time", "url", "visibility" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
